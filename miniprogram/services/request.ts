import { RequestConfig } from '../types/api'
import { API_BASE_URL } from '../utils/constants'

export function request<TResponse, TData = unknown>(config: RequestConfig<TData>): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    if (!API_BASE_URL) {
      reject(new Error('请先配置阿里云函数计算 HTTP 地址'))
      return
    }

    wx.request({
      url: `${API_BASE_URL}${config.url}`,
      method: config.method || 'GET',
      data: config.data as WechatMiniprogram.IAnyObject | string | ArrayBuffer | undefined,
      header: {
        'content-type': 'application/json',
        ...config.header,
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as TResponse)
          return
        }

        reject(new Error(`请求失败：${res.statusCode}`))
      },
      fail: reject,
    })
  })
}
