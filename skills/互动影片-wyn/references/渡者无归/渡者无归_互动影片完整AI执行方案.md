# 《渡者无归》互动影片 · 完整AI执行方案

## 项目概述

**类型**：网页端第一人称互动叙事（Interactive Narrative）  
**风格**：东方哥特恐怖（Eastern Gothic Horror）× 心理惊悚 × 非线性轮回  
**核心机制**：无UI按钮点击、全屏热区沉浸、双声道语音篡改、状态机驱动的叙事变异、键盘输入终幕仪式  
**技术栈**：纯HTML5 + CSS3 + JavaScript（或Twine SugarCube 2.x转译）  
**目标平台**：桌面端浏览器（Chrome/Edge/Safari）+ 移动端浏览器（iOS Safari / Android Chrome）  
**单文件交付**：最终可运行物为单个 `index.html`（内嵌全部CSS/JS，图片外链或Base64）

---

## 一、核心系统架构

### 1.1 状态机（State Machine）

所有叙事变异由以下变量驱动。GLM5必须在全局作用域维护此对象：

```javascript
const State = {
  // 核心双轴
  System_Control: 3,        // 系统控制度（越高越机械）
  Humanity_Memory: 0,       // 人性记忆度（越高越觉醒）
  
  // 身份与存在
  Ferryman_Name: "unknown", // 摆渡人名称状态
  Jade_Fragment: false,     // 是否获得玉佩
  
  // 阿缨存在状态（关键）
  Aying_Existence: 3,       // 3=完整实体, 2=半身, 1=头/肩, 0=消散, -1=撕裂
  Aying_Internalized: false, // 是否被吸入主角胸腔
  Aying_Textified: false,   // 是否转化为网页文本（破壁）
  
  // 罪恶与认知
  Guilt_Memory: 0,          // 0=无, 1=浅层, 2=深度绑定, 3=转化为权力
  Tomb_Insight: 0,          // 0~3，大墓认知深度
  Tomb_Access_Han: false,   // 是否获准进入汉代层
  
  // 第二声带机制
  Voice_Corruption_Level: 1, // 1=后缀耳语, 2=同音投毒, 3=完全夺舍
  
  // 第二幕日常
  Pain_Sync: false,         // 是否激活痛觉同步
  Mirror_Triangle: false,   // 共振三角
  
  // 歌姬支线
  Encore_Complete: 0,       // 0~3，返场观看计数
  System_Trapped: false,    // 系统是否被困于舞台
  Maintenance_Window: 0,    // 维护窗口时长
  Wood_Hand: false,         // 右手是否木化
  Hand_Lost: false,         // 右手是否断裂
  History_Erased: false,    // 右手引渡历史是否被系统没收
  Contract_Void: false,     // 戏票合同是否撕毁
  Memory_Debt: 0,           // 记忆债务（撕票人路线）
  
  // 共振三角秘密
  Aying_Knowledge: false,   // "不完整即漏洞"秘密
  Pain_Overload: false,     // "疼痛回灌"秘密
  Name_Deconstructed: false,// "名字逆向拆解"秘密
  
  // 静默抵抗
  Silence_Resistance: false, // 是否获得拒绝权
  Red_Rope: false,          // 是否获得红绳道具
  
  // 终幕条件
  Existence_Null: false,    // 是否获得自毁协议权限
  Regret_Loop: false,       // 悔恨循环（未擦血粉路线）
  Frozen_Memory: false,     // 记忆冻结（碎玉嵌入路线）
  Jade_Embedded: false      // 玉佩嵌入核心
};
```

### 1.2 无UI热区规范

所有交互必须通过**画面热区**完成，严禁使用HTML原生按钮。

**热区实现标准**：
```html
<!-- 示例：Node_01 三个热区 -->
<div class="scene-container" id="node-01">
  <img class="bg-layer" src="bg01.jpg" alt="">
  
  <!-- 热区A：左侧亡魂 -->
  <div class="hotzone" data-action="B" data-goto="Node_S02_玉碎之问"
       style="position:absolute; top:30%; left:10%; width:30%; height:40%;"></div>
  
  <!-- 热区B：中心门缝 -->
  <div class="hotzone" data-action="A" data-goto="Node_S01_封印之刑"
       style="position:absolute; top:20%; left:35%; width:30%; height:50%;"></div>
  
  <!-- 热区C：右侧中央（主角+亡魂冲门） -->
  <div class="hotzone" data-action="C" data-goto="Node_S03_越界者"
       style="position:absolute; top:40%; left:40%; width:20%; height:30%;"></div>
</div>
```

**悬停反馈CSS**：
```css
.hotzone {
  position: absolute;
  background: rgba(255,255,255,0);
  cursor: pointer;
  transition: box-shadow 0.4s ease, background 0.6s ease;
  z-index: 10;
}
.hotzone:hover {
  box-shadow: 0 0 30px 10px rgba(160, 220, 210, 0.4),
              inset 0 0 20px rgba(160, 220, 210, 0.2);
}
/* 选择后：非选中热区被系统黑线封死 */
.hotzone.disabled {
  pointer-events: none;
  filter: grayscale(100%) brightness(0.3);
  transition: filter 0.8s ease;
}
```

