import { getWords } from '../../services/word'
import { StudyStats } from '../../types/storage'
import { LanguageOption } from '../../types/word'
import { API_BASE_URL, LANGUAGE_OPTIONS } from '../../utils/constants'
import {
  clearChatHistory,
  clearStudyStorage,
  getChatHistory,
  getCurrentLanguage,
  getFavoriteWordIds,
  getLearnedWordIds,
  getProgressMap,
  getStudyStats,
} from '../../utils/storage'

interface ProfileData {
  language: LanguageOption
  avatarText: string
  stats: StudyStats
  progressPercent: number
  chatCount: number
  backendStatus: string
}

Component({
  data: {
    language: LANGUAGE_OPTIONS[0],
    avatarText: 'D',
    stats: {
      total: 0,
      learned: 0,
      favorites: 0,
      reviewed: 0,
    },
    progressPercent: 0,
    chatCount: 0,
    backendStatus: '待配置',
  } as ProfileData,

  pageLifetimes: {
    show() {
      this.refreshProfile()
    },
  },

  methods: {
    refreshProfile() {
      const currentLanguage = getCurrentLanguage()
      const language = LANGUAGE_OPTIONS.find((item) => item.code === currentLanguage) || LANGUAGE_OPTIONS[0]
      const words = getWords(currentLanguage)
      const stats = getStudyStats(words.length, words.map((word) => word.id))
      this.setData({
        language,
        avatarText: language.name.slice(0, 1),
        stats,
        progressPercent: stats.total === 0 ? 0 : Math.round((stats.learned / stats.total) * 100),
        chatCount: getChatHistory().length,
        backendStatus: API_BASE_URL ? '已配置' : '待配置',
      })
    },
    goLanguage() {
      wx.navigateTo({ url: '/pages/language/language' })
    },
    goVocab() {
      wx.switchTab({ url: '/pages/vocab/vocab' })
    },
    goWords() {
      wx.navigateTo({ url: '/pages/words/words' })
    },
    goReview() {
      wx.switchTab({ url: '/pages/review/review' })
    },
    goChat() {
      wx.switchTab({ url: '/pages/chat/chat' })
    },
    exportData() {
      const data = JSON.stringify({
        currentLanguage: getCurrentLanguage(),
        learnedWordIds: getLearnedWordIds(),
        favoriteWordIds: getFavoriteWordIds(),
        progressMap: getProgressMap(),
        chatHistory: getChatHistory(),
      }, null, 2)

      wx.setClipboardData({
        data,
        success: () => wx.showToast({ title: '已复制学习数据', icon: 'success' }),
      })
    },
    confirmClearChat() {
      wx.showModal({
        title: '清空 AI 对话',
        content: '只会删除本地 AI 对话记录，不影响学习进度。',
        confirmText: '清空',
        confirmColor: '#EF4444',
        success: (res) => {
          if (!res.confirm) return
          clearChatHistory()
          this.refreshProfile()
          wx.showToast({ title: '已清空', icon: 'success' })
        },
      })
    },
    confirmClear() {
      wx.showModal({
        title: '清空本地学习数据',
        content: '会删除已学、生词、复习记录和 AI 对话记录。',
        confirmText: '清空',
        confirmColor: '#EF4444',
        success: (res) => {
          if (!res.confirm) return
          clearStudyStorage()
          this.refreshProfile()
          wx.showToast({ title: '已清空', icon: 'success' })
        },
      })
    },
  },
})
