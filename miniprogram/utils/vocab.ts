import { WordWithState, LanguageCode, VocabularyWord } from '../types/word'
import {
  getCurrentLanguage,
  getFavoriteWordIds,
  getLearnedWordIds,
  getProgressMap,
  isReviewDue,
} from './storage'

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
      // Different developer-tool versions resolve package paths slightly differently.
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

function withState(word: VocabularyWord, learnedIds: string[], favoriteIds: string[], progressMap: ReturnType<typeof getProgressMap>): WordWithState {
  const progress = progressMap[word.id]

  return {
    ...word,
    isLearned: learnedIds.includes(word.id),
    isFavorite: favoriteIds.includes(word.id),
    reviewCount: progress?.reviewCount || 0,
    difficultCount: progress?.difficultCount || 0,
    lastReviewedAt: progress?.lastReviewedAt,
    nextReviewAt: progress?.nextReviewAt,
    isReviewDue: isReviewDue(progress),
  }
}

export function getWords(language: LanguageCode = getCurrentLanguage()): WordWithState[] {
  const learnedIds = getLearnedWordIds()
  const favoriteIds = getFavoriteWordIds()
  const progressMap = getProgressMap()

  return getVocabularyWords(language).map((word) => withState(word, learnedIds, favoriteIds, progressMap))
}

export function getVocabularySummary(language: LanguageCode) {
  const words = getVocabularyWords(language)

  return {
    total: words.length,
    wordIds: words.map((word) => word.id),
  }
}

export function getWordById(wordId: string, language: LanguageCode = getCurrentLanguage()): WordWithState | undefined {
  return getWords(language).find((word) => word.id === wordId)
}

export function getNextUnlearnedWord(currentWordId: string, language: LanguageCode = getCurrentLanguage()): WordWithState | undefined {
  const words = getWords(language)
  const currentIndex = words.findIndex((word) => word.id === currentWordId)
  const orderedWords = currentIndex >= 0
    ? words.slice(currentIndex + 1).concat(words.slice(0, currentIndex + 1))
    : words

  return orderedWords.find((word) => !word.isLearned && word.id !== currentWordId)
}

export function getFavoriteWords(language: LanguageCode = getCurrentLanguage()): WordWithState[] {
  return getWords(language).filter((word) => word.isFavorite)
}

export function getTodayReviewWords(language: LanguageCode = getCurrentLanguage()): WordWithState[] {
  return getWords(language)
    .filter((word) => word.isReviewDue)
    .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0))
}

export function getReviewWords(language: LanguageCode = getCurrentLanguage()): WordWithState[] {
  return getTodayReviewWords(language)
}