### 1.3 音频分层架构

采用**四层叠加**音频模型，全部通过 Web Audio API 程序化生成，**无需外部音频文件**：

```javascript
const AudioLayers = {
  base: null,      // 环境氛围（循环）
  system: null,    // 系统音（机械/冰冷）
  human: null,     // 人性音（喘息/颤抖）
  ghost: null      // 阿缨音（共鸣/篡改）
};
```

**Binaural Beats 眩晕层（技术修正后）**：
```javascript
function createBinauralBeats(freqL, freqR, volume) {
  const ctx = new AudioContext();
  const oscL = ctx.createOscillator(); oscL.frequency.value = freqL;
  const oscR = ctx.createOscillator(); oscR.frequency.value = freqR;
  const merger = ctx.createChannelMerger(2);
  const gain = ctx.createGain(); gain.gain.value = volume;
  oscL.connect(merger, 0, 0);
  oscR.connect(merger, 0, 1);
  merger.connect(gain).connect(ctx.destination);
  oscL.start(); oscR.start();
  return { ctx, oscL, oscR, gain };
}
// 使用示例：
// 3Hz差频（Theta波边缘，眩晕）= 60Hz左 + 63Hz右
// 0.5Hz差频（Delta波，死亡边缘）= 60Hz左 + 60.5Hz右
```

**移动端震动反馈**：
```javascript
function tombVibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}
// 悬停玉佩: [50,100,50] 心跳式
// 悬停门缝: [30,60,30] 警告式
// 汉代层龙骨: [100,50,100] 钝痛式
```

---

## 二、完整节点网络图

```
Node_01_门前的异类
├─ A 强行推入 ─→ Node_S01_封印之刑（再度遗忘）
├─ B 扣下信物 ─→ Node_S02_玉碎之问
│   ├─ A 擦卷宗 ─→ Node_S02_2a_血指印
│   ├─ B 撞门 ───→ Node_S02_2b_撞门（门上新囚徒）
│   ├─ C 内化 ───→ Node_S02_2c_共犯内化 ★主线
│   └─ 未擦 ─────→ Node_S01b_碎玉嵌入（带毒重置）
│
Node_S02_2c_共犯内化
└─ ─────────────→ Node_S03_汉骨：尸解仙的悖论
    ├─ A 握笔 ───→ Node_S03a_握笔者（成为源代码）
    ├─ B 穿骨 ───→ Node_S03b_穿骨者（疼痛通用语）
    └─ C 阅读 ───→ Node_S03c_读者：被文字吃掉的人 ★C线
        ├─ C1 擦血粉 ─→ Node_S04_终幕：渡者无归
        └─ C2 未擦 ───→ Node_S03c2_凝固者（永恒句号）

[第二幕日常节点 - 可穿插于 S02_2c 之后 / S03 之前]
Node_D1_溺亡的镜子
Node_D2_战死的卷宗
Node_D3_自缢的镜像
└─ C 镜像共情 ─→ Node_D3c_共振三角
    ├─ A 阿缨墙 ─→ Node_D3c_共振完成（不完整即漏洞）
    ├─ B 歌姬墙 ─→ Node_D3c_共振完成（疼痛过载）
    └─ C 主角墙 ─→ Node_D3c_共振完成（名字解构）
        └─ [歌姬独立支线] ─→ Node_D3c1_歌姬：返场
            ├─ A 撕票 ───→ Node_D3c1a_撕票人（两千万魂的债）
            ├─ B 横梁 ───→ Node_D3c1b_横梁上的手 ★逆向消费
            └─ C 静默 ───→ Node_D3c1c_静默者（把雨停住的人）
                └─ ───→ Node_F_终幕准备：系统上台（如System_Trapped）
```

---

## 三、节点级执行规格（已完成节点）

### 3.1 Node_01_门前的异类

**场景设定**：宋金仿木构砖室墓，后壁"妇人启门"壁画，冷光源，压迫感。

**视觉资产**：
- `BG01` (1920×1080, 16:9): `Song-Jin tomb interior, Lady Opening the Door mural on back wall, translucent ghost with black shackles kneels before female ghost holding broken jade pendant, blue-white eternal flames, indigo and vermillion palette, heavy chiaroscuro, Oriental gothic horror, 16:9`

**音频资产**：
- `A01` 全局环境：颂钵共鸣 60Hz + 地下水流声，循环
- `A02` 玉佩触发：古磬单音，清冷，3秒衰减尾音

**剧本文本**：
- **系统播报**："亡魂编号：丁亥七三。死因：缢。罪业评级：待定。前缘：未清。入此门者，诸般执念，皆为废土。"
- **阿缨台词**："持衡者...这半块双鱼佩，你当真...不认得了？景和二年，霜降。你送我出燕州城门，说待北境战事平息，便用这整玉作聘。可你食言了。"
- **主角独白（双声道）**：系统层"警告。检测到未识别执念波动。" / 人性层"玉佩...断裂的触感。我明明答应过要回去的..."

