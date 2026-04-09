# ziwei-engine 开发者接口规范 v3.0

## 概述

本引擎提供紫微斗数排盘的核心算法，**不绑定任何UI框架**。  
输入：出生参数 → 输出：标准JSON命盘数据。

**v3.0 新增：** 飞星宫干飞化、自化检测、大限推演、流年/流月/流日/流时全套算法。  
**算法来源：** 付老师全套讲义（四化派）+ 梁若瑜飞星派 + 令东来体系  
**核心修正：** 8大历史bug，详见 `algorithm-corrections.md`

---

## 引入方式

### Node.js / CommonJS
```js
const ziwei = require('./references/core-engine.js');
```

### 浏览器（Script标签）
```html
<script src="references/core-engine.js"></script>
<script>
  const result = ZiweiEngine.generateFullChart({ ... });
</script>
```

---

## 主入口函数

### `generateFullChart(input)` — 完整命盘 + 飞星体系（推荐）

**输入参数：**
```json
{
  "year": 1975,        // 公历出生年份（必填）
  "lunarMonth": 3,     // 农历生月 1-12（必填）
  "lunarDay": 17,      // 农历生日 1-30（必填）
  "shichen": "戌",     // 生时地支名 子/丑/寅/卯/辰/巳/午/未/申/酉/戌/亥（必填）
  "gender": "male",    // 性别：'male'/'female'（选填，默认male）
  "flowYear": 2026,    // 流年公历年（选填，传入则计算流盘）
  "lunarFlowMonth": 3, // 流月农历月（选填，配合flowYear使用）
  "age": 51            // 当前年龄（选填，用于查当前大限）
}
```

**输出格式（完整示例）：**
```json
{
  "input": { "year":1975, "lunarMonth":3, "lunarDay":17, "shichen":"戌", "gender":"male" },
  "yearGanZhi": { "gan":"乙", "zhi":"卯" },
  "wuxingJu": 3,
  "wuxingJuName": "木三局",
  "mingPalace": { "dizhi":"午", "index":6, "gan":"壬" },
  "shenPalace": { "dizhi":"寅", "index":2 },
  "ziweiPalace": { "dizhi":"午", "index":6 },
  "palaceGans": ["戊","己","戊","己","庚","辛","壬","癸","甲","乙","丙","丁"],
  "mainStars": {
    "紫微":6,"天机":5,"太阳":3,"武曲":2,"天同":1,"廉贞":10,
    "天府":10,"太阴":11,"贪狼":0,"巨门":1,"天相":2,"天梁":3,"七杀":4,"破军":8
  },
  "minorStars": {
    "文昌": { "palaceIdx":1, "type":"吉" },
    "文曲": { "palaceIdx":11, "type":"吉" },
    "天魁": { "palaceIdx":0, "type":"吉" },
    "天钺": { "palaceIdx":8, "type":"吉" },
    "左辅": { "palaceIdx":6, "type":"吉" },
    "右弼": { "palaceIdx":8, "type":"吉" },
    "禄存": { "palaceIdx":3, "type":"吉" },
    "擎羊": { "palaceIdx":4, "type":"煞" },
    "陀罗": { "palaceIdx":2, "type":"煞" },
    "火星": { "palaceIdx":3, "type":"煞" },
    "铃星": { "palaceIdx":1, "type":"煞" },
    "地劫": { "palaceIdx":9, "type":"煞" },
    "地空": { "palaceIdx":1, "type":"煞" },
    "天马": { "palaceIdx":11, "type":"吉" }
  },
  "fourTransformations": {
    "化禄": { "star":"天机", "palaceIdx":5, "palaceDizhi":"巳" },
    "化权": { "star":"天梁", "palaceIdx":3, "palaceDizhi":"卯" },
    "化科": { "star":"紫微", "palaceIdx":6, "palaceDizhi":"午" },
    "化忌": { "star":"太阴", "palaceIdx":11, "palaceDizhi":"亥" }
  },
  "sanFangSiZheng": {
    "mingIdx":6, "caiboIdx":10, "guanluIdx":2, "qianyiIdx":0
  },
  "palaces": [
    {
      "dizhi":"子", "palaceIdx":0, "palaceName":"迁移宫",
      "palaceGan":"戊",
      "mainStars":["贪狼"], "minorStars":["天魁"],
      "sihua":[], "brightness":{"贪狼":"旺"}
    }
  ],

  "flyingStars": [
    {
      "palaceIdx":6, "palaceDizhi":"午", "palaceGan":"壬",
      "sihua": {
        "化禄": { "star":"天梁", "targetIdx":3, "targetDizhi":"卯" },
        "化权": { "star":"紫微", "targetIdx":6, "targetDizhi":"午" },
        "化科": { "star":"左辅", "targetIdx":6, "targetDizhi":"午" },
        "化忌": { "star":"武曲", "targetIdx":2, "targetDizhi":"寅" }
      }
    }
  ],

  "selfTransformations": [
    {
      "palaceIdx":6, "palaceDizhi":"午", "palaceGan":"壬",
      "sihuaName":"化权", "star":"紫微",
      "meaning":"自化权：主观意识强，我掌控此宫事，但易刚愎自用、不听劝"
    }
  ],

  "daxianSequence": [
    {
      "index":0, "startAge":3, "endAge":12,
      "palaceIdx":6, "palaceDizhi":"午", "palaceName":"命宫", "palaceGan":"壬",
      "sihua": { "化禄":{"star":"天梁","targetIdx":3,"targetDizhi":"卯"}, ... },
      "label":"3-12岁 · 命宫大限"
    }
  ],

  "flow": {
    "palaceGans": [...],
    "flyingStars": [...],
    "selfTransformations": [...],
    "daxianSequence": [...],
    "currentDaxian": { "label":"43-52岁 · 官禄宫大限", ... },
    "liuNian": {
      "year":2026, "gan":"丙", "zhi":"午", "zhiIdx":6,
      "palaceIdx":6, "palaceDizhi":"午",
      "sihua": { "化禄":{"star":"天同",...}, ... }
    },
    "liuYue": {
      "lunarMonth":3, "gan":"壬", "zhi":"辰", "zhiIdx":4,
      "palaceIdx":4, "palaceDizhi":"辰",
      "sihua": { ... }
    },
    "overlap": [
      {
        "desc": "大限宫与流年宫关系",
        "daxianPalace": "寅 官禄宫",
        "liuNianPalace": "午 命宫",
        "offset": 4,
        "note": "流年进入大限财帛宫：财运应期"
      }
    ]
  },

  "_meta": {
    "engine": "ziwei-engine v3.0",
    "source": "跨派共识（付老师+梁若瑜+令东来）",
    "wuxingMethod": "命宫纳音五行局（付老师正统算法）",
    "flyingStars": "付老师飞星体系（五虎遁宫干+四化飞宫）",
    "generatedAt": "2026-03-29T..."
  }
}
```

