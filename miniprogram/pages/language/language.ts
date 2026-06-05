import { getVocabularySummary } from '../../services/word'
import { LanguageCode, LanguageOption } from '../../types/word'
import { LANGUAGE_OPTIONS } from '../../utils/constants'
import { getCurrentLanguage, getStudyStats, setCurrentLanguage } from '../../utils/storage'

interface LanguageCard extends LanguageOption {
  total: number
  learned: number
  progressPercent: number
  sample: string
  tone: string
  label: string
}

interface LanguageData {
  languages: LanguageCard[]
  currentLanguage: LanguageCode
  selectedLanguage: LanguageCode
  isLoading: boolean
  skeletonRows: number[]
}

const samples: Record<LanguageCode, string> = {
  en: 'Good morning',
  ja: 'おはよう',
  ko: '안녕하세요',
}

const tones: Record<LanguageCode, string> = {
  en: 'blue',
  ja: 'pink',
  ko: 'orange',
}

function buildLanguageCards(): LanguageCard[] {
  return LANGUAGE_OPTIONS.map((language) => {
    const summary = getVocabularySummary(language.code)
    const stats = getStudyStats(summary.total, summary.wordIds)
    return {
      ...language,
      total: stats.total,
      learned: stats.learned,
      progressPercent: stats.total === 0 ? 0 : Math.round((stats.learned / stats.total) * 100),
      sample: samples[language.code],
      tone: tones[language.code],
      label: `${language.code.toUpperCase()} · ${language.level}`,
    }
  })
}

Component({
  data: {
    languages: [],
    currentLanguage: getCurrentLanguage(),
    selectedLanguage: getCurrentLanguage(),
    isLoading: true,
    skeletonRows: [1, 2, 3],
  } as LanguageData,

  pageLifetimes: {
    show() {
      const currentLanguage = getCurrentLanguage()
      this.setData({
        currentLanguage,
        selectedLanguage: currentLanguage,
        isLoading: this.data.languages.length === 0,
      })

      setTimeout(() => {
        this.setData({
          languages: buildLanguageCards(),
          isLoading: false,
        })
      }, 0)
    },
  },

  methods: {
    selectLanguage(event: WechatMiniprogram.BaseEvent) {
      const { code } = event.currentTarget.dataset as { code: LanguageCode }
      this.setData({ selectedLanguage: code })
    },
    startLearning() {
      setCurrentLanguage(this.data.selectedLanguage)
      wx.navigateTo({ url: `/pages/words/words?language=${this.data.selectedLanguage}` })
    },
  },
})
