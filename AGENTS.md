你现在是我的微信小程序开发助手。

我要开发一个自用型多语种在线教育微信小程序，技术栈如下：

1. 前端：
- 微信原生小程序
- TypeScript
- Less
- 不使用 Taro、uni-app、Vue、React

2. 后端：
- 使用腾讯云 CloudBase
- 使用 CloudBase 云函数
- 接入腾讯混元模型
- 不在小程序前端暴露任何模型调用密钥

3. 数据：
- 不使用云数据库作为主数据源
- 第一版单词库使用本地 JSON 文件
- 用户学习进度、生词本、复习记录使用 wx.setStorageSync / wx.getStorageSync 保存在本地

4. 第一版功能：
- 首页
- 语言选择页
- 单词列表页
- 单词详情页
- 生词本页
- 复习页
- AI 对话页
- 我的页面

5. 支持语言：
- 英语 en
- 日语 ja
- 韩语 ko

6. 单词库：
- en-a1.json
- ja-n5.json
- ko-beginner.json
- 每个文件先放 20 条示例数据，后期我再扩充

7. AI 功能：
- 单词解释
- 例句生成
- 场景对话
- 错句修改
- 根据单词生成练习题

8. CloudBase 云函数：
创建 cloudfunctions/hunyuan-proxy 云函数。
云函数根据 action 参数分发能力：
- action = chat：AI 场景对话
- action = explain：单词解释
- action = exercise：生成练习题
- action = correct：错句修改

9. 返回格式统一：
成功：
{
  "success": true,
  "data": "模型回答内容"
}

失败：
{
  "success": false,
  "error": "错误信息"
}

10. 代码要求：
- 结构清晰
- 类型定义完整
- 不要过度封装
- 不要使用 any，除非确实无法避免
- 页面样式简洁
- 所有 AI 请求统一封装到 miniprogram/utils/ai.ts
- 所有本地缓存操作统一封装到 miniprogram/utils/storage.ts
- 所有词库读取统一封装到 miniprogram/utils/vocab.ts

请你先阅读当前项目结构，然后告诉我准备新增和修改哪些文件。确认后再开始修改。