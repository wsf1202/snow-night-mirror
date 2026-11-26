# 雪夜祝福 · 微信小程序

## 导入目录（必须）

```text
…/snow-night-mirror/miniprogram
```

含 `app.js` / `app.json` / `app.wxss` / `project.config.json` / `pages/`。  
AppID 占位：`touristappid`（可改 `project.config.json`）。

工具下载：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

## Tab（仅 2 页）

| Tab | 路径 | 内容 |
|-----|------|------|
| 主页 | `pages/home/home` | 顶部流动屏、选贺卡 2×4、我送给别人的、搜索 |
| 收到的 | `pages/received/received` | 排序/搜索；多类型时左侧类型瀑布 |

从「圣诞节」贺卡可进入 `pages/stage/stage`（摄像头体验 stub，非 Tab）。

当前贺卡类型仅 **圣诞节**；主页网格预留 8 格「敬请期待」。

## 规范

- WXSS：仅 class 选择器
- JS：ES5 友好（避免压缩失败）
- 隐私：贺卡互动画面本地处理
- 虚拟支付：`utils/payment.js` flag 关闭

若「js压缩失败」：详情 → 关闭「上传时压缩 JS」。
