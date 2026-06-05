import { getFavoriteWords } from '../../services/word'
import { WordWithState } from '../../types/word'
import { LANGUAGE_OPTIONS } from '../../utils/constants'
import { getCurrentLanguage, toggleFavoriteWord } from '../../utils/storage'

interface VocabData {
  words: WordWithState[]
  visibleWords: WordWithState[]
  keyword: string
  languageName: string
  learnedCount: number
}

function filterWords(words: WordWithState[], keyword: string) {
  const text = keyword.trim().toLowerCase()
  if (!text) return words
  return words.filter((word) => (
    word.word.toLowerCase().includes(text)
    || word.meaning.includes(text)
    || word.pronunciation.toLowerCase().includes(text)
  ))
}

Component({
  data: {
    words: [],
    visibleWords: [],
    keyword: '',
    languageName: '英语',
    learnedCount: 0,
  } as VocabData,

  pageLifetimes: {
    show() {
      this.refreshWords()
    },
  },

  methods: {
    refreshWords() {
      const currentLanguage = getCurrentLanguage()
      const language = LANGUAGE_OPTIONS.find((item) => item.code === currentLanguage) || LANGUAGE_OPTIONS[0]
      const words = getFavoriteWords()
      this.setData({
        words,
        visibleWords: filterWords(words, this.data.keyword),
        languageName: language.name,
        learnedCount: words.filter((word) => word.isLearned).length,
      })
    },
    onSearch(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const { value } = event.detail
      this.setData({
        keyword: value,
        visibleWords: filterWords(this.data.words, value),
      })
    },
    clearSearch() {
      this.setData({
        keyword: '',
        visibleWords: this.data.words,
      })
    },
    goDetail(event: WechatMiniprogram.BaseEvent) {
      const { id } = event.currentTarget.dataset as { id: string }
      wx.navigateTo({ url: `/pages/word-detail/word-detail?id=${id}` })
    },
    removeFavorite(event: WechatMiniprogram.BaseEvent) {
      const { id } = event.currentTarget.dataset as { id: string }
      wx.showModal({
        title: '移出生词本',
        content: '这个词会从生词本移除，但学习记录会保留。',
        confirmText: '移除',
        confirmColor: '#EF4444',
        success: (res) => {
          if (!res.confirm) return
          toggleFavoriteWord(id)
          this.refreshWords()
          wx.showToast({ title: '已移除', icon: 'success' })
        },
      })
    },
    goWords() {
      wx.navigateTo({ url: '/pages/words/words' })
    },
    goReview() {
      wx.switchTab({ url: '/pages/review/review' })
    },
  },
})
