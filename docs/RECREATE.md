# 雪夜祝福 · 定稿复刻规格（Kept Build Spec）

> **目的：** 仅凭本文 + 仓库资产，可复刻出用户确认可保留的版本（2026-11-25 Asia/Shanghai，「这个版本可以保留，很不错」）。  
> **分支：** `cursor/christmas-camera-hci-1f8e`  
> **参考提交：** `0f2ba30`（含像素落地页与 README）；功能定稿含此前 `4a70724`…`b61310b`…`8cf4f58` 等。  
> **工程根目录：** `/agent/snow-night-mirror`  
> **临时预览：** https://creator-bowling-seemed-committed.trycloudflare.com/ （Cloudflare 临时隧道，非正式发布）

---

## 1. 产品一句话

浏览器内**像素风圣诞摄像头互动镜**：本地 MediaPipe 识别手势 → Canvas 叠特效；可定制礼物祝福文案并生成分享链接。画面不上传。

---

## 2. 技术栈与工程骨架

| 项 | 值 |
|----|-----|
| 打包 | Vite 8，`type: module` |
| 依赖 | `@mediapipe/tasks-vision@^1.2.3` |
| 入口 | `index.html` → `/src/main.js`；`customize.html` → `/src/customize.js` |
| 端口 | dev `0.0.0.0:5173`，`allowedHosts: true`（方便隧道） |
| 字体 | Google Fonts：`ZCOOL KuaiLe` + `Press Start 2P` |
| 语言 | 中文 UI（`lang="zh-CN"`） |

### 2.1 源文件职责

| 文件 | 职责 |
|------|------|
| `src/main.js` | 页面壳、落地页/舞台、手势循环、指引/自由模式分发、视口装饰 |
| `src/gestures.js` | Hands 手势判定 + 冷却/dwell；输出 `events` |
| `src/effects.js` | Canvas 特效状态机与绘制；`EFFECT_META` 指引元数据 |
| `src/pixelAssets.js` | 精灵加载、品红抠图、`drawPixelSprite`（nearest） |
| `src/audio.js` | Web Audio 短音；铃铛单音+节奏；礼物/树/火花 |
| `src/gift.js` | URL/localStorage 礼物配置 |
| `src/camera.js` | getUserMedia 暖权限→枚举→降级 |
| `src/coach.js` | 分步手势指引 UI；OK 前进 |
| `src/customize.js` | 定制页逻辑 |
| `src/style.css` | 全站像素风主题与布局 |

### 2.2 MediaPipe

```
WASM:  https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm
POSE:  pose_landmarker_lite (Google Storage float16)
HAND:  hand_landmarker (Google Storage float16)
Mode:  VIDEO；numPoses=1；双手 landmarks
```

视频与特效 canvas 均 `transform: scaleX(-1)`（自拍镜像）。祝福文字绘制时再 `scale(-1,1)` 抵消，保证正向可读。

---

## 3. 视觉与设计令牌（必须对齐）

### 3.1 CSS 变量

```css
--bg-deep: #0b1a12;
--bg-mid: #143024;
--pine: #2f6b45;
--pine-lit: #3f8a58;
--crimson: #b03a3a;
--crimson-soft: #d45a5a;
--gold: #e0b84a;
--gold-soft: #f2d87a;
--cream: #f4ecd8;
--cream-dim: rgba(244, 236, 216, 0.78);
--ink: #0a1510;
--font-brand / --font-body: "ZCOOL KuaiLe", "Press Start 2P", …;
--font-latin: "Press Start 2P", …;
```

### 3.2 风格硬规则（本产品约定）