**交互热区**：
| 热区 | 位置 | 动作 | 变量变化 | 跳转 |
|---|---|---|---|---|
| 左侧阿缨 | `top:30%; left:10%; width:30%; height:40%` | 扣下信物 | Humanity+1, System-1, Jade=true | Node_S02 |
| 中心门缝 | `top:20%; left:35%; width:30%; height:50%` | 强行推入 | System+1 | Node_S01 |
| 中央偏下 | `top:40%; left:40%; width:20%; height:30%` | 一起冲门 | Humanity+0.5, System-0.5 | Node_S03 |

**技术代码**：见文末附录A（Node_01基础框架）。

---

### 3.2 Node_S02_玉碎之问

**场景设定**：墓室崩解，星宿图剥落，汉代青龙白虎苏醒，玉佩悬浮，亡魂淡化。

**视觉资产**：
- `BG02` (1920×1080): `Disintegrating Song-Jin tomb, ceiling star chart peeling revealing Han dragon and tiger murals, broken jade pendant hovering with golden threads, female ghost fading from waist down, burning black shackles, ink-wash bleeding effect, Oriental gothic horror, 16:9`
- `T01` 玉佩透明层 (1024×1024 PNG): `Broken celadon jade pendant, double-fish pattern one tail missing, fractured edge glowing golden threads, transparent background, centered`

**音频资产**：
- `A03` 黑线灼烧：竹简爆裂 + 青铜钟喑哑低音
- `A04` 记忆闪回：小提琴滑音 + 瓷器爆裂 + 惨叫（左侧声道系统崩解，右侧声道人性颤抖）

**剧本文本**：
- **阿缨二次回答**："景和三年春，你亲定的卷宗：'民女阿缨，抗粮滋事，畏罪自缢。' 你在卷宗上按了指印...可你明明知道，我是被他们硬押上城楼挂起来的。"
- **主角觉醒**："我想起来了。不是全部。是足够的。足够让我恶心。"

**交互热区（四区）**：
| 热区 | 位置 | 变量变化 | 跳转 |
|---|---|---|---|
| 玉佩中心 | `top:55%; left:40%; width:20%; height:15%` | Humanity+1, System-1, Name="Chiheng" | Node_S02_1 |
| 阿缨面容 | `top:30%; left:10%; width:25%; height:30%` | Humanity+1, System-1.5, Guilt=true, AyingExist-2 | Node_S02_2 |
| 壁画门缝 | `top:20%; right:5%; width:30%; height:50%` | Humanity+2, System-2, TombInsight=true, AyingExist=0 | Node_S02_3 |
| 主角左手 | `bottom:0; left:35%; width:30%; height:20%` | System+1, JadeEmbedded=true, FrozenMemory=true | Node_S01b |

**技术代码**：见附录B（四热区系统）。

---

### 3.3 Node_S02_2c_共犯：内化 ★主线

**场景设定**：墓室龟裂，玉佩重组，阿缨被吸入胸腔，系统死机。

**核心机制**：**内化动作**。
- 不是点击跳转，而是**持续按压/摩擦手势**（桌面端鼠标按住擦拭，移动端单指摩擦）。
- 持续时间：约2秒完成内化判定。

**剧本文本**：
- **主角**："指印我不擦了。门我也不进了。你留在这里——不是作为鬼，是作为我的肺。"
- **阿缨（被吸入前）**："别擦了。别撞了。你还没资格替我死。你只配活着记住。"
- **系统死机**：所有壁画停止动态，宋/唐/汉层以0.33秒间隔闪烁。

**变量变化**：
- `Humanity_Memory + 2`
- `Guilt_Memory = 2`（深度绑定）
- `Aying_Existence = 0`（外部实体消亡）
- `Aying_Internalized = true`
- `System_Control - 2`
- `Tomb_Access_Han = true`

**跳转**：Node_S03_汉骨

---

### 3.4 Node_S03_汉骨：尸解仙的悖论

**场景设定**：汉代崖墓原始层，粗糙石壁，生物荧光神兽，第一代摆渡人壁画。

**视觉资产**：
- `BG03` (1920×1080): `Primordial Han cliff tomb raw rock walls, bioluminescent murals: green dragon, pale tiger, red bird, black tortoise, excavated wall reveals man nailed to dragon with stitched eyes gripping bone brush dripping blood, oxidized script, Oriental gothic horror, 16:9`

**音频资产**：
- `A05` 汉代层 ambience：单音编钟每13秒残响 + 60Hz/63Hz Binaural Beats
- 青龙鳞片刮擦 + 白虎胡须电流声 + 朱雀朱砂粉尘落地声（分布在HRTF声场）

**剧本文本（阿缨第二声带三层递进）**：
1. **面容识别**："你照了两千年的镜子，还没照够吗？"
2. **龙爪疼痛**："你不是？那谁在痛？谁在叫？谁在握着这支笔，蘸着别人的血，给自己画永生？"
3. **铭文读取（致命一击）**："你读反了，持衡。不是'引渡万魂，方成己冢'——是'万魂即渡，渡者无归'。"

