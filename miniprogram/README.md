# 雪夜祝福 · 微信小程序（脚手架）

像素风圣诞摄像头互动镜的**原生微信小程序**骨架：落地页、定制礼物、舞台（摄像头 + 指引）。  
对齐 Web 定稿（`docs/RECREATE.md`），v1 手势 / MediaPipe 以 stub + TODO 呈现；虚拟支付钩子默认关闭。

**主体路径：** 个人主体 · 建议工具类目 · 虚拟支付（`wx.requestVirtualPayment`）  
**仓库：** 保持 Private · 勿公开源码

---

## 用微信开发者工具打开（重要）

### 推荐：直接选 `miniprogram` 目录

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. **导入项目** → 项目目录选：

```text
…/snow-night-mirror/miniprogram
```

（该目录内有 `app.json`、`app.js`、`project.config.json`、`pages/`）

3. AppID：无正式号时用测试号或占位 `touristappid`
4. 编译后首页应为 **雪夜祝福** 落地页（`pages/index/index`）

### 也可以：选仓库根目录

```text
…/snow-night-mirror
```

根目录 `project.config.json` 的 `miniprogramRoot` 指向 `miniprogram/`。  
**不要**指望在小程序模拟器里看到 Vite 的 `index.html`（那是 Web 版）。

### 常见踩坑

| 错误做法 | 结果 |
|----------|------|
| 只打开仓库根却未识别 `miniprogramRoot` | 找不到 `app.json` / 空白 |
| 把 Web `index.html` 当小程序页 | 看到的不是小程序 UI |
| WXSS 里写 `view`/`page`/`[disabled]` 等标签·属性选择器 | 报「组件 wxss 中不可以指定标签名选择器」 |

样式约定：只用 **class** 选择器；页面根节点加 `page-root`（见 `app.wxss`）。

### 替换 AppID

```jsonc
// miniprogram/project.config.json 或 仓库根 project.config.json
{
  "appid": "touristappid"  // → 换成 wxXXXXXXXXXXXXXXXX
}
```

切勿把 AppSecret、支付私钥、session_key 写进小程序代码或本 README。

---

## 目录结构

```
snow-night-mirror/                 # 仓库根（Web + 小程序）
  project.config.json              # 可选：打开仓库根时用（miniprogramRoot）
  miniprogram/                     # ← 推荐作为 DevTools 项目目录
    project.config.json            # 独立小程序工程配置
    app.js / app.json / app.wxss
    pages/
      index/                       # 落地页（首页）
      customize/
      stage/
    utils/
    assets/pixel/
```

`app.json` → `pages[0]` = `pages/index/index`（启动页）。

---

## 功能开关

见 `utils/config.js`：

| 开关 | 默认 | 说明 |
|------|------|------|
| `virtualPayment` | `false` | 打开后才走 `wx.requestVirtualPayment` |
| `gestureRuntime` | `false` | 真机手势引擎就绪后打开 |
| `cameraFrameDebug` | `false` | 帧尺寸 toast |

支付商品占位在 `VIRTUAL_GOODS_STUB`；签名必须由**自有后端**下发，客户端只消费一次性 `signData` / `paySig`。

---

## 下一步（上架 / 变现）

1. **注册小程序**（个人主体可用）→ 拿到 AppID，替换占位
2. **类目：** 优先选「工具」等个人主体可开放类目（以微信公众平台当时规则为准）
3. **隐私协议：** 声明摄像头用途为本地互动
4. **虚拟支付：** 开通 → 部署签名后端 → `FEATURES.virtualPayment=true`
5. **手势 v2：** 本地推理优先，保持「不上传画面」

---

## 与 Web 版关系

| Web | 小程序 |
|-----|--------|
| `index.html` 落地 + 舞台 | `pages/index` + `pages/stage` |
| `customize.html` | `pages/customize` |
| MediaPipe Hands/Pose | stub（`utils/gestures.js`） |
| 分享 URL `/?b=&s=&box=` | path 参数 `pages/stage/stage?b=&s=&box=` |
