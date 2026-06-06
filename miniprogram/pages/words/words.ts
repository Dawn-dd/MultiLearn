import { getWords } from '../../services/word'
import { LanguageCode, WordWithState } from '../../types/word'
import { LANGUAGE_OPTIONS } from '../../utils/constants'
import { getCurrentLanguage, setCurrentLanguage } from '../../utils/storage'

type WordFilter = 'all' | 'unlearned' | 'learned' | 'favorite'

type DisplayWord = WordWithState & {
  iconAsset?: string
}

interface FilterOption {
  label: string
  value: WordFilter
  count: number
}

interface WordsData {
  words: DisplayWord[]
  filteredWords: DisplayWord[]
  visibleWords: DisplayWord[]
  skeletonRows: number[]
  isLoading: boolean
  keyword: string
  activeFilter: WordFilter
  languageName: string
  languageLevel: string
  summaryText: string
  filters: FilterOption[]
  hasMore: boolean
}

const PAGE_SIZE = 80

const defaultFilters: FilterOption[] = [
  { label: '全部', value: 'all', count: 0 },
  { label: '新词', value: 'unlearned', count: 0 },
  { label: '已掌握', value: 'learned', count: 0 },
  { label: '收藏', value: 'favorite', count: 0 },
]

const wordIconAssets: Record<string, string> = {
  apple: '/assets/candy/apple.png',
  book: '/assets/candy/book.png',
  cat: '/assets/candy/cat.png',
  dog: '/assets/candy/dog.png',
  egg: '/assets/candy/egg.png',
}

function decorateWords(words: WordWithState[]): DisplayWord[] {
  return words.map((word) => ({
    ...word,
    iconAsset: wordIconAssets[word.word.toLowerCase()],
  }))
}

function filterWords(words: DisplayWord[], keyword: string, activeFilter: WordFilter) {
  const text = keyword.trim().toLowerCase()
  return words.filter((word) => {
    const matchedKeyword = !text
      || word.word.toLowerCase().includes(text)
      || word.meaning.includes(text)
      || word.pronunciation.toLowerCase().includes(text)

    if (!matchedKeyword) return false
    if (activeFilter === 'learned') return word.isLearned
    if (activeFilter === 'unlearned') return !word.isLearned
    if (activeFilter === 'favorite') return word.isFavorite
    return true
  })
}

function buildFilters(words: DisplayWord[]): FilterOption[] {
  return defaultFilters.map((filter) => {
    if (filter.value === 'learned') return { ...filter, count: words.filter((word) => word.isLearned).length }
    if (filter.value === 'unlearned') return { ...filter, count: words.filter((word) => !word.isLearned).length }
    if (filter.value === 'favorite') return { ...filter, count: words.filter((word) => word.isFavorite).length }
    return { ...filter, count: words.length }
  })
}

function getSummaryText(words: DisplayWord[]) {
  const learned = words.filter((word) => word.isLearned).length
  const favorite = words.filter((word) => word.isFavorite).length
  return `共 ${words.length} 个词，已掌握 ${learned} 个，收藏 ${favorite} 个`
}

function normalizeLanguage(language?: string): LanguageCode | undefined {
  return LANGUAGE_OPTIONS.some((item) => item.code === language)
    ? language as LanguageCode
    : undefined
}

function getLanguageOption(language: LanguageCode) {
  return LANGUAGE_OPTIONS.find((item) => item.code === language) || LANGUAGE_OPTIONS[0]
}

const initialLanguage = getLanguageOption(getCurrentLanguage())

Component({
  data: {
    words: [],
    filteredWords: [],
    visibleWords: [],
    skeletonRows: [1, 2, 3, 4, 5, 6],
    isLoading: true,
    keyword: '',
    activeFilter: 'all',
    languageName: initialLanguage.name,
    languageLevel: initialLanguage.level,
    summaryText: '正在准备词库',
    filters: defaultFilters,
    hasMore: false,
  } as WordsData,

  pageLifetimes: {
    show() {
      if (this.data.words.length > 0) {
        this.refreshWords(false)
      }
    },
  },

  methods: {
    onLoad(options: Record<string, string | undefined>) {
      const language = normalizeLanguage(options.language)

      if (language) {
        setCurrentLanguage(language)
        const option = getLanguageOption(language)
        this.setData({
          languageName: option.name,
          languageLevel: option.level,
          summaryText: '正在准备词库',
        })
      }

      setTimeout(() => {
        this.refreshWords(false)
      }, 0)
    },
    refreshWords(showLoading = true) {
      if (showLoading) {
        this.setData({ isLoading: true })
      }

      const language = getCurrentLanguage()
      const option = getLanguageOption(language)
      const words = decorateWords(getWords(language))
      const filteredWords = filterWords(words, this.data.keyword, this.data.activeFilter)
      this.setData({
        words,
        filteredWords,
        languageName: option.name,
        languageLevel: option.level,
        summaryText: getSummaryText(words),
        filters: buildFilters(words),
        visibleWords: filteredWords.slice(0, PAGE_SIZE),
        hasMore: filteredWords.length > PAGE_SIZE,
        isLoading: false,
      })
    },
    onSearch(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const { value } = event.detail
      const filteredWords = filterWords(this.data.words, value, this.data.activeFilter)
      this.setData({
        keyword: value,
        filteredWords,
        visibleWords: filteredWords.slice(0, PAGE_SIZE),
        hasMore: filteredWords.length > PAGE_SIZE,
        isLoading: false,
      })
    },
    clearSearch() {
      const filteredWords = filterWords(this.data.words, '', this.data.activeFilter)
      this.setData({
        keyword: '',
        filteredWords,
        visibleWords: filteredWords.slice(0, PAGE_SIZE),
        hasMore: filteredWords.length > PAGE_SIZE,
        isLoading: false,
      })
    },
    changeFilter(event: WechatMiniprogram.BaseEvent) {
      const { value } = event.currentTarget.dataset as { value: WordFilter }
      const filteredWords = filterWords(this.data.words, this.data.keyword, value)
      this.setData({
        activeFilter: value,
        filteredWords,
        visibleWords: filteredWords.slice(0, PAGE_SIZE),
        hasMore: filteredWords.length > PAGE_SIZE,
        isLoading: false,
      })
    },
    loadMore() {
      if (!this.data.hasMore) return

      const nextCount = this.data.visibleWords.length + PAGE_SIZE
      this.setData({
        visibleWords: this.data.filteredWords.slice(0, nextCount),
        hasMore: nextCount < this.data.filteredWords.length,
      })
    },
    goLanguage() {
      wx.navigateTo({ url: '/pages/language/language' })
    },
    goDetail(event: WechatMiniprogram.BaseEvent) {
      const { id } = event.currentTarget.dataset as { id: string }
      wx.navigateTo({ url: `/pages/word-detail/word-detail?id=${id}` })
    },
  },
})
