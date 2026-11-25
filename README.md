# 🎄 雪夜祝福 · Snow Night Mirror

浏览器圣诞摄像头互动：本地手势特效 + 可定制礼物祝福链接。画风可切换，手势 / 指引 / 运行时共用。

**🌐 在线体验：** https://wsf1202.github.io/snow-night-mirror/

**定稿分支：** `cursor/christmas-camera-hci-1f8e`  

**完整复刻规格（必读）：** [`docs/RECREATE.md`](./docs/RECREATE.md)  
**手势速查：** [`docs/GESTURES.md`](./docs/GESTURES.md)

## 画风

| 画风 | 打开方式 |
|------|----------|
| 像素雪夜（默认 / 定稿） | `/` 或落地页「像素雪夜」 |
| 复古明信片 | `/?style=vintage` 或落地页「复古明信片」 |
| 霓虹 | `/?style=neon` 或落地页「霓虹」 |

定制页会保留当前画风：`/customize.html?style=vintage` · `/customize.html?style=neon`。

## 本地开发

```bash
npm install
npm run dev
```

打开 http://127.0.0.1:5173/ （需允许摄像头）。

- 像素：http://127.0.0.1:5173/
- 复古明信片：http://127.0.0.1:5173/?style=vintage
- 霓虹：http://127.0.0.1:5173/?style=neon
- 定制页：http://127.0.0.1:5173/customize.html

## 构建

```bash
npm run build
npm run preview
```

## 🎮 手势速查

| 特效 | 手势 | 预览 |
|------|------|------|
| ❄️ 飘雪 | 五指张开 | ![飘雪](public/pixel/guide-snow.jpg) |
| 🔔 铃铛 | 拇食捏合轻摇 | ![铃铛](public/pixel/guide-bell.jpg) |
| 🎅 圣诞帽 | 比 1 | ![圣诞帽](public/pixel/guide-hat.jpg) |
| 🦌 鹿角 | 比 2 | ![鹿角](public/pixel/guide-antlers.jpg) |
| 🎄 圣诞树点灯 | 比 3 | ![圣诞树](public/pixel/guide-tree.jpg) |
| 🎁 礼物 | 双手比心 | ![礼物](public/pixel/guide-gift.jpg) |
