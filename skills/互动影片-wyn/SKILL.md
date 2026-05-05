---
name: 互动影片-wyn
description: "网页端互动影片/交互叙事创作引擎。支持状态机驱动叙事变异、全屏热区沉浸交互、分支场景管理、音频分层、存档系统。基于'渡者无归'项目实践提炼的通用框架，纯HTML5+CSS3+JS技术栈，单文件交付。Trigger: 互动影片、交互电影、互动叙事、分支视频、interactive film、FMV、渡者无归。"
license: MIT-0
metadata:
  author: wuyongnaren
  version: "1.0.0"
  language: zh-CN
  category: interactive-film
  tags: "互动影片, 交互电影, 分支叙事, 状态机, 热区交互, HTML5, 单文件, 渡者无归"
xinggui:
  layer: engine
  layer_name: "引擎层"
  phase: [4, 5]
  invokes:
    - "故事引擎-wyn"
    - "民俗-wyn"
    - "顶级编剧导演思维蒸馏-wyn"
  produces:
    - "互动影片剧本"
    - "状态机定义"
    - "节点网络图"
    - "热区交互规范"
    - "场景JSON数据"
    - "单HTML交付文件"
---

# 互动影片创作引擎

网页端互动影片/交互叙事的完整创作框架。从剧本到单HTML交付。

---

## 核心定位

| 能力 | 说明 |
|------|------|
| **状态机引擎** | 变量驱动叙事变异，所有分支由状态对象控制 |
| **热区交互** | 无UI按钮，全屏沉浸式画面热区点击 |
| **分支叙事** | 节点网络图 + JSON数据驱动场景切换 |
| **音频分层** | Web Audio API 四层叠加（环境/系统/人性/灵异） |
| **存档系统** | localStorage 保存进度和选择历史 |
| **单文件交付** | 最终产物为单个 index.html |

---

## 快速入口

| 用户说 | 执行 |
|--------|------|
| "创建互动影片" | 启动完整的影片创作流程 |
| "设计状态机" | 定义驱动叙事变异的状态变量 |
| "画节点网络" | 生成完整的分支场景图 |
| "做热区交互" | 定义场景热区位置和跳转 |
| "导出单HTML" | 打包为可运行的单文件 |

---

## 技术架构

### 1. 状态机（State Machine）

所有叙事变异由一个全局状态对象驱动：

```javascript
const State = {
  // 核心双轴（示例：系统控制 × 人性记忆）
  Axis_Primary: 3,      // 主轴（范围和含义由项目定义）
  Axis_Secondary: 0,    // 副轴

  // 身份变量（根据项目定制）
  Identity_Status: "default",

  // 关键角色存在状态
  Key_Character_Level: 3,  // 3=完整 → 0=消散 → -1=撕裂

  // 认知/罪恶/秘密
  Knowledge_Depth: 0,
  Guilt_Level: 0,

  // 支线追踪
  Subplot_Progress: 0,
  Subplot_Flag: false,

  // 终幕条件
  Ending_Unlocked: false
};
```

**设计原则**：
- 状态变量数量控制在 15-30 个
- 每个变量必须是**可序列化**的（数字/布尔/字符串）
- 状态变化必须**可逆**（支持回溯/存档恢复）
- 核心轴（双轴）决定全局叙事走向，细粒度变量决定具体变异

### 2. 无UI热区规范

所有交互通过画面热区完成，**严禁 HTML 原生按钮**。

```html
<div class="scene-container" id="node-01">
  <img class="bg-layer" src="bg01.jpg" alt="">

  <!-- 热区A -->
  <div class="hotzone" data-action="A" data-goto="node-s02"
       style="position:absolute; top:30%; left:10%; width:30%; height:40%;"></div>

  <!-- 热区B -->
  <div class="hotzone" data-action="B" data-goto="node-s03"
       style="position:absolute; top:20%; left:35%; width:30%; height:50%;"></div>
</div>
```