### `generateChart(input)` — 只排本命盘（不含飞星大限）

同 `generateFullChart` 输入，但不含 `flyingStars / selfTransformations / daxianSequence / flow`。

---

## 独立函数接口（按模块）

### 基础模块

| 函数 | 参数 | 返回值 |
|------|------|--------|
| `yearToGanZhi(year)` | 公历年份(number) | `{gan, zhi, zhiIdx, ganIdx}` |
| `calcWuxingJuNaYin(mingGan, mingDz)` | 命宫宫干/命宫地支 | 五行局数(2/3/4/5/6) ★推荐 |
| `calcWuxingJu(yearGan)` | 年干字符串 | 五行局数(2/3/4/5/6) ⚠️简化法 |
| `calcMingPalace(lunarMonth, shichen)` | 农历月(1-12), 时辰地支名 | 命宫地支索引(0-11) |
| `calcShenPalace(lunarMonth, shichen)` | 农历月(1-12), 时辰地支名 | 身宫地支索引(0-11) |
| `calcZiweiPosition(lunarDay, wuxingJu)` | 农历日/五行局数 | 紫微星地支索引 |
| `calcMainStars(ziweiIdx)` | 紫微星地支索引 | 14主星位置对象 |
| `calcMinorStars(yearGan, yearZhiIdx, lunarMonth, shichenIdx)` | 年干/年支索引/月/时辰索引 | 辅煞星位置对象 |
| `calcFourTransformations(yearGan, mainStars, minorStars)` | 年干/主星/辅星 | 四化落宫对象 |
| `calcSanFangSiZheng(mingIdx)` | 命宫索引 | 三方四正宫位对象 |
| `getStarBrightness(starName, palaceIdx)` | 星名/宫位索引 | 庙/旺/利/平/陷 |

### 飞星模块

| 函数 | 参数 | 返回值 |
|------|------|--------|
| `calcPalaceGan(yearGan)` | 生年天干 | 12宫宫干数组（索引0=子宫） |
| `calcFlyingStars(palaceGans, mainStars, minorStars)` | 宫干数组/主星/辅星 | 12宫飞化信息数组 |
| `findSelfTransformations(flyingStars)` | calcFlyingStars()返回值 | 自化列表 |

### 大限模块

