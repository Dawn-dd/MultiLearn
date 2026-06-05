import { LanguageOption } from '../types/word'

export const STORAGE_KEYS = {
  currentLanguage: 'multilearn.currentLanguage',
  learnedWordIds: 'multilearn.learnedWordIds',
  favoriteWordIds: 'multilearn.favoriteWordIds',
  progressMap: 'multilearn.progressMap',
  chatHistory: 'multilearn.chatHistory',
  pendingChatDraft: 'multilearn.pendingChatDraft',
}

export const DEFAULT_LANGUAGE = 'en'

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'en',
    name: '英语',
    nativeName: 'English',
    level: 'A1',
    dataset: 'vocabularies/en-a1.json',
    description: '适合从日常基础词汇开始。',
  },
  {
    code: 'ja',
    name: '日语',
    nativeName: '日本語',
    level: 'N5',
    dataset: 'vocabularies/ja-n5.json',
    description: '从常见入门词和基础表达开始。',
  },
  {
    code: 'ko',
    name: '韩语',
    nativeName: '한국어',
    level: 'Beginner',
    dataset: 'vocabularies/ko-beginner.json',
    description: '覆盖生活场景里的韩语基础词。',
  },
]

// 替换为阿里云函数计算 HTTP 触发器地址。Qwen API Key 只放后端环境变量。
export const API_BASE_URL = ''
