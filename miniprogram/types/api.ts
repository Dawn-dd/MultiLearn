import { ChatMessage } from './storage'
import { LanguageCode } from './word'

export interface RequestConfig<TData> {
  url: string
  method?: 'GET' | 'POST'
  data?: TData
  header?: Record<string, string>
}

export interface ChatRequest {
  language: LanguageCode
  message: string
  history: ChatMessage[]
}

export interface ChatResponse {
  reply: string
}
