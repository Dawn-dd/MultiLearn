import { getNextUnlearnedWord, getWordById } from '../../services/word'
import { WordWithState } from '../../types/word'
import { markWordLearned, setPendingChatDraft, toggleFavoriteWord } from '../../utils/storage'

const wordAssetMap: Record<string, string> = {
  apple: '/assets/candy/apple.png',
  book: '/assets/candy/book.png',
  cat: '/assets/candy/cat.png',
  dog: '/assets/candy/dog.png',
  egg: '/assets/candy/egg.png',
}

function formatTime(timestamp?: number) {
  if (!timestamp) return '还没有复习'
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

Component({
  data: {
    wordId: '',
    word: null as WordWithState | null,
    statusText: '未掌握',
    favoriteText: '加入生词本',
    reviewText: '还没有复习',
    detailInitial: '',
    detailAsset: '',
  },

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
        reviewText: word ? formatTime(word.lastReviewedAt) : '还没有复习',
        detailInitial: word?.word.slice(0, 1).toUpperCase() || '',
        detailAsset: word ? wordAssetMap[word.word.toLowerCase()] || '' : '',
      })
    },
    markLearned() {
      if (!this.data.wordId) return
      markWordLearned(this.data.wordId)
      this.refreshWord(this.data.wordId)
      wx.showToast({ title: '已标记掌握', icon: 'success' })
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
      wx.showToast({ title: isFavorite ? '已加入生词本' : '已移出生词本', icon: 'success' })
    },
    askAi() {
      if (!this.data.word) return
      setPendingChatDraft(`请用中文解释 ${this.data.word.word}，并给我 2 个适合初学者的例句。`)
      wx.switchTab({ url: '/pages/chat/chat' })
    },
    playAudio() {
      wx.showToast({ title: '首版暂未接入发音', icon: 'none' })
    },
    goNextWord() {
      const nextWord = getNextUnlearnedWord(this.data.wordId)
      if (!nextWord) {
        wx.showToast({ title: '没有未学单词了', icon: 'none' })
        return
      }
      this.setData({ wordId: nextWord.id })
      this.refreshWord(nextWord.id)
    },
    goWords() {
      wx.navigateTo({ url: '/pages/words/words' })
    },
  },
})
