import { ChatMessage } from '../types/storage'
import { LanguageCode } from '../types/word'

export type AiAction = 'chat' | 'explain' | 'exercise' | 'correct'

export interface AiSuccessResponse {
  success: true
  data: string
}

export interface AiFailureResponse {
  success: false
  error: string
}

export type AiResponse = AiSuccessResponse | AiFailureResponse

export interface AiChatRequest {
  action: 'chat'
  language: LanguageCode
  message: string
  history?: ChatMessage[]
}

export interface AiWordRequest {
  action: 'explain' | 'exercise'
  language: LanguageCode
  word: string
}

export interface AiCorrectRequest {
  action: 'correct'
  language: LanguageCode
  text: string
}

export type AiRequest = AiChatRequest | AiWordRequest | AiCorrectRequest

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseAiResponse(value: unknown): AiResponse {
  if (!isRecord(value) || typeof value.success !== 'boolean') {
    return {
      success: false,
      error: 'AI 后端返回格式不正确',
    }
  }

  if (value.success === true) {
    return {
      success: true,
      data: typeof value.data === 'string' ? value.data : '',
    }
  }

  return {
    success: false,
    error: typeof value.error === 'string' && value.error ? value.error : 'AI 请求失败',
  }
}

export async function requestAi(data: AiRequest): Promise<AiSuccessResponse> {
  if (!wx.cloud) {
    throw new Error('当前基础库不支持云开发')
  }

  const response = await wx.cloud.callFunction({
    name: 'hunyuan-proxy',
    data,
  })
  const result = parseAiResponse(response.result as unknown)

  if (!result.success) {
    throw new Error(result.error)
  }

  if (!result.data) {
    throw new Error('AI 后端返回内容为空')
  }

  return result
}

export function chatWithAi(language: LanguageCode, message: string, history: ChatMessage[]): Promise<AiSuccessResponse> {
  return requestAi({
    action: 'chat',
    language,
    message,
    history,
  })
}

export function explainWord(language: LanguageCode, word: string): Promise<AiSuccessResponse> {
  return requestAi({
    action: 'explain',
    language,
    word,
  })
}

export function generateExercise(language: LanguageCode, word: string): Promise<AiSuccessResponse> {
  return requestAi({
    action: 'exercise',
    language,
    word,
  })
}

export function correctSentence(language: LanguageCode, text: string): Promise<AiSuccessResponse> {
  return requestAi({
    action: 'correct',
    language,
    text,
  })
}