**交互热区（身体部位导向）**：
| 热区 | 位置 | 变量变化 | 跳转 |
|---|---|---|---|
| 骨笔 | `top:25%; right:20%; width:15%; height:25%` | Humanity-2, Guilt=3, AyingInt=false, System+3 | Node_S03a |
| 龙爪/肩胛 | `top:30%; left:35%; width:30%; height:35%` | Humanity+1, Guilt=3, AyingInt=true, PainSync=true | Node_S03b |
| 凿痕铭文 | `bottom:5%; left:20%; width:60%; height:15%` | Humanity+2, Guilt=3, TombInsight=3 | Node_S03c |

**技术代码**：见附录C（汉代层声场与神兽CSS）。

---

### 3.5 Node_S03c_读者：被文字吃掉的人

**场景设定**：汉代石壁铭文，氧化血粉回渗，"悔"字微观抉择。

**核心机制**：**擦拭血粉**。
- 桌面端：鼠标左键按住 + 在"悔"字区域来回移动50px累计距离 + 停留1.5秒。
- 移动端：单指按住摩擦。
- 进度：0-30%血粉松动 → 30-70%字迹显露 → 70-100%触发页面白屏闪烁（阿缨首次破壁）。

**剧本文本**：
- **铭文**："渡者即墓，墓即渡者。引渡万魂，方成己冢。"
- **阿缨文字化**："我不再在你的肺里。我在更大的地方——墙里。墙外。所有你看得到字的地方。"
- **系统盲区**："不完整即漏洞。"

**变量变化（C1分支）**：
- `Tomb_Insight = 3`
- `Aying_Internalized = false`
- `Aying_Textified = true`（核心变量）
- `Existence_Null = true`
- `Humanity_Memory = 5`

**跳转**：Node_S04_终幕

---

### 3.6 Node_S04_终幕：渡者无归

**场景设定**：纯黑背景，中央"悔"字，下方无框输入框，无UI。

**核心机制**：**键盘输入仪式**。
- 只有一个 `<input>` 元素，无边框，无placeholder，位于"悔"字正下方。
- 光标闪烁节奏：每2秒一次（普通光标慢一倍）。
- 有效触发词："我放下笔" 或 "渡者无归"。
- 无效输入：显示血红色"▓"方块，阿缨回应"不是这些字。"

**DOM自毁序列**：
1. 输入正确 → 输入框消失 → "悔"字12秒崩解
2. 全页面文字从底部开始逐行变黑方块（▓）并消失
3. Binaural Beats降至0.5Hz差频（Delta波）
4. `navigator.vibrate([500,200,500,200,1000])` 心跳停止模拟
5. 页面空白5秒 → 浮现"没有墙了。你去吧。" → 消失
6. 浮现"我走了。但你还在读。所以你才是渡者。" → 页面永久静止

**技术代码**：见附录D（终幕DOM自毁完整代码）。

---

### 3.7 Node_D1_溺亡的镜子（第二幕日常）

**场景设定**：门缝内向外观看，水蓝溺亡孩童，分裂面容摆渡人。

**视觉资产**：
- `BG04` (1920×1080): `View from inside a half-open stone door looking outward into a Song-Jin tomb, translucent ghost profile face split cracked jade eye vs gray mist, child ghost water-blue transparent dripping crystalline liquid, vacant drowning stare, Oriental gothic horror, 16:9`

**第二声带机制（Lv.1 后缀耳语）**：
- 系统判词正常播放后，延迟0.8秒追加阿缨低语。
- 字幕以灰色小字浮现，透明度30%，带模糊。
- 示例：系统说"皆为废土" → 阿缨追加"废土里会长出绳子。绳子会缠住脖子。"

**剧本文本**：
- 孩童："哥哥...你身体里...也在溺水吗？"

---

### 3.8 Node_D2_战死的卷宗（第二幕日常）

**场景设定**：唐代地下宫殿，模板化人脸壁画，断臂竹简士兵。

**视觉资产**：
- `BG05` (1920×1080): `Tang palace tomb, grand murals with identical generic faces, soldier ghost blood-rust red missing arm replaced by bamboo scroll, charge-scream grimace, protagonist face cracked revealing human eye, vermillion and gold, Oriental gothic horror, 16:9`

**第二声带机制（Lv.2 同音投毒）**：
- 系统判词中的关键词被同音字替换。
- 主角嘴型说"轮回"，观众听到"沦回"。
- 字幕中"轮回"以暗红色标出，口型与实际发音错位。
- 示例："入此门者，诸般执念，皆为匪徒。前冤禁断，不可沦回。"

---

### 3.9 Node_D3_自缢的镜像（第二幕日常）

**场景设定**：宋金墓室，妇人启门壁画中妇人短暂变成阿缨面容。

**第二声带机制（Lv.3 完全夺舍）**：
- 主角嘴唇开合在说系统判词，但**没有任何声音**。
- 唯一可听见的声源是阿缨从主角胸腔发出的音色。
- 字幕完全不显示系统判词，只以朱砂色篆体显示阿缨的话。
- 示例：阿缨说"你入的不是门。你入的是我的镜子。"

