import { CLOUDBASE_ENV_ID } from './utils/constants'
import { getCurrentLanguage } from './utils/storage'

App<IAppOption>({
  globalData: {
    currentLanguage: 'en',
  },
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: CLOUDBASE_ENV_ID || undefined,
        traceUser: true,
      })
    }

    this.globalData.currentLanguage = getCurrentLanguage()
  },
})
