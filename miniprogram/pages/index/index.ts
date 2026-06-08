import { getWords } from '../../services/word'
import { LanguageCode, LanguageOption, WordWithState } from '../../types/word'
import { StudyStats } from '../../types/storage'
import { LANGUAGE_OPTIONS } from '../../utils/constants'
import { getCurrentLanguage, getStudyStats, setCurrentLanguage } from '../../utils/storage'

interface TaskItem {
  title: string
  value: string
  type: 'primary' | 'warning' | 'success'
  target: 'words' | 'review' | 'chat'
}

interface IndexData {
  language: LanguageOption
  stats: StudyStats
  progressPercent: number
  progressDegree: number
  todayText: string
  nextWord: WordWithState | null
  previewWords: WordWithState[]
  tasks: TaskItem[]
}

function getLanguage() {
  const currentLanguage = getCurrentLanguage()
  return LANGUAGE_OPTIONS.find((item) => item.code === currentLanguage) || LANGUAGE_OPTIONS[0]
}

function getTodayText() {
  const date = new Date()
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function isLanguageCode(code: unknown): code is LanguageCode {
  return LANGUAGE_OPTIONS.some((item) => item.code === code)
}

Component({
  data: {
    language: LANGUAGE_OPTIONS[0],
    stats: {
      total: 0,
      learned: 0,
      favorites: 0,
      reviewed: 0,
    },
    progressPercent: 0,
    progressDegree: 0,
    todayText: '',
    nextWord: null,
    previewWords: [],
    tasks: [],
  } as IndexData,

  pageLifetimes: {
    show() {
      this.refreshHome()
    },
  },

  methods: {
    refreshHome() {
      const language = getLanguage()
      const words = getWords(language.code)
      const stats = getStudyStats(words.length, words.map((word) => word.id))
      const progressPercent = stats.total === 0 ? 0 : Math.round((stats.learned / stats.total) * 100)
      const progressDegree = Math.round(progressPercent * 3.6)
      const unlearnedWords = words.filter((word) => !word.isLearned)

      this.setData({
        language,
        stats,
        progressPercent,
        progressDegree,
        todayText: getTodayText(),
        nextWord: unlearnedWords[0] || null,
        previewWords: unlearnedWords.slice(0, 3),
        tasks: [
          { title: '学习 10 个新词', value: `${Math.min(unlearnedWords.length, 10)}/10`, type: 'primary', target: 'words' },
          { title: '复习生词本', value: `${stats.favorites} 个`, type: 'warning', target: 'review' },
          { title: 'AI 口语练习', value: '5 分钟', type: 'success', target: 'chat' },
        ],
      })
    },
    goLanguage() {
      wx.navigateTo({ url: '/pages/language/language' })
    },
    goWords(event?: WechatMiniprogram.BaseEvent) {
      const { code } = (event?.currentTarget.dataset || {}) as { code?: LanguageCode }

      if (isLanguageCode(code)) {
        setCurrentLanguage(code)
        this.refreshHome()
        wx.navigateTo({ url: `/pages/words/words?language=${code}` })
        return
      }

      wx.navigateTo({ url: `/pages/words/words?language=${this.data.language.code}` })
    },
    goReview() {
      wx.switchTab({ url: '/pages/review/review' })
    },
    goChat() {
      wx.switchTab({ url: '/pages/chat/chat' })
    },
    goVocab() {
      wx.switchTab({ url: '/pages/vocab/vocab' })
    },
    goTask(event: WechatMiniprogram.BaseEvent) {
      const { target } = event.currentTarget.dataset as { target: TaskItem['target'] }
      if (target === 'review') {
        this.goReview()
      } else if (target === 'chat') {
        this.goChat()
      } else {
        this.goWords()
      }
    },
    goNextWord() {
      if (!this.data.nextWord) {
        this.goReview()
        return
      }
      wx.navigateTo({ url: `/pages/word-detail/word-detail?id=${this.data.nextWord.id}` })
    },
    goWordDetail(event: WechatMiniprogram.BaseEvent) {
      const { id } = event.currentTarget.dataset as { id: string }
      wx.navigateTo({ url: `/pages/word-detail/word-detail?id=${id}` })
    },
  },
})