- **像素风**：精灵 `image-rendering: pixelated`；按钮直角 + 像素描边阴影（`box-shadow: 4px 4px 0`），非圆角卡片堆。
- **品牌优先**：落地页第一屏以「雪夜祝福」为最大字号，拉丁副标次之。
- **第一屏单一构图**：品牌 + 一句说明 + CTA；背景用树/礼物/铃等精灵铺气氛，勿做成仪表盘。
- **避免**：紫白渐变主题、奶油底+衬线+陶土强调、报纸细栏；勿把装饰做成规整四角框。
- **视口装饰**：装饰在**摄像头画面内部**边缘随意散落，不要整页外框。

---

## 4. 页面结构

### 4.1 落地页（Hero）

必须包含：

1. 环境像素雪（方块雪花下落）。
2. `hero-sprites`：绝对定位像素图  
   - 大圣诞树（左下）、礼物（右下）、铃（右上摆动）、帽、鹿角、拐杖糖/冬青/松枝点缀。  
   - 动画：`steps` 式 bob + 铃铛 swing。
3. 文案：`PIXEL SNOW NIGHT` 小标 → **雪夜祝福** → `Snow Night Mirror` → 一句 lead。
4. CTA：`开启摄像头`（主）、`定制礼物祝福`（幽灵按钮链到 `/customize.html`）。
5. 隐私注：「画面仅在浏览器本地处理，不会上传。」

### 4.2 舞台页（Stage，摄像头开启后）

- 顶栏：品牌「雪夜祝福」+ 静音 / 再看引导 / 定制礼物。
- `viewport`：`<video>` + `<canvas.overlay>` + `viewport-frame` + toast + coach-slot + 跳过指引 + 自由体验 banner + loading。
- 底栏 `effects-dock`：按 `EFFECT_META` 列出特效名；悬停弹出指引图+hint。

### 4.3 定制页

- 祝福 ≤40 字、署名 ≤20、四盒款：`red-gold` / `green-gold` / `navy-silver` / `cream-red`。
- 生成 `/?b=&s=&box=` 分享链接；可读 `localStorage['snow-night-gift']` 回退。

---

## 5. 手势规格（复刻核心）

### 5.1 冷却（ms）

| id | cooldown | 说明 |
|----|----------|------|
| a1 | 90 | 飘雪几乎可连触 |
| a2 | 1800 | 礼物（另有完整播完门闩） |
| a3 | 380 | 铃 |
| a6 | 1400 | 鹿角 |
| a7 | 1400 | 帽 |
| b8 | 1600 | 树 |
| next | 900 | 指引 OK |

多数手势约 **380ms dwell**（strict 模式 ×1.15）。

### 5.2 判定语义（实现须方向无关：用距离比，勿死靠 Y）

| ID | 名称 | 手势 | UI 文案（仅文案） |
|----|------|------|------------------|
| **a1** | 飘雪祝福 | `isFive`：四指伸展+拇指外展+指尖间距够大；排除 OK/捏合/1/2 | **「五指张开，雪从掌心洒出」**（勿写「比5」） |
| **a3** | 圣诞铃响 | 拇食尖距小；**其余三指不得伸出**（`othersExt===0`）；左右摇产生 crossing/impulse | 必须露出拇食两指捏合再摇 |
| **a7** | 圣诞帽 | 仅食指伸，中无名小折 | 「伸出 1 根手指」 |
| **a6** | 驯鹿鹿角 | 食+中伸，无名小折，有间距 | 「伸出 2 根手指」 |
| **b8** | 圣诞树点灯 | 食+中+无名伸，小指折；排除 1/2/5/OK | 「伸出 3 根手指…树顶发光点灯」 |
| **a2** | 礼物掉落 | 双手：双食指靠近且拇指靠近/交叉尖靠近 → 心形中点 | 比心；指引**最后一步** |
| **next** | 指引前进 | OK：拇食靠近 + 至少两其它指伸 | 文案「比 OK」 |

### 5.3 自由模式互斥

```js
FREE_TRIGGER_GAP_MS = 750
FREE_EVENT_PRIORITY = ['a2', 'b8', 'a6', 'a7', 'a3', 'a1']
// a3 铃、a1 雪：不受 750ms 互斥间隔限制，可同帧分发
// 其它特效：每帧最多挑优先级最高的一个，且距上次 ≥750ms
```