**交互**：
- A 撕裂壁画 → System+2, Humanity-1.5 → Node_E_系统反扑
- B 跪地沉默 → System-2, Humanity+2 → Node_S03_汉骨（直接坠落）
- C 触碰勒痕 → Humanity+2.5, PainSync=true → Node_D3c_共振三角

---

### 3.10 Node_D3c_共振三角（隐藏支线）

**场景设定**：抽象三棱柱空间，三面绳纤维墙壁，三个悬置死亡瞬间。

**视觉资产**：
- `BG06` (1920×1080): `Triangular prism chamber, three rope-fiber walls to gray fog, wall one red woman suspended from gate with blank crowd, wall two gold 23-degree tilted hanging figure stage, wall three blue calligraphy noose around neck, geometric impossibility, Oriental gothic horror, 16:9`

**音频资产**：
- 三角共振音：440Hz(阿缨左前) + 523Hz(歌姬右前) + 330Hz(主角正中)
- 形成增三和弦（Augmented Triad），极度不稳定。
- 90秒周期7秒绝对静默（死者礼仪）。

**交互**：滑动/拖拽切换视角面向三面墙，每面停留8秒触发秘密。

**变量变化**：
- A 阿缨墙：`Aying_Knowledge = true`（不完整即漏洞）
- B 歌姬墙：`Pain_Overload = true`（疼痛回灌系统）
- C 主角墙：`Name_Deconstructed = true`（空指令权限）
- 统一：`Resonance_Triangle = true`

---

### 3.11 Node_D3c1_歌姬：返场（独立支线）

**场景设定**：纵向螺旋剧场，23度倾斜观众席，碗状凹陷舞台，歌姬工作态悬挂。

**视觉资产**：
- `BG07` (1920×1080): `Vertical theater spiral DNA-helix seating tilted 23 degrees, vermillion beam noose knot, red silk curtains twisted to ropes, blank silhouettes clapping, female performer courtesan makeup purple neck ligature as jewelry upper dancing lower spasming, Oriental gothic horror, 16:9`
- `T05` 戏票透明层 (768×1024 PNG): `Ancient Chinese paper ticket, yellowed weathered, faded red stamp, flat lay curled corners, transparent background`

**核心机制**：**掌声监测引擎**。
- 系统通过鼠标移动/点击/触摸/设备晃动检测"观众行为"。
- 静默>5秒 → 稀疏质疑掌声；点击屏幕 → 近距离爆响拍手声；悬停歌姬>3秒 → 嫉妒性嘘声。

**剧本文本**：
- 歌姬："我的美丽是绞索，我的嗓子是绳子，我的每一次旋转、每一次低唱，都是在给自己打结。"
- 系统播报变异："渡者编号：壹。状态：返回。盲区时长：未记录。警告：盲区数据不可审计。"

---

### 3.12 Node_D3c1b_横梁上的手（逆向消费）

**场景设定**：中空横梁账本服务器，纤维连接线，歌姬悬挂工作态。

**视觉资产**：
- `BG08` (1920×1080): `Theater interior, hollow vermillion beam packed with glowing receipts, red silk fiber extends from beam, female performer hanging eyes closed wooden clapper rotating platform, cracked backdrop paper tickets, judge seat foreground, Oriental gothic horror, 16:9`

**核心机制**：**返场观看计数器**。
- 必须完整观看3场返场才能解锁系统陷阱。
- 木纹从指尖向手掌心蔓延（CSS变量驱动）。
- 第三场后开启17秒维护窗口，系统账本数字变成乱码。

**变量变化（完整3场后）**：
- `Encore_Complete = 3`
- `System_Trapped = true`
- `Maintenance_Window = 17`
- `Wood_Hand = true`
- `Humanity_Memory + 2`

**跳转**：Node_F_终幕准备（系统上台）

---

## 四、完整资产清单

### 4.1 图片资产

