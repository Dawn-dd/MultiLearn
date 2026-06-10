const cloud = require('wx-server-sdk')
const OpenAI = require('openai')
const OpenAIClient = OpenAI.default || OpenAI

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const HUNYUAN_BASE_URL = 'https://api.hunyuan.cloud.tencent.com/v1'
const DEFAULT_MODEL = 'hunyuan-turbos-latest'

const languageLabels = {
  en: '英语',
  ja: '日语',
  ko: '韩语',
}

function success(data) {
  return {
    success: true,
    data,
  }
}

function failure(error) {
  return {
    success: false,
    error,
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeLanguage(language) {
  return languageLabels[language] ? language : 'en'
}

function buildMessages(event) {
  const action = event.action
  const language = normalizeLanguage(event.language)
  const languageName = languageLabels[language]

  if (action === 'chat') {
    if (!isNonEmptyString(event.message)) {
      throw new Error('缺少 message 参数')
    }

    const history = Array.isArray(event.history) ? event.history : []
    const recentHistory = history
      .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && isNonEmptyString(item.content))
      .slice(-8)
      .map((item) => ({
        role: item.role,
        content: String(item.content).trim(),
      }))

    return [
      {
        role: 'system',
        content: `你是一个耐心的多语种学习伙伴，当前教学语言是${languageName}。请用适合初学者的中文解释和目标语言练习来回复，保持简洁、友好、可练习。`,
      },
      ...recentHistory,
      {
        role: 'user',
        content: event.message.trim(),
      },
    ]
  }

  if (action === 'explain') {
    if (!isNonEmptyString(event.word)) {
      throw new Error('缺少 word 参数')
    }

    return [
      {
        role: 'system',
        content: `你是${languageName}单词老师，请用中文给初学者讲解。`,
      },
      {
        role: 'user',
        content: `请解释这个${languageName}单词：${event.word.trim()}。包含含义、发音提示、常见用法和 2 个简单例句。`,
      },
    ]
  }

  if (action === 'exercise') {
    if (!isNonEmptyString(event.word)) {
      throw new Error('缺少 word 参数')
    }

    return [
      {
        role: 'system',
        content: `你是${languageName}练习题出题老师，题目要适合初学者。`,
      },
      {
        role: 'user',
        content: `请围绕单词「${event.word.trim()}」生成 3 道练习题，并给出答案和简短解析。`,
      },
    ]
  }

  if (action === 'correct') {
    if (!isNonEmptyString(event.text)) {
      throw new Error('缺少 text 参数')
    }

    return [
      {
        role: 'system',
        content: `你是${languageName}写作纠错老师，请指出问题并给出自然表达。`,
      },
      {
        role: 'user',
        content: `请修改这句${languageName}表达，并用中文说明原因：${event.text.trim()}`,
      },
    ]
  }

  throw new Error('未知 action 参数')
}

function getReplyContent(completion) {
  const content = completion && completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content
  if (!isNonEmptyString(content)) {
    throw new Error('模型返回内容为空')
  }

  return content.trim()
}

exports.main = async (event) => {
  try {
    const apiKey = process.env.HUNYUAN_API_KEY
    if (!isNonEmptyString(apiKey)) {
      return failure('云函数未配置 HUNYUAN_API_KEY')
    }

    const messages = buildMessages(event || {})
    const client = new OpenAIClient({
      apiKey,
      baseURL: HUNYUAN_BASE_URL,
    })

    const completion = await client.chat.completions.create({
      model: process.env.HUNYUAN_MODEL || DEFAULT_MODEL,
      messages,
      temperature: 0.7,
    })

    return success(getReplyContent(completion))
  } catch (error) {
    return failure(error instanceof Error ? error.message : 'AI 请求失败')
  }
}
