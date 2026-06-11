import { LanguageCode } from './word'

export interface WordProgress {
  wordId: string
  learnedAt?: number
  reviewCount: number
  lastReviewedAt?: number
  nextReviewAt?: number
  difficultCount: number
  lastResult?: 'known' | 'unknown'
  reviewHistory?: ReviewHistoryItem[]
}

export interface ReviewHistoryItem {
  reviewedAt: number
  remembered: boolean
  nextReviewAt: number
}

export interface StudyStorage {
  currentLanguage: LanguageCode
  learnedWordIds: string[]
  favoriteWordIds: string[]
  progressMap: Record<string, WordProgress>
  chatHistory: ChatMessage[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

export interface StudyStats {
  total: number
  learned: number
  favorites: number
  reviewed: number
}
