import { ChatRequest, ChatResponse } from '../types/api'
import { chatWithAi } from '../utils/ai'

export async function sendChatMessage(data: ChatRequest): Promise<ChatResponse> {
  const response = await chatWithAi(data.language, data.message, data.history)
  return {
    reply: response.data,
  }
}