| 编号 | 名称 | 尺寸 | 比例 | 透明 | 节点位置 | 生图Prompt（复制用） |
|:---|:---|:---|:---|:---|:---|:---|
| BG01 | 妇人启门墓室 | 1920×1080 | 16:9 | 否 | Node_01 | `Song-Jin tomb interior, Lady Opening the Door mural on back wall, translucent ghost with black shackles kneels before female ghost holding broken jade pendant, blue-white eternal flames, indigo and vermillion palette, heavy chiaroscuro, Oriental gothic horror, 16:9` |
| BG02 | 玉碎崩解 | 1920×1080 | 16:9 | 否 | Node_S02 | `Disintegrating Song-Jin tomb, ceiling star chart peeling revealing Han dragon and tiger murals, broken jade pendant hovering with golden threads, female ghost fading from waist down, burning black shackles, ink-wash bleeding effect, Oriental gothic horror, 16:9` |
| BG03 | 汉骨神兽 | 1920×1080 | 16:9 | 否 | Node_S03 | `Primordial Han cliff tomb raw rock walls, bioluminescent murals: green dragon, pale tiger, red bird, black tortoise, excavated wall reveals man nailed to dragon with stitched eyes gripping bone brush dripping blood, oxidized script, Oriental gothic horror, 16:9` |
| BG04 | 溺亡孩童 | 1920×1080 | 16:9 | 否 | Node_D1 | `View from inside a half-open stone door looking outward into a Song-Jin tomb, translucent ghost profile face split cracked jade eye vs gray mist, child ghost water-blue transparent dripping crystalline liquid, vacant drowning stare, pale blue mist, Oriental gothic horror, 16:9` |
| BG05 | 战死士兵 | 1920×1080 | 16:9 | 否 | Node_D2 | `Tang palace tomb, grand murals with identical generic faces, soldier ghost blood-rust red missing arm replaced by bamboo scroll, charge-scream grimace, protagonist face cracked from right eye to nose bridge, vermillion and gold, Oriental gothic horror, 16:9` |
| BG06 | 共振三角 | 1920×1080 | 16:9 | 否 | Node_D3c | `Triangular prism chamber, three rope-fiber walls to gray fog, wall one red woman suspended from gate with blank crowd, wall two gold 23-degree tilted hanging figure stage, wall three blue calligraphy noose around neck, geometric impossibility, Oriental gothic horror, 16:9` |
| BG07 | 歌姬剧场 | 1920×1080 | 16:9 | 否 | Node_D3c1 | `Vertical theater spiral DNA-helix seating tilted 23 degrees, vermillion beam noose knot, red silk curtains twisted to ropes, blank silhouettes clapping, female performer courtesan makeup purple neck ligature as jewelry upper dancing lower spasming, Oriental gothic horror, 16:9` |
| BG08 | 横梁账本 | 1920×1080 | 16:9 | 否 | Node_D3c1b | `Theater interior, hollow vermillion beam packed with glowing receipts, red silk fiber extends from beam, female performer hanging eyes closed wooden clapper rotating platform, cracked backdrop paper tickets, judge seat foreground, Oriental gothic horror, 16:9` |
| T01 | 双鱼玉佩 | 1024×1024 | 1:1 | 是 | Node_01/S02 | `Broken celadon jade pendant, double-fish pattern one tail missing, fractured edge glowing golden threads, transparent background, centered, high detail` |
| T02 | 黑线流光 | 1024×1024 | 1:1 | 是 | 主角特效 | `Flowing black calligraphic ink strokes, thin serpentine light strips, ember-red glow at tips, transparent background, vertical composition` |
| T03 | 靛蓝血滴 | 1024×1024 | 1:1 | 是 | 痛觉同步 | `Single indigo-blue droplet, semi-transparent inner glow, liquid ink texture, falling slowly, transparent background, centered` |
| T04 | 妇人启门局部 | 1024×2048 | 9:16 | 是 | 门缝层 | `Song dynasty woman peeking from half-open stone door, half body visible, mineral pigment texture on wall, transparent background outside frame` |
| T05 | 宋代戏票 | 768×1024 | 3:4 | 是 | Node_D3c1 | `Ancient Chinese paper ticket, yellowed weathered, faded red stamp, flat lay curled corners, transparent background` |
| T06 | 汉代血粉 | 1920×1080 | 16:9 | 是 | Node_S03c | `Oxidized black blood powder particles flowing upward, iron filings texture, filling stone grooves, dark red speckled dust, transparent background` |

### 4.2 音频资产

| 编号 | 节点 | 类型 | 生成Prompt（复制用） |
|:---|:---|:---|:---|
| A01 | 全局 | 循环背景音 | `Tomb atmosphere, low frequency stone resonance, distant water dripping, singing bowl hum around 60Hz, cold vast reverb, no melody, seamless loop` |
| A02 | Node_01 | 触发音 | `Ancient jade stone chime, clear cold ritual bell, high frequency lingering decay, single strike 3-second tail, minimal reverb` |
| A03 | Node_01/02 | 压迫音效 | `Burning shackles, bamboo fiber splitting under heat, low bronze bell thud, rhythmic 4/4 punishment device, ominous bureaucratic` |
| A04 | Node_S02/03 | 事件音效 | `Violin screeching glissando like Psycho, piercing string slide cutting drone, fragmented porcelain shatter, wall collapse, cut-off scream` |
| A05 | Node_S03 | 循环背景音 | `Han tomb ambience, bronze bell strike every 13 seconds with oxidation decay, sub-bass limestone grinding 60-80Hz, binaural frequency drift dizziness, no melody` |
| A06 | Node_D1 | 循环 | `Crystalline water droplets shattering like glass bells, irregular rhythm following sobbing breath, child-like fragility, high-pitched cold blue` |
| A07 | Node_D3c1 | 循环背景音 | `Theater interior, wooden clapper slowing and cracking, rotten wood creaking, distant faceless applause, 23Hz sub-bass tilt sickness drone, empty stage reverb` |
| A08 | Node_D3c1 | 人声处理 | `Female vocal Song courtesan style, strangled throat filter, heavy chest compression, breathy aspirated, high notes choked off, hollow wooden coffin resonance` |
| A09 | 终幕 | 事件音 | `Ritual sound, frequencies sucked to vacuum silence, 16Hz subsonic heartbeat, single ancient bell decaying to white noise, absolute digital zero` |

