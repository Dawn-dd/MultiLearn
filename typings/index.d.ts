/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    currentLanguage: 'en' | 'ja' | 'ko',
    userInfo?: WechatMiniprogram.UserInfo,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}