**热区CSS**：
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
.hotzone.disabled {
  pointer-events: none;
  filter: grayscale(100%) brightness(0.3);
  transition: filter 0.8s ease;
}
```

**热区设计规则**：
- 热区数量：每场景 1-3 个（不超过4个）
- 热区面积：≥ 15% 画面面积（移动端可点击）
- 悬停反馈：微光/脉冲效果（不暴露"按钮感"）
- 选择后：未选热区以视觉方式"关闭"（灰化/暗线封死）

### 3. 节点网络图

用 Mermaid 或文本格式描述完整的分支结构：

```
Node_01_起始
├─ A 选择1 ─→ Node_S02_分支A
│   ├─ A 深入 ─→ Node_S02a
│   └─ B 退出 ─→ Node_S02b
├─ B 选择2 ─→ Node_S03_分支B
│   └─ ────────→ Node_S04_汇合
└─ C 选择3 ─→ Node_S04_汇合 ★主线
```

### 4. 场景JSON数据结构

```json
{
  "nodes": {
    "node-01": {
      "id": "node-01",
      "title": "起始场景",
      "background": "assets/scene-01.png",
      "audio": { "base": "ambient-01.mp3", "system": null, "human": null, "ghost": null },
      "text": { "narration": "旁白文本...", "subtitle": "字幕文本" },
      "hotzones": [
        { "action": "A", "goto": "node-s02", "rect": { "top": 0.3, "left": 0.1, "width": 0.3, "height": 0.4 }, "stateMutations": {"Axis_Primary": -1} },
        { "action": "B", "goto": "node-s03", "rect": { "top": 0.2, "left": 0.35, "width": 0.3, "height": 0.5 }, "stateMutations": {"Axis_Secondary": 1} }
      ],
      "conditions": {
        "enterIf": { "Axis_Primary": { ">=": 2 } },
        "availableHotzones": {
          "A": { "always": true },
          "B": { "requires": { "Subplot_Flag": true } }
        }
      }
    }
  }
}
```

### 5. 音频分层架构

```javascript
const AudioLayers = {
  base: null,      // 环境氛围（循环）
  system: null,    // 系统音（机械/冰冷）
  human: null,     // 人性音（喘息/颤抖/心跳）
  ghost: null      // 特殊音（灵异/篡改/共振）
};
```

- 使用 Web Audio API 程序化生成，无需外部音频文件
- Binaural Beats 可选（差频制造眩晕感）
- 移动端震动反馈（navigator.vibrate）

### 6. 存档系统

```javascript
const SaveSystem = {
  save(slot) {
    const data = { state: {...State}, currentNode: currentNodeId, history: choiceHistory, timestamp: Date.now() };
    localStorage.setItem(`startrack_if_save_${slot}`, JSON.stringify(data));
  },
  load(slot) {
    const data = JSON.parse(localStorage.getItem(`startrack_if_save_${slot}`));
    if (data) { Object.assign(State, data.state); return data.currentNode; }
    return null;
  },
  getSlots() { /* 返回所有存档位 */ }
};
```

---

## 工作流

### Phase 1：剧本设计
- 使用故事引擎的灵感工坊/结构工坊设计分支剧本
- 输出：节点列表 + 每个节点的核心冲突

### Phase 2：状态机定义
- 根据剧本提取需要追踪的状态变量
- 定义核心双轴（决定全局走向）
- 定义细粒度变量（决定具体变异）
- 输出：State 对象定义

### Phase 3：节点网络设计
- 将剧本转化为节点网络图
- 每个节点标注：背景/音频/热区/条件/状态变异
- 标注主线（★）和支线
- 输出：Mermaid 图 + 完整节点网络文本

### Phase 4：场景JSON数据
- 将节点网络转化为 JSON 数据结构
- 定义热区坐标、状态变异、进入条件
- 输出：完整的 scenes.json

### Phase 5：视觉素材
- 场景背景图（全屏 PNG）
- 透明叠加层（PNG，用于氛围变化）
- 角色立绘/物品图标（可选）

### Phase 6：音频设计
- 四层音频方案（环境/系统/人性/特殊）
- 程序化音频（Web Audio API）或外部音效文件
- 热区悬停音效

### Phase 7：单HTML打包
- 内嵌 CSS + JS
- 图片外链或小文件 Base64
- 视频使用外部 CDN
- 输出：单个 index.html

---

## 参考项目

- **渡者无归**（古典主题东方哥特互动叙事）— 本技能的核心参考
- **Twine**（可视化分支叙事编辑器）
- **ink/inkjs**（叙事脚本语言 + Web运行时）
- **branchie**（HTML5互动视频播放器）
- **interactive-video-player**（视频分支+动态画质）
- **FMVEngine**（浏览器FMV引擎）

---

## 关联技能

| 技能 | 协作方式 |
|------|---------|
| `故事引擎-wyn` | 剧本创作、结构设计、人物工坊 |
| `民俗-wyn` | 中国传统叙事母题、民间故事素材 |
| `顶级编剧导演思维蒸馏-wyn` | 剧本会诊、对抗性审查 |
| `星轨管家-wyn` | 最终产物的发布和元数据管理 |

---

_基于"渡者无归"互动影片项目实践提炼，借鉴 Claude Code Game Studios 的场景管理/对话系统/存档系统架构。_