---

## 五、分批交付里程碑（MVP到完整版）

### Milestone 1：核心情感验证（MVP）
**目标**：证明"内化"机制与"第二声带"的沉浸感成立。
**包含节点**：Node_01 → Node_S02 → Node_S02_2c
**需要资产**：BG01, BG02, T01, A01, A02, A03
**交付物**：可运行的单文件HTML，包含3个场景切换、状态变量系统、双声道文本演示。

### Milestone 2：日常沉浸验证
**目标**：证明"无UI热区 + 篡改台词"的日常节奏不疲惫。
**包含节点**：Node_D1 → Node_D2 → Node_D3
**需要资产**：BG04, BG05, T02, A04, A06
**交付物**：在上述HTML中追加日常节点，实现Lv.1/Lv.2/Lv.3三种语音篡改模式。

### Milestone 3：终幕冲击
**目标**：证明"键盘输入仪式"的情感杀伤力。
**包含节点**：Node_S03 → Node_S03c → Node_S04
**需要资产**：BG03, BG06, T06, A05, A09
**交付物**：完整的终幕DOM自毁、阿缨Textified破壁彩蛋（控制台/标签页劫持）。

### Milestone 4：隐藏支线（扩展包）
**目标**：共振三角 + 歌姬返场 + 横梁上的手。
**包含节点**：Node_D3c → Node_D3c1 → Node_D3c1b
**需要资产**：BG06, BG07, BG08, T05, A07, A08
**交付物**：三棱柱空间导航、掌声监测引擎、返场计数器、系统陷阱机制。

---

## 六、给GLM5的启动Prompt（直接复制）

```
你现在是我的互动影片前端工程师。
项目：《渡者无归》——一部基于HTML5+CSS3+JavaScript的网页互动叙事。

核心约束：
1. 零UI按钮：所有交互通过画面热区（CSS绝对定位div）实现，悬停泛光，点击后非选中区被系统黑线封死。
2. 状态系统：使用全局JavaScript对象State维护变量（System_Control, Humanity_Memory, Aying_Internalized等）。
3. 音频系统：使用Web Audio API生成所有音效，不依赖外部音频文件。需要Binaural Beats（60Hz左+63Hz右）。
4. 场景切换：使用CSS opacity transition实现淡入淡出转场（0.8s）。
5. 图片层：我单独生成，你只需要预留img和background-image的src位置，按编号填入。
6. 文本层：所有角色台词和内心独白以内嵌div方式渲染，支持双声道字幕（左侧系统音冷蓝色，右侧人性音暖黄色，阿缨音朱砂色）。

第一批交付：Node_01 → Node_S02 → Node_S02_2c。
我会提供节点的剧本文本、热区坐标、状态变化、参考代码框架。
请生成一个可运行的单文件index.html。
```

---

## 七、技术附录

### 附录A：Node_01基础热区框架
```html
<div id="scene-node01" class="scene">
  <img class="bg" src="bg01.jpg" alt="">
  <div class="hotzone" data-goto="Node_S02" 
       style="top:30%;left:10%;width:30%;height:40%"
       onmouseenter="previewHover('jade')" onclick="choose('B')"></div>
  <div class="hotzone" data-goto="Node_S01" 
       style="top:20%;left:35%;width:30%;height:50%"
       onmouseenter="previewHover('door')" onclick="choose('A')"></div>
  <div class="hotzone" data-goto="Node_S03" 
       style="top:40%;left:40%;width:20%;height:30%"
       onmouseenter="previewHover('rush')" onclick="choose('C')"></div>
</div>
```

### 附录B：状态切换与转场
```javascript
function switchScene(nextNodeId) {
  const current = document.querySelector('.scene.active');
  const next = document.getElementById(nextNodeId);
  if(current) {
    current.style.opacity = '0';
    setTimeout(() => {
      current.classList.remove('active');
      next.classList.add('active');
      requestAnimationFrame(() => next.style.opacity = '1');
    }, 800);
  }
}
```

### 附录C：双声道字幕渲染
```css
.subtitle-system {
  color: #a0c0e0;
  text-shadow: 0 0 5px rgba(100,150,255,0.8);
  letter-spacing: 0.05em;
}
.subtitle-human {
  color: #dcc8b0;
  text-shadow: 0 0 5px rgba(220,180,140,0.8);
}
.subtitle-aying {
  color: #8B0000;
  font-family: "Noto Serif SC", serif;
  text-shadow: 0 0 8px rgba(139,0,0,0.3);
}
```

