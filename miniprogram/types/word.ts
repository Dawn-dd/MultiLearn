export type LanguageCode = 'en' | 'ja' | 'ko'

export type WordLevel = 'A1' | 'N5' | 'Beginner'

export interface LanguageOption {
  code: LanguageCode
  name: string
  nativeName: string
  level: WordLevel
  dataset: string
  description: string
}

export interface VocabularyWord {
  id: string
  language: LanguageCode
  level: WordLevel
  word: string
  pronunciation: string
  meaning: string
  example: string
  exampleMeaning: string
  tags: string[]
}

export interface WordWithState extends VocabularyWord {
  isLearned: boolean
  isFavorite: boolean
  reviewCount: number
  lastReviewedAt?: number
}