### 5.4 头饰互斥

- 戴帽：`hatUntil = now+4500`，同时 `antlersUntil=0`
- 鹿角：`antlersUntil = now+5000`，同时 `hatUntil=0`
- 绘制锚定 Pose 头顶（鼻/耳估 crown + earSpan）

---

## 6. 特效行为规格

### 6.1 飘雪 a1

- 在掌心附近喷一批 sticky 雪花；环境雪常驻。
- 可双手同时检测时从多掌洒出（若实现保留双掌）。

### 6.2 铃铛 a3

- 精灵跟捏合点；物理摆（角度弹簧阻尼）。
- **每次有效摇动播一个音**（Jingle Bells 音列），间隔影响节奏。
- **松捏后立刻消失**（约 0.12s 淡出）；勿长时间残留。

### 6.3 圣诞树 b8

- 使用 `public/pixel/tree.png` 像素树。
- **点灯 = 树顶光晕/射线 + 枝上彩灯渐亮**，不要另画一颗覆盖原星的实心大五角星。
- 树下画**缩小关闭礼物**（同 gift 精灵）。
- 寿命约 14s；若与礼物配对则延长至礼物结束。

### 6.4 礼物 a2（最重要）

#### 门闩

```text
若已有礼物且 phase !== 'done' → 拒绝新触发（return false）
必须完整：出现→打开→展示→exit 淡出 → gift=null 后，才能再触发
```

#### 开盖锚点（文字居中）

礼物 translate 锚在盒底。全开时祝福卡片中心相对锚点：

```text
size = min(168, w*0.34)
closedH = size * 1.2
boxBottom = closedH * 0.18
bodyH = closedH * 0.58
lidLift = size * 0.82
gapY = boxBottom - bodyH - lidLift * 0.35
anchor = { x: w/2, y: h/2 - gapY }
```

→ 关闭态视觉在**中间偏下**；打开后祝福字在**屏幕正中**。

#### 双路径

| 条件 | 行为 |
|------|------|
| `this.tree` 存在 | 从树下小礼物世界坐标 `grow` 到 anchor；`tree.pairedGift=true`，`hideMiniGift=true`；树保持到与礼物一起 exit |
| 无树 | 从 `y=-70`、`x=center` **下落**到 anchor，bounce 后 open |

#### 绘制

- 关闭：整图 `gift.png`
- 打开：`gift-box.png`（窄）+ `gift-lid.png`（更宽，上抬旋转）
- **不要**盒内填充物/纸巾/迷你礼物堆
- 祝福条画在盖与盒之间；canvas 已镜像时文字再反镜像

#### 精灵资产要求

- `gift.png`：像素红盒+金丝带+蝴蝶结；**盖必须比身宽、有阴影缝**
- `gift-box.png` / `gift-lid.png`：从同一艺术切开；运行时可 `scrubMagenta`

### 6.5 音效

- `playBell(strength, { intervalMs })`：单音符
- `playGiftOpen` / `playTree` / `playSparkle` / `playWhoosh` / `playWarm`
- 默认可读 localStorage 静音偏好；UI 可切换

---

## 7. 指引（Coach）

### 7.1 启动策略（定稿）

```text
开启摄像头后：always startCoach()
仅当 URL ?coach=0 时跳过
完成或跳过后 enterFreePlay()；可「再看引导」重开
```

### 7.2 步骤顺序 = `EFFECT_META` 顺序

1. a1 飘雪  
2. a3 铃  
3. a7 帽  
4. a6 鹿角  
5. b8 树  
6. a2 礼物  

每步一张**最终姿势**引导图（`PIXEL.guide*`）。做对可反复触发；**比 OK** 或「跳过该动作」前进。左上角面板 z-index 高于视口装饰。

### 7.3 引导图路径（public）