| 函数 | 参数 | 返回值 |
|------|------|--------|
| `isForwardDaxian(yearZhiIdx, gender)` | 年支索引/'male'/'female' | boolean（true=顺行） |
| `calcDaxianSequence(mingIdx, wuxingJu, yearZhiIdx, gender, palaceGans, mainStars, count)` | 命宫/五行局/年支/性别/宫干/主星/数量 | 大限序列数组 |
| `getDaxianByAge(daxianSeq, age)` | 大限序列/年龄 | 当前大限对象或null |

### 流年/月/日/时模块

| 函数 | 参数 | 返回值 |
|------|------|--------|
| `calcLiuNian(flowYear, mingIdx, mainStars, minorStars)` | 流年/命宫/主星/辅星 | 流年干支+宫位+四化 |
| `calcLiuYue(liuNianGan, lunarMonth, mainStars, minorStars)` | 流年干/农历月/主星/辅星 | 流月干支+宫位+四化 |
| `calcLiuRi(year, month, day, mainStars, minorStars)` | 公历年月日/主星/辅星 | 流日干支+宫位+四化 |
| `calcLiuShi(dayGan, shichen, mainStars, minorStars)` | 日干/时辰地支/主星/辅星 | 流时干支+宫位+四化 |
| `calcFullFlow(chart, flowParams)` | generateChart结果/`{flowYear,lunarMonth,age}` | 完整流盘分析（含宫职重叠） |

---

## 重要常量

```js
DIZHI   = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
TIANGAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
PALACE_NAMES = ['命宫','兄弟宫','夫妻宫','子女宫','财帛宫','疾厄宫',
                '迁移宫','交友宫','官禄宫','田宅宫','福德宫','父母宫']
SIHUA_TABLE  // 十干四化表（见 core-engine.js）
WUHU_DUAN    // 五虎遁：年干→寅宫天干索引
WUSHU_DUAN   // 五鼠遁：日干→子时天干索引
```

---

## 使用示例

### 最快速完整排盘
```js
const { generateFullChart, DIZHI } = require('./references/core-engine.js');

const chart = generateFullChart({
    year: 1975, lunarMonth: 3, lunarDay: 17,
    shichen: '戌', gender: 'male',
    flowYear: 2026, lunarFlowMonth: 3, age: 51
});

// 本命
chart.mingPalace.dizhi       // '午'  命宫
chart.mingPalace.gan         // '壬'  命宫宫干
chart.wuxingJu               // 3     木三局
chart.wuxingJuName           // '木三局'

// 宫干飞化（飞星体系）
chart.flyingStars[6]         // 午宫(命宫)飞化 → {palaceGan:'壬', sihua:{化禄:..., 化权:..., ...}}
chart.selfTransformations    // 所有自化列表

// 大限
chart.daxianSequence[0]      // 第一大限 {startAge:3, endAge:12, label:'3-12岁·命宫大限'}

// 流盘（传入flowYear时可用）
chart.flow.currentDaxian     // 当前大限
chart.flow.liuNian           // 流年 {gan:'丙', zhi:'午', sihua:{...}}
chart.flow.liuYue            // 流月
chart.flow.overlap           // 宫职重叠分析
```

### 流日流时（单独使用）
```js
const { calcLiuRi, calcLiuShi } = require('./references/core-engine.js');

// 2026年3月29日是什么日干支？
const ri = calcLiuRi(2026, 3, 29, mainStars);
console.log(ri.gan + ri.zhi);  // 日干支

// 该日戌时的流时
const shi = calcLiuShi(ri.gan, '戌', mainStars);
console.log(shi.gan + shi.zhi); // 时干支
```

---

## 注意事项

1. **农历日期**：本引擎接受农历月/日作为输入，**不负责公历↔农历转换**。  
   如需公历转农历，推荐使用 `lunar-javascript` 或 `lunisolar` 等第三方库。

2. **时辰输入**：传入地支名字符串（'子'/'亥'等），不是数字。  
   如果用户输入的是小时(0-23)，近似转换：`DIZHI[Math.floor(hour/2)]`

3. **五行局必须用纳音法**（`calcWuxingJuNaYin`），不要用 `calcWuxingJu`（年干法）。  
   两者在约40%的命盘会有差异，错一格命盘就全错。见 Bug#7。

4. **流日基准**：`calcLiuRi` 以公历 2000-01-01 为甲子日基准，适合现代使用，历史案例需校验。

---

## 版本历史

| 版本 | 日期 | 变化 |
|------|------|------|
| v1.0 | 初版 | 随机/等差偏移（错误版本，已废弃） |
| v2.0 | 2026-03 | 命宫/紫微真实算法，四化表驱动 |
| v3.0 | 2026-03-29 | **8大bug全修正 + 飞星宫干飞化 + 大限 + 流年/月/日/时全套实现** |
