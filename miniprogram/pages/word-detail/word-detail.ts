import { explainWord } from '../../utils/ai'
import { getNextUnlearnedWord, getWordById } from '../../utils/vocab'
import { WordWithState } from '../../types/word'
import { getCurrentLanguage, recordInitialStudy, toggleFavoriteWord } from '../../utils/storage'

const wordAssetMap: Record<string, string> = {
  apple: '/assets/candy/apple.png',
  book: '/assets/candy/book.png',
  cat: '/assets/candy/cat.png',
  dog: '/assets/candy/dog.png',
  egg: '/assets/candy/egg.png',
}

interface WordDetailData {
  wordId: string
  word: WordWithState | null
  statusText: string
  favoriteText: string
  reviewText: string
  nextReviewText: string
  partOfSpeechText: string
  detailInitial: string
  detailAsset: string
  aiAnswer: string
  aiLoading: boolean
}

function formatDate(timestamp?: number) {
  if (!timestamp) return '暂无记录'
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function getPartOfSpeechText(word?: WordWithState | null) {
  if (!word) return '未标注'
  return word.partOfSpeech || word.tags[0] || '未标注'
}

Component({
  data: {
    wordId: '',
    word: null,
    statusText: '未掌握',
    favoriteText: '加入生词本',
    reviewText: '暂无记录',
    nextReviewText: '点击认识或不认识后生成',
    partOfSpeechText: '未标注',
    detailInitial: '',
    detailAsset: '',
    aiAnswer: '',
    aiLoading: false,
  } as WordDetailData,

  methods: {
    onLoad(options: Record<string, string | undefined>) {
      const wordId = options.id || ''
      this.setData({ wordId })
      this.refreshWord(wordId)
    },
    refreshWord(wordId: string) {
      const word = getWordById(wordId) || null
      this.setData({
        word,
        statusText: word?.isLearned ? '已掌握' : '未掌握',
        favoriteText: word?.isFavorite ? '移出生词本' : '加入生词本',
        reviewText: word ? formatDate(word.lastReviewedAt) : '暂无记录',
        nextReviewText: word?.nextReviewAt ? formatDate(word.nextReviewAt) : '点击认识或不认识后生成',
        partOfSpeechText: getPartOfSpeechText(word),
        detailInitial: word?.word.slice(0, 1).toUpperCase() || '',
        detailAsset: word ? wordAssetMap[word.word.toLowerCase()] || '' : '',
      })
    },
    markKnown() {
      if (!this.data.wordId) return
      recordInitialStudy(this.data.wordId, true)
      this.refreshWord(this.data.wordId)
      wx.showToast({ title: '明天复习', icon: 'success' })
    },
    markUnknown() {
      if (!this.data.wordId) return
      recordInitialStudy(this.data.wordId, false)
      this.refreshWord(this.data.wordId)
      wx.showToast({ title: '已加入生词本', icon: 'success' })
    },
    copyWord() {
      if (!this.data.word) return
      wx.setClipboardData({
        data: this.data.word.word,
        success: () => wx.showToast({ title: '已复制单词', icon: 'success' }),
      })
    },
    toggleFavorite() {
      if (!this.data.wordId) return
      const isFavorite = toggleFavoriteWord(this.data.wordId)
      this.refreshWord(this.data.wordId)
      wx.showToast({ title: isFavorite ? '已加入生词本' : '已移出', icon: 'success' })
    },
    async askAi() {
      if (!this.data.word || this.data.aiLoading) return
      this.setData({ aiLoading: true, aiAnswer: '' })

      try {
        const response = await explainWord(getCurrentLanguage(), this.data.word.word)
        this.setData({ aiAnswer: response.data })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'AI 解释失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ aiLoading: false })
      }
    },
    playAudio() {
      wx.showToast({ title: '第一版暂未接入发音', icon: 'none' })
    },
    goNextWord() {
      const nextWord = getNextUnlearnedWord(this.data.wordId)
      if (!nextWord) {
        wx.showToast({ title: '没有未学单词了', icon: 'none' })
        return
      }
      this.setData({ wordId: nextWord.id, aiAnswer: '' })
      this.refreshWord(nextWord.id)
    },
    goWords() {
      wx.navigateTo({ url: '/pages/words/words' })
    },
  },
})
