# 雪夜祝福 · 微信小程序

按[官方小程序目录结构](https://developers.weixin.qq.com/miniprogram/dev/framework/structure.html)搭建。

## 用微信开发者工具打开（必须选这个目录）

```text
…/snow-night-mirror/miniprogram
```

该目录内含：`app.js`、`app.json`、`app.wxss`、`project.config.json`、`pages/`。

1. 下载工具：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html  
2. **导入项目** → 目录选上面的 `miniprogram`  
3. AppID：测试号，或占位 `touristappid`（可在 `project.config.json` 替换）  
4. 编译 → 首页应为「雪夜祝福」落地页（`pages/index/index`）  
5. 摄像头请用**真机调试**

**不要**把仓库根目录（含 Vite `index.html`）当成小程序项目根来开；根目录仅可选（依赖 `miniprogramRoot`）。

## 页面

| 路径 | 说明 |
|------|------|
| `pages/index/index` | 落地页 |
| `pages/customize/customize` | 定制祝福文案 |
| `pages/stage/stage` | 摄像头 + 6 步指引（手势 stub） |

## 说明

- WXSS：**仅 class 选择器**（见官方 WXSS 文档）
- JS：ES5 友好，避免压缩失败（`??` / `?.` 等）
- 隐私：UI 与 `permission.scope.camera` 均声明本地处理
- 虚拟支付：`utils/payment.js`，`FEATURES.virtualPayment=false`

若预览/上传报「js压缩失败」：详情 → 本地设置 → 关闭「上传时压缩 JS」。

官方工具概览：https://developers.weixin.qq.com/miniprogram/dev/devtools/devtools.html
