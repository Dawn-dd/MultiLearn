import { getCurrentLanguage } from './utils/storage'

App<IAppOption>({
  globalData: {
    currentLanguage: 'en',
  },
  onLaunch() {
    this.globalData.currentLanguage = getCurrentLanguage()
  },
})
