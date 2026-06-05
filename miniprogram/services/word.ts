import { WordWithState, LanguageCode, VocabularyWord } from '../types/word'
import {
  getCurrentLanguage,
  getFavoriteWordIds,
  getLearnedWordIds,
  getProgressMap,
} from '../utils/storage'

const VOCABULARY_FILES: Record<LanguageCode, string> = {
  en: '/vocabularies/en-a1.json',
  ja: '/vocabularies/ja-n5.json',
  ko: '/vocabularies/ko-beginner.json',
}

const vocabularyCache: Partial<Record<LanguageCode, VocabularyWord[]>> = {}

function readVocabularyFile(language: LanguageCode): string {
  const filePath = VOCABULARY_FILES[language]
  const candidates = [filePath, filePath.slice(1), `.${filePath}`]
  const fs = wx.getFileSystemManager()

  for (const candidate of candidates) {
    try {
      return fs.readFileSync(candidate, 'utf8') as string
    } catch {
      // 部分开发者工具版本对包内文件路径解析不同，首次读取时做轻量兜底。
    }
  }

  throw new Error(`Vocabulary file read failed: ${filePath}`)
}

function getVocabularyWords(language: LanguageCode): VocabularyWord[] {
  const cachedWords = vocabularyCache[language]

  if (cachedWords) {
    return cachedWords
  }

  const content = readVocabularyFile(language)
  const words = JSON.parse(content) as VocabularyWord[]
  vocabularyCache[language] = words
  return words
}

export function getWords(language: LanguageCode = getCurrentLanguage()): WordWithState[] {
  const learnedIds = getLearnedWordIds()
  const favoriteIds = getFavoriteWordIds()
  const progressMap = getProgressMap()

  return getVocabularyWords(language).map((word) => ({
    ...word,
    isLearned: learnedIds.includes(word.id),
    isFavorite: favoriteIds.includes(word.id),
    reviewCount: progressMap[word.id]?.reviewCount || 0,
    lastReviewedAt: progressMap[word.id]?.lastReviewedAt,
  }))
}

export function getVocabularySummary(language: LanguageCode) {
  const words = getVocabularyWords(language)

  return {
    total: words.length,
    wordIds: words.map((word) => word.id),
  }
}

export function getWordById(wordId: string): WordWithState | undefined {
  return getWords().find((word) => word.id === wordId)
}

export function getNextUnlearnedWord(currentWordId: string): WordWithState | undefined {
  const words = getWords()
  const currentIndex = words.findIndex((word) => word.id === currentWordId)
  const orderedWords = currentIndex >= 0
    ? words.slice(currentIndex + 1).concat(words.slice(0, currentIndex + 1))
    : words

  return orderedWords.find((word) => !word.isLearned && word.id !== currentWordId)
}

export function getFavoriteWords(): WordWithState[] {
  return getWords().filter((word) => word.isFavorite)
}

export function getReviewWords(): WordWithState[] {
  const words = getWords()
  const favorites = words.filter((word) => word.isFavorite)
  const unlearned = words.filter((word) => !word.isLearned)
  const pool = favorites.length > 0 ? favorites : unlearned

  return pool.length > 0 ? pool : words
}