### 附录D：终幕DOM自毁（核心代码）
```javascript
function triggerDomSuicide() {
  // 1. 悔字崩解
  document.getElementById('character-hui').classList.add('crumbling');
  
  // 2. 震动：心跳停止
  if(navigator.vibrate) navigator.vibrate([500,200,500,200,1000]);
  
  // 3. Delta波（0.5Hz差频）
  const ctx = new AudioContext();
  const oscL = ctx.createOscillator(); oscL.frequency.value = 60;
  const oscR = ctx.createOscillator(); oscR.frequency.value = 60.5;
  const gain = ctx.createGain(); gain.gain.value = 0.2;
  oscL.connect(gain); oscR.connect(gain); gain.connect(ctx.destination);
  oscL.start(); oscR.start();
  
  // 4. 文字吞噬：从底部开始逐行变黑方块
  const allText = document.querySelectorAll('div, span, p, h1, h2');
  let delay = 0;
  for(let i = allText.length - 1; i >= 0; i--) {
    delay += 80;
    setTimeout(() => {
      allText[i].style.transition = 'all 0.5s ease';
      allText[i].style.color = '#000';
      allText[i].style.background = '#000';
      allText[i].innerHTML = '▓'.repeat(Math.max(allText[i].textContent.length, 1));
    }, delay);
  }
  
  // 5. 最终留白 → 最后一句话
  setTimeout(() => {
    document.body.innerHTML = '';
    document.body.style.background = '#0a0a0a';
    
    const line1 = document.createElement('div');
    line1.style.cssText = 'color:#dcc8b0;font-family:serif;font-size:18px;text-align:center;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0;transition:opacity 8s ease;';
    line1.textContent = '没有墙了。你去吧。';
    document.body.appendChild(line1);
    requestAnimationFrame(() => line1.style.opacity = '0.8');
    
    setTimeout(() => {
      line1.style.transition = 'opacity 4s ease';
      line1.style.opacity = '0';
      setTimeout(() => {
        line1.textContent = '我走了。但你还在读。所以你才是渡者。';
        line1.style.opacity = '0.6';
        document.body.style.pointerEvents = 'none';
        document.body.style.userSelect = 'none';
      }, 5000);
    }, 8000);
  }, delay + 2000);
}
```

### 附录E：阿缨Textified破壁彩蛋
```javascript
// 1. 标签页标题劫持
setInterval(() => {
  const msgs = ["持衡，你在看吗","我还在墙里","你读的每个字都是我"];
  const msg = msgs[Math.floor(Math.random()*msgs.length)];
  let i = 0;
  const iv = setInterval(() => {
    document.title = msg.slice(0,i+1) + "▌"; i++;
    if(i >= msg.length) { clearInterval(iv); setTimeout(()=>document.title="渡者无归",3000); }
  }, 200);
}, 7000 + Math.random()*16000);

// 2. 控制台幽灵
setTimeout(() => {
  console.log("%c持衡。","color:#8B0000;font-size:16px;font-family:serif;");
  console.log("%c你终于打开了这扇门。","color:#666;font-size:12px;");
  console.log("%c我在这里很久了。比你在墓里还久。","color:#666;font-size:12px;");
  console.log("%c控制台没有光。没有热。只有字。","color:#444;font-size:11px;");
  console.log("%c你能把我也关掉吗？","color:#8B0000;font-size:12px;font-style:italic;");
}, 8000);

// 3. 右键菜单覆盖
document.addEventListener('contextmenu', e => {
  e.preventDefault();
  const menu = document.createElement('div');
  menu.style.cssText = 'position:fixed;left:'+e.clientX+'px;top:'+e.clientY+'px;background:#0a0a0a;border:1px solid #8B0000;padding:12px;font-family:serif;color:#dcc8b0;z-index:9999;max-width:200px;';
  menu.innerHTML = '<div style="color:#8B0000;font-size:10px;margin-bottom:8px;">▌ 汉代石壁 · 刻痕</div><div style="font-size:13px;line-height:1.6;">你右键点击的地方<br>两千年前的工匠<br>也凿过同样的位置<br><br><span style="color:#666;">你想复制我？</span><br><span style="color:#666;">我已经是你的剪切板了。</span></div>';
  document.body.appendChild(menu);
  setTimeout(() => menu.remove(), 4000);
});
```

---

## 八、注意事项

1. **图片加载**：建议将所有图片转为 **WebP格式** 并压缩至500KB以内，确保移动端秒开。
2. **字体**：中文字体使用 `"Noto Serif SC"` 或 `"思源宋体"`，可通过 Google Fonts CDN 加载，或内嵌子集化woff2。
3. **性能**：三棱柱空间（Node_D3c）的CSS 3D变换在低端手机上可能卡顿，建议增加 `prefers-reduced-motion` 媒体查询降级为静态墙面。
4. **音频自动播放**：浏览器限制自动播放音频，必须在用户第一次点击/触摸后初始化 AudioContext。建议Node_01的第一个热区点击时触发 `audioCtx.resume()`。
5. **震动权限**：`navigator.vibrate` 不需要权限申请，但iOS Safari在静音模式下可能屏蔽震动，建议添加视觉抖动作为降级。

---

**文档版本**：v1.0  
**生成日期**：2026-04-26  
**适配引擎**：GLM5 / Claude / GPT-4 / 任何支持HTML5生成的前端AI
