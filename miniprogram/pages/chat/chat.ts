import { sendChatMessage } from '../../services/ai'
import { ChatMessage } from '../../types/storage'
import { LANGUAGE_OPTIONS } from '../../utils/constants'
import {
  clearChatHistory,
  getChatHistory,
  getCurrentLanguage,
  saveChatHistory,
  takePendingChatDraft,
} from '../../utils/storage'

interface ChatData {
  messages: ChatMessage[]
  draft: string
  sending: boolean
  scrollTarget: string
  languageName: string
  prompts: string[]
}

function createMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    role,
    content,
    createdAt: Date.now(),
  }
}

Component({
  data: {
    messages: [],
    draft: '',
    sending: false,
    scrollTarget: '',
    languageName: '英语',
    prompts: ['点餐', '旅行', '自我介绍', '帮我复习'],
  } as ChatData,

  pageLifetimes: {
    show() {
      const language = getCurrentLanguage()
      const option = LANGUAGE_OPTIONS.find((item) => item.code === language) || LANGUAGE_OPTIONS[0]
      const pendingDraft = takePendingChatDraft()
      this.setData({
        messages: getChatHistory(),
        languageName: option.name,
        draft: pendingDraft || this.data.draft,
      })
      this.scrollToBottom()
    },
  },

  methods: {
    onInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ draft: event.detail.value })
    },
    usePrompt(event: WechatMiniprogram.BaseEvent) {
      const { text } = event.currentTarget.dataset as { text: string }
      const promptMap: Record<string, string> = {
        点餐: `请陪我用${this.data.languageName}练习咖啡店点餐。`,
        旅行: `请陪我用${this.data.languageName}练习旅行问路。`,
        自我介绍: `请陪我用${this.data.languageName}练习一段简单自我介绍。`,
        帮我复习: `请用问答方式帮我复习${this.data.languageName}基础词汇。`,
      }
      this.setData({ draft: promptMap[text] || text })
    },
    async sendMessage() {
      const content = this.data.draft.trim()
      if (!content || this.data.sending) return

      const userMessage = createMessage('user', content)
      const messages = this.data.messages.concat(userMessage)
      this.setData({ messages, draft: '', sending: true })
      saveChatHistory(messages)
      this.scrollToBottom()

      try {
        const response = await sendChatMessage({
          language: getCurrentLanguage(),
          message: content,
          history: messages,
        })
        this.appendAssistantMessage(response.reply)
      } catch {
        this.appendAssistantMessage('AI 暂时没有回复。你可以稍后再试，或换个问题继续练习。')
      }
    },
    appendAssistantMessage(content: string) {
      const nextMessages = this.data.messages.concat(createMessage('assistant', content))
      this.setData({ messages: nextMessages, sending: false })
      saveChatHistory(nextMessages)
      this.scrollToBottom()
    },
    scrollToBottom() {
      const last = this.data.messages[this.data.messages.length - 1]
      if (last) this.setData({ scrollTarget: `msg-${last.id}` })
    },
    clearMessages() {
      if (this.data.messages.length === 0) return
      wx.showModal({
        title: '清空对话',
        content: '会删除本地保存的 AI 对话记录。',
        confirmText: '清空',
        confirmColor: '#EF4444',
        success: (res) => {
          if (!res.confirm) return
          clearChatHistory()
          this.setData({ messages: [], scrollTarget: '' })
          wx.showToast({ title: '已清空', icon: 'success' })
        },
      })
    },
  },
})
