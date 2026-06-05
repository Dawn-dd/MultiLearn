import { ChatRequest, ChatResponse } from '../types/api'
import { request } from './request'

export function sendChatMessage(data: ChatRequest): Promise<ChatResponse> {
  return request<ChatResponse, ChatRequest>({
    url: '/chat',
    method: 'POST',
    data,
  })
}
