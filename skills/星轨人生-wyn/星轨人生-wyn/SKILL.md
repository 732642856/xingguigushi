---
name: 星轨人生-wyn
description: "紫微斗数综合创作工具箱。整合底层算法引擎与上层应用，提供从排盘到人物设定的一站式服务。"
license: MIT-0
metadata:
  author: wuyongnaren
  version: "1.0.0"
  language: zh-CN
  category: creative-writing
  tags: "紫微斗数, 命理, 角色设计, 命运, 小说, 剧本"
---

# 星轨人生-wyn

紫微斗数综合创作工具箱，整合底层算法引擎与上层应用，为创作者提供从排盘到人物设定的一站式服务。

---

## 技能定位

本 Skill 是**紫微斗数完整创作解决方案**，包含：

1. **算法引擎层**（ziwei-engine）- 完整排盘算法，支持飞星/大限/流年
2. **应用层**（角色设计）- 从属性到命盘的智能匹配与生成

---

## 双模式使用

### 模式一：代码调用（开发者）

适合需要批量生成、自动化的场景

```javascript
const { generateFullChart } = require('./references/core-engine.js');

const chart = generateFullChart({
    year: 1975, lunarMonth: 3, lunarDay: 17,
    shichen: '戌', gender: 'male',
    flowYear: 2026, age: 51
});

// 获取命盘数据
chart.mingPalace.dizhi      // 命宫地支
chart.mainStars             // 主星分布
chart.flyingStars           // 宫干飞化
chart.daxianSequence       // 大限序列
```

详细接口见：`references/api-spec.md`

### 模式二：Prompt交互（编剧/作家）

适合快速为小说/剧本创建人物的场景

**使用流程：**

```
输入角色基础属性（性别/年龄/性格/职业/背景）
      ↓
智能匹配144种标准命盘
      ↓
输出完整人物设定
      - 性格特质
      - 命运走向
      - 人生节点
      - 与其他角色的关系
```

**角色生成模板：**

```markdown
## 角色：XXX

### 基础属性
- 性别：男/女
- 年龄阶段：少年/青年/中年/老年
- 职业：
- 性格倾向：
- 家庭背景：
- 人生基调：

### 命盘匹配
- 命宫主星：
- 辅助星曜：
- 四化走向：
- 重点宫位：

### 人物设定
- 性格描述：
- 命运轨迹：
- 人生转折点：
- 与其他角色的关系：
```

详细模板见：`references/角色生成Prompt模板.md`

---

## 知识来源

- 付老师全套讲义 55 节（四化派·传统体系）
- 梁若瑜《飞星紫微斗数》（飞星派）
- 令东来《紫微斗数全书》2018版
- 劝学斋主·钦天四化体系
- 陈雪涛《安星诀与星情秘法》
- **星轨人生 iOS App**（GitHub: star-track-life）
  - character-bio-generator.js - 角色小传生成引擎
  - writing-resources.js - 写作词库资源
  - ziwei-psychology.js - 紫微心理学模块
- **阴门故事创作器** - 道德坐标体系参考

---

## 核心文件说明

| 文件 | 用途 |
|------|------|
| `core-engine.js` | 排盘算法核心模块 |
| `character-bio-generator.js` | 角色小传生成引擎（GitHub） |
| `character_templates.md` | 角色模板 |
| `character-archetypes.md` | 道德坐标体系（yinmen） |
| `ziwei-psychology.js` | 心理学模块（GitHub） |
| `api-spec.md` | JSON接口规范 |

---

## 快速入门

### 只想快速生成角色？

1. 确定角色基础属性（性别、年龄、职业、性格倾向、人生基调）
2. 使用角色生成模板
3. 系统自动匹配最佳命盘
4. 获得完整人物设定

### 想要深度定制？

1. 使用 `generateFullChart()` 生成精确命盘
2. 分析星曜组合与四化飞化
3. 手动调整人物设定
4. 导出为角色档案

---

## 核心文件说明

| 文件 | 用途 |
|------|------|
| `core-engine.js` | 排盘算法核心模块 |
| `api-spec.md` | JSON接口规范 |
| `test-cases.md` | 验证通过的案例 |
| `命盘数据总库.json` | 144种标准命盘数据 |
| `十二宫位解读.md` | 宫位含义详解 |
| `四化飞星指南.md` | 飞星体系说明 |

---

## 版本

- v1.0.0 (2026-04-03): 整合 ziwei-engine 与角色设计

---

## 配套使用

本 skill 可与以下 skill 配合使用：

| 配套 Skill | 协作方式 |
|------------|----------|
| **六壬探案-wyn** | 六壬负责案件推理，本 skill 负责角色命运设计 |
| **阴门故事创作器** | 本 skill 生成角色命盘，yinmen 负责黑色幽默叙事 |

组合示例：
```
六壬探案（案件框架） + 星轨人生（角色命运） = 完整的悬疑推理故事
```