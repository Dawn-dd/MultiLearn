import { ChatMessage, ReviewHistoryItem, StudyStats, WordProgress } from '../types/storage'
import { LanguageCode } from '../types/word'
import { DEFAULT_LANGUAGE, STORAGE_KEYS } from './constants'

function getValue<T>(key: string, fallback: T): T {
  const value = wx.getStorageSync(key)
  return value === '' || value === undefined || value === null ? fallback : value as T
}

function setValue<T>(key: string, value: T) {
  wx.setStorageSync(key, value)
}

export function getCurrentLanguage(): LanguageCode {
  return getValue<LanguageCode>(STORAGE_KEYS.currentLanguage, DEFAULT_LANGUAGE)
}

export function setCurrentLanguage(language: LanguageCode) {
  setValue(STORAGE_KEYS.currentLanguage, language)
}

export function getLearnedWordIds(): string[] {
  return getValue<string[]>(STORAGE_KEYS.learnedWordIds, [])
}

export function getFavoriteWordIds(): string[] {
  return getValue<string[]>(STORAGE_KEYS.favoriteWordIds, [])
}

export function getProgressMap(): Record<string, WordProgress> {
  return getValue<Record<string, WordProgress>>(STORAGE_KEYS.progressMap, {})
}

export function getProgress(wordId: string): WordProgress | undefined {
  return getProgressMap()[wordId]
}

export function getChatHistory(): ChatMessage[] {
  return getValue<ChatMessage[]>(STORAGE_KEYS.chatHistory, [])
}

export function saveChatHistory(history: ChatMessage[]) {
  setValue(STORAGE_KEYS.chatHistory, history)
}

export function clearChatHistory() {
  wx.removeStorageSync(STORAGE_KEYS.chatHistory)
}

export function setPendingChatDraft(draft: string) {
  setValue(STORAGE_KEYS.pendingChatDraft, draft)
}

export function takePendingChatDraft(): string {
  const draft = getValue<string>(STORAGE_KEYS.pendingChatDraft, '')
  wx.removeStorageSync(STORAGE_KEYS.pendingChatDraft)
  return draft
}

export function markWordLearned(wordId: string) {
  const learnedIds = getLearnedWordIds()
  const progressMap = getProgressMap()

  if (!learnedIds.includes(wordId)) {
    learnedIds.push(wordId)
  }

  progressMap[wordId] = {
    ...(progressMap[wordId] || {}),
    wordId,
    learnedAt: progressMap[wordId]?.learnedAt || Date.now(),
    reviewCount: progressMap[wordId]?.reviewCount || 0,
    lastReviewedAt: progressMap[wordId]?.lastReviewedAt,
    difficultCount: progressMap[wordId]?.difficultCount || 0,
  }

  setValue(STORAGE_KEYS.learnedWordIds, learnedIds)
  setValue(STORAGE_KEYS.progressMap, progressMap)
}

export function addFavoriteWord(wordId: string) {
  const favoriteIds = getFavoriteWordIds()
  if (favoriteIds.includes(wordId)) return
  setValue(STORAGE_KEYS.favoriteWordIds, favoriteIds.concat(wordId))
}

export function removeFavoriteWord(wordId: string) {
  setValue(STORAGE_KEYS.favoriteWordIds, getFavoriteWordIds().filter((id) => id !== wordId))
}

export function toggleFavoriteWord(wordId: string): boolean {
  const favoriteIds = getFavoriteWordIds()
  const nextFavorite = !favoriteIds.includes(wordId)
  const nextIds = nextFavorite
    ? favoriteIds.concat(wordId)
    : favoriteIds.filter((id) => id !== wordId)

  setValue(STORAGE_KEYS.favoriteWordIds, nextIds)
  return nextFavorite
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function addDays(days: number) {
  const date = new Date(startOfToday())
  date.setDate(date.getDate() + days)
  return date.getTime()
}

function getKnownDelayDays(reviewCount: number) {
  if (reviewCount <= 1) return 1
  if (reviewCount === 2) return 3
  if (reviewCount === 3) return 7
  return 14
}

function removeLearnedWord(wordId: string) {
  setValue(STORAGE_KEYS.learnedWordIds, getLearnedWordIds().filter((id) => id !== wordId))
}

export function recordReview(wordId: string, remembered: boolean) {
  const progressMap = getProgressMap()
  const current = progressMap[wordId] || {
    wordId,
    reviewCount: 0,
    difficultCount: 0,
  }
  const reviewedAt = Date.now()
  const nextReviewAt = remembered
    ? addDays(getKnownDelayDays(current.reviewCount + 1))
    : addDays(1)
  const historyItem: ReviewHistoryItem = {
    reviewedAt,
    remembered,
    nextReviewAt,
  }

  progressMap[wordId] = {
    ...current,
    reviewCount: current.reviewCount + 1,
    lastReviewedAt: reviewedAt,
    nextReviewAt,
    difficultCount: remembered ? current.difficultCount : current.difficultCount + 1,
    lastResult: remembered ? 'known' : 'unknown',
    reviewHistory: (current.reviewHistory || []).concat(historyItem).slice(-30),
  }

  setValue(STORAGE_KEYS.progressMap, progressMap)

  if (remembered) {
    markWordLearned(wordId)
  } else {
    removeLearnedWord(wordId)
    addFavoriteWord(wordId)
  }
}

export function recordInitialStudy(wordId: string, remembered: boolean) {
  const progressMap = getProgressMap()
  const current = progressMap[wordId] || {
    wordId,
    reviewCount: 0,
    difficultCount: 0,
  }
  const reviewedAt = Date.now()
  const nextReviewAt = addDays(1)
  const historyItem: ReviewHistoryItem = {
    reviewedAt,
    remembered,
    nextReviewAt,
  }

  progressMap[wordId] = {
    ...current,
    learnedAt: remembered ? current.learnedAt || reviewedAt : current.learnedAt,
    reviewCount: current.reviewCount + 1,
    lastReviewedAt: reviewedAt,
    nextReviewAt,
    difficultCount: remembered ? current.difficultCount : current.difficultCount + 1,
    lastResult: remembered ? 'known' : 'unknown',
    reviewHistory: (current.reviewHistory || []).concat(historyItem).slice(-30),
  }

  setValue(STORAGE_KEYS.progressMap, progressMap)

  if (remembered) {
    const learnedIds = getLearnedWordIds()
    if (!learnedIds.includes(wordId)) {
      setValue(STORAGE_KEYS.learnedWordIds, learnedIds.concat(wordId))
    }
  } else {
    removeLearnedWord(wordId)
    addFavoriteWord(wordId)
  }
}

export function isReviewDue(progress?: WordProgress) {
  return Boolean(progress?.nextReviewAt && progress.nextReviewAt <= Date.now())
}

export function getStudyStats(total: number, wordIds: string[] = []): StudyStats {
  const progressMap = getProgressMap()
  const scope = new Set(wordIds)
  const inScope = (wordId: string) => scope.size === 0 || scope.has(wordId)

  return {
    total,
    learned: getLearnedWordIds().filter(inScope).length,
    favorites: getFavoriteWordIds().filter(inScope).length,
    reviewed: Object.keys(progressMap).filter((id) => inScope(id) && progressMap[id].reviewCount > 0).length,
  }
}

export function clearStudyStorage() {
  Object.keys(STORAGE_KEYS).forEach((key) => {
    wx.removeStorageSync(STORAGE_KEYS[key as keyof typeof STORAGE_KEYS])
  })
}