```
/pixel/guide-snow.jpg
/pixel/guide-bell.jpg
/pixel/guide-hat.jpg
/pixel/guide-antlers.jpg
/pixel/guide-tree.jpg
/pixel/guide-gift.jpg
（另有 guide-next.jpg 备用；OK 步骤以文字为主）
```

---

## 8. 视口圣诞边框

- 容器：`.viewport-frame` 铺满摄像头区域，`pointer-events: none`，`z-index: 2`。
- 图标：`/pixel/frame/deco-0.png` … `deco-8.png`（0–6 拐杖糖/冬青/姜饼等；7–8 松枝）。
- 布局：手写百分比散点（上下左右），**略贴边**，旋转/缩放不一，松枝插在元素之间；**不要**均匀四角/整齐轨道。

---

## 9. 资产清单（复刻必须有）

### 9.1 道具精灵 `public/pixel/`

| 文件 | 用途 |
|------|------|
| `tree.png` | 圣诞树（品红底已抠或运行抠） |
| `gift.png` | 关闭礼物 |
| `gift-box.png` | 开盒身 |
| `gift-lid.png` | 开盒盖（更宽） |
| `bell.png` | 铃 |
| `santa-hat.png` | 帽 |
| `antlers.png` | 鹿角 |
| `frame/deco-0.png` … `deco-8.png` | 边框与落地点缀 |
| `guide-*.jpg` | 指引图 |

### 9.2 绘制约定

- `drawPixelSprite(ctx, img, x, y, w, h, { anchorX, anchorY, flipX, alpha })`
- 加载礼物类可 `scrubMagenta: true` 去品红/紫边

---

## 10. 关键环（main loop）

每帧大致：

1. `HandLandmarker` + `PoseLandmarker` `detectForVideo`
2. `detector.update` → `{ events, anchors }`
3. `effects.setLiveAnchors(anchors)`
4. 若 coach 活跃：只处理当前步对应 event + next；`dispatchEffect` 对 a2 若 busy 返回 false 则不 `notify`
5. 若自由：铃/雪优先分发；其它按 gap+priority
6. `effects.update(dt)` → `effects.draw()`

---

## 11. 验收清单（复刻完成标准）

- [ ] 落地页是像素精灵雪夜，品牌最大，有树/礼物/铃动态
- [ ] 开摄像头必出 6 步指引；可跳过；可再看引导
- [ ] 五指张开出雪；文案无「比5」
- [ ] 捏合摇铃，松手铃消失
- [ ] 1/2/3 指分别帽/角/树；帽角互斥
- [ ] 树有光效与树下小礼物，无额外实心大星盖住
- [ ] 无树比心：礼物落下开在中下，字在正中；无填充
- [ ] 有树比心：从小礼物长大；树留下到一起消失
- [ ] 礼物未播完无法再触发
- [ ] 视口内随意像素边框贴边+松枝
- [ ] 定制页链接能带祝福打开礼物
- [ ] 镜像自拍下祝福文字正向

---

## 12. 本地复现命令

```bash
cd snow-night-mirror   # 或 /agent/snow-night-mirror
npm install
npm run dev            # http://127.0.0.1:5173/
npm run build
```

摄像头需 localhost 或 HTTPS。外网拉取 MediaPipe WASM/模型。

---

## 13. 相关文档

- 状态摘要：[`christmas-app-status.md`](./christmas-app-status.md)
- 手势速查：[`gesture-redesign-v2.md`](./gesture-redesign-v2.md)
- 特效清单（历史）：[`christmas-effects-list.md`](./christmas-effects-list.md)

---

## 14. 非目标（本定稿不做）

- 自定义图片/语音/视频礼物附件  
- 正式 Cursor `publish-app`（需绑定 Git 仓）  
- 画面镜像开关  
- B9 / C 类扩展特效  

---

*文档更新：2026-11-25 15:29（Asia/Shanghai）· 用于完整复刻 Kept Build*
