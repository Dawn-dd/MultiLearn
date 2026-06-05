import { getReviewWords } from '../../services/word'
import { WordWithState } from '../../types/word'
import { recordReview } from '../../utils/storage'

interface ReviewData {
  reviewWords: WordWithState[]
  currentWord: WordWithState | null
  currentIndex: number
  showAnswer: boolean
  completed: boolean
  isEmpty: boolean
  progressPercent: number
  rememberedCount: number
  difficultCount: number
  sourceText: string
}

function getSourceText(words: WordWithState[]) {
  const favoriteCount = words.filter((word) => word.isFavorite).length
  return favoriteCount > 0 ? `优先复习 ${favoriteCount} 个生词` : '暂无生词，先复习未掌握单词'
}

Component({
  data: {
    reviewWords: [],
    currentWord: null,
    currentIndex: 0,
    showAnswer: false,
    completed: false,
    isEmpty: false,
    progressPercent: 0,
    rememberedCount: 0,
    difficultCount: 0,
    sourceText: '准备复习',
  } as ReviewData,

  pageLifetimes: {
    show() {
      this.loadReview()
    },
  },

  methods: {
    loadReview() {
      const reviewWords = getReviewWords()
      this.setData({
        reviewWords,
        currentWord: reviewWords[0] || null,
        currentIndex: 0,
        showAnswer: false,
        completed: false,
        isEmpty: reviewWords.length === 0,
        progressPercent: 0,
        rememberedCount: 0,
        difficultCount: 0,
        sourceText: getSourceText(reviewWords),
      })
    },
    toggleAnswer() {
      this.setData({ showAnswer: !this.data.showAnswer })
    },
    markRemembered() {
      this.moveNext(true)
    },
    markDifficult() {
      this.moveNext(false)
    },
    moveNext(remembered: boolean) {
      if (!this.data.currentWord) return
      recordReview(this.data.currentWord.id, remembered)

      const nextIndex = this.data.currentIndex + 1
      const completed = nextIndex >= this.data.reviewWords.length
      this.setData({
        currentIndex: nextIndex,
        currentWord: completed ? null : this.data.reviewWords[nextIndex],
        showAnswer: false,
        completed,
        progressPercent: this.data.reviewWords.length === 0 ? 0 : Math.round((nextIndex / this.data.reviewWords.length) * 100),
        rememberedCount: remembered ? this.data.rememberedCount + 1 : this.data.rememberedCount,
        difficultCount: remembered ? this.data.difficultCount : this.data.difficultCount + 1,
      })
    },
    restart() {
      this.loadReview()
    },
    goDetail() {
      if (!this.data.currentWord) return
      wx.navigateTo({ url: `/pages/word-detail/word-detail?id=${this.data.currentWord.id}` })
    },
    goWords() {
      wx.navigateTo({ url: '/pages/words/words' })
    },
    goVocab() {
      wx.switchTab({ url: '/pages/vocab/vocab' })
    },
  },
})
