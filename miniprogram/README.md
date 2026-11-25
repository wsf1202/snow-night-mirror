# 雪夜祝福 · 微信小程序（脚手架）

像素风圣诞摄像头互动镜的**原生微信小程序**骨架：落地页、定制礼物、舞台（摄像头 + 指引）。  
对齐 Web 定稿（`docs/RECREATE.md`），v1 手势 / MediaPipe 以 stub + TODO 呈现；虚拟支付钩子默认关闭。

**主体路径：** 个人主体 · 建议工具类目 · 虚拟支付（`wx.requestVirtualPayment`）  
**仓库：** 保持 Private · 勿公开源码

---

## 用微信开发者工具打开

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. **导入项目** → 选择本仓库根目录（含 `project.config.json` 的目录）
3. `miniprogramRoot` 已指向 `miniprogram/`
4. AppID：
   - 无正式号时选「测试号」或使用占位 `touristappid`（已写在 `project.config.json`）
   - 拿到正式 AppID 后，在开发者工具「详情 → 基本信息」或直接改 `project.config.json` 的 `appid` 字段为 `YOUR_APPID`
5. 真机预览需开启摄像头权限；部分模拟器不支持 `onCameraFrame`

### 替换 AppID

```jsonc
// project.config.json
{
  "appid": "touristappid"  // → 换成 wxXXXXXXXXXXXXXXXX
}
```

切勿把 AppSecret、支付私钥、session_key 写进小程序代码或本 README。

---

## 目录结构

```
project.config.json          # 工具工程配置（appid 占位）
miniprogram/
  app.js / app.json / app.wxss
  pages/
    index/                   # 落地页（品牌 + CTA + 隐私说明）
    customize/               # 祝福文案 / 署名 / 盒款
    stage/                   # 摄像头舞台 + 6 步指引 + 自由体验
  utils/
    config.js                # FEATURES 开关（含 virtualPayment）
    gift.js                  # 礼物配置（对齐 web）
    effects-meta.js          # 特效/指引元数据
    gestures.js              # 手势 stub + TODO
    payment.js               # requestVirtualPayment 钩子（无密钥）
  assets/pixel/              # 像素精灵与指引图（自 web public/pixel）
  README.md                  # 本文件
```

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
2. **类目：** 优先选「工具」等个人主体可开放类目（以微信公众平台当时规则为准）；避免无资质的电商/社交类目
3. **隐私协议：** 声明摄像头用途为本地互动；与 UI 文案「画面仅在手机本地处理」一致
4. **虚拟支付：** 在公众平台开通虚拟支付 → 配置 offer / 商品 → 部署签名后端 → 将 `FEATURES.virtualPayment` 设为 `true`
5. **手势 v2：** 评估本地模型 / 微信 AI；保持「不上传画面」；通过后再开 `gestureRuntime`
6. **标准商户支付：** 若后续需要实体/非虚拟商品，再走企业主体 + 微信支付（非本脚手架范围）

---

## 与 Web 版关系

| Web | 小程序 |
|-----|--------|
| `index.html` 落地 + 舞台 | `pages/index` + `pages/stage` |
| `customize.html` | `pages/customize` |
| MediaPipe Hands/Pose | stub（`utils/gestures.js`） |
| Canvas 特效引擎 | overlay stub + 指引 UI |
| 分享 URL `/?b=&s=&box=` | path 参数 `pages/stage/stage?b=&s=&box=` |

Web 在线体验（若隧道可用）：见仓库根 README / 项目文档。

---

## 本地开发提示

- 基础库建议 ≥ 2.9（Camera）/ 虚拟支付按官方文档要求的版本
- 真机调试：开发者工具 → 预览 → 扫码
- `project.private.config.json` 可放本机偏好；不要提交密钥
