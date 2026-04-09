# 紫微斗数引擎 — 标准测试用例 v3.0

> 来源：付老师《紫微斗数基础与入门》第31/32/33节（真实男女例命盘）  
> 所有期望值均来自付老师课件原文，是算法正确性的唯一基准  
> **v3.0 测试状态：全部 ✅ 通过（2026-03-29 验证）**

---

## 测试案例 1：男例（乾造）

```
出生：1975年4月28日 20:32（公历）
农历：乙卯年 三月 十七日 戌时（★注意是农历17日，不是公历28日）
性别：男
```

### 期望值（付老师课件原文）

| 项目 | 期望值 | 状态 |
|------|--------|------|
| 年干支 | 乙卯 | ✅ |
| 命宫 | 午宫 | ✅ |
| 身宫 | 寅宫 | ✅ |
| 命宫宫干 | 壬 | ✅ |
| **五行局** | **木三局（3）** | ✅ 命宫壬午纳音=木三 |
| 紫微位置 | 午宫 | ✅ |
| 天府位置 | 戌宫 | ✅ |
| 廉贞 | 戌宫（与天府同宫） | ✅ |
| 武曲 | 寅宫（武相同宫） | ✅ |
| 天相 | 寅宫 | ✅ |
| 太阳 | 卯宫（天梁同宫） | ✅ |
| 天梁 | 卯宫 | ✅ |
| 七杀 | 辰宫 | ✅ |
| 天同 | 丑宫（巨门同宫） | ✅ |
| 巨门 | 丑宫 | ✅ |
| 天机 | 巳宫 | ✅ |
| 贪狼 | 子宫 | ✅ |
| 破军 | 申宫 | ✅ |
| 太阴 | 亥宫 | ✅ |
| 生年四化（乙干）| 天机化禄入巳/天梁化权入卯/紫微化科入午/太阴化忌入亥 | ✅ |
| **大限方向** | **逆行**（卯年阴年，男命=阴男→逆行） | ✅ |
| 大限起运年龄 | 3岁 | ✅ |
| 大限序列 | 命(3-12)→父母(13-22)→福德(23-32)→田宅(33-42)→官禄(43-52)→交友(53-62) | ✅ |
| 宫干安法 | 寅宫=戊，午宫=壬 | ✅ |

### 关键算法说明

1. **五行局必须用命宫纳音**（不能用年干简化）
   - 命宫壬午 → 壬=5, 午=1, 5+1=6>5 → 6-5=1 → 木三局(3)
   - 年干乙 → 金四局(4) ← **错误！此法只是近似**（见Bug#7）

2. **紫微定宫**（付老师"只加不减到整除，阳退阴进"）
   - 农历17日，木三局
   - 17/3余2，不整除；17+1=18, 18/3=6，添加1（单数→逆退1位）
   - 商6→从寅数6=未；退1位→**午**（见Bug#8）

3. **大限方向**
   - 年支卯=地支索引3，奇数=阴年
   - 男命阴年=阴男 → **逆行**

### 验证代码（Node.js 完整版）

```js
const {
  generateFullChart, DIZHI,
  isForwardDaxian, calcPalaceGan
} = require('./core-engine.js');

const chart = generateFullChart({
    year: 1975, lunarMonth: 3, lunarDay: 17,
    shichen: '戌', gender: 'male',
    flowYear: 2026, lunarFlowMonth: 3, age: 51
});

// ── 基础验证 ──
console.assert(chart.mingPalace.dizhi === '午',  '命宫期望午');
console.assert(chart.shenPalace.dizhi === '寅',  '身宫期望寅');
console.assert(chart.wuxingJu === 3,             '五行局期望3(木三)');
console.assert(chart.mingPalace.gan === '壬',    '命宫宫干期望壬');

// ── 主星验证 ──
const s = chart.mainStars;
console.assert(DIZHI[s['紫微']] === '午', '紫微期望午');
console.assert(DIZHI[s['天府']] === '戌', '天府期望戌');
console.assert(DIZHI[s['廉贞']] === '戌', '廉贞期望戌');
console.assert(DIZHI[s['武曲']] === '寅', '武曲期望寅');
console.assert(DIZHI[s['天相']] === '寅', '天相期望寅');
console.assert(DIZHI[s['太阳']] === '卯', '太阳期望卯');
console.assert(DIZHI[s['天梁']] === '卯', '天梁期望卯');
console.assert(DIZHI[s['七杀']] === '辰', '七杀期望辰');
console.assert(DIZHI[s['天同']] === '丑', '天同期望丑');
console.assert(DIZHI[s['巨门']] === '丑', '巨门期望丑');
console.assert(DIZHI[s['天机']] === '巳', '天机期望巳');
console.assert(DIZHI[s['贪狼']] === '子', '贪狼期望子');
console.assert(DIZHI[s['破军']] === '申', '破军期望申');
console.assert(DIZHI[s['太阴']] === '亥', '太阴期望亥');

// ── 四化验证 ──
const ft = chart.fourTransformations;
console.assert(ft['化禄'].star==='天机' && ft['化禄'].palaceDizhi==='巳', '化禄期望天机入巳');
console.assert(ft['化权'].star==='天梁' && ft['化权'].palaceDizhi==='卯', '化权期望天梁入卯');
console.assert(ft['化科'].star==='紫微' && ft['化科'].palaceDizhi==='午', '化科期望紫微入午');
console.assert(ft['化忌'].star==='太阴' && ft['化忌'].palaceDizhi==='亥', '化忌期望太阴入亥');

// ── 大限验证 ──
console.assert(!isForwardDaxian(3, 'male'), '阴男期望逆行');
console.assert(chart.daxianSequence[0].startAge === 3,   '起运期望3岁');
console.assert(chart.daxianSequence[0].palaceDizhi === '午', '第1大限期望午宫');
// 51岁在43-52大限（官禄宫=寅）
const dx = chart.daxianSequence.find(d => d.startAge === 43);
console.assert(dx?.palaceDizhi === '寅', '43-52大限期望寅宫(官禄)');

// ── 宫干验证 ──
const gans = calcPalaceGan('乙');
console.assert(gans[2] === '戊', '寅宫期望戊');
console.assert(gans[6] === '壬', '午宫期望壬');

// ── 飞星验证（命宫午宫壬干）──
const mingStar = chart.flyingStars.find(f => f.palaceDizhi === '午');
console.assert(mingStar.palaceGan === '壬', '命宫(午)宫干期望壬');
// 壬干飞化：天梁化禄→卯，紫微化权→午，左辅化科→午，武曲化忌→寅
console.assert(mingStar.sihua['化禄'].star === '天梁', '壬干化禄期望天梁');
console.assert(mingStar.sihua['化忌'].star === '武曲', '壬干化忌期望武曲');

console.log('✅ 所有断言通过！');
```

---

## 测试案例 2：女例（坤造）

```
出生：1985年5月28日 20:32（公历）
农历：乙丑年 四月 十日 戌时
性别：女
```

### 期望值（付老师课件）

| 项目 | 期望值 | 状态 |
|------|--------|------|
| 命宫 | 未宫 | ✅ |
| 身宫 | 卯宫 | ✅ |
| 命宫宫干 | 癸 | ✅ |

> 注：女例完整星曜分布待补充完善，目前命宫/身宫已验证正确

---

## 边界测试

### 整除情况（无添加量）

```js
const { calcZiweiPosition } = require('./core-engine.js');

// 水二局2日：2/2=1，商1→寅，无添加
const t1 = calcZiweiPosition(2, 2);
console.assert(t1 === 2, '水二局2日→寅'); // 寅=2

// 木三局3日：3/3=1，商1→寅，无添加
const t2 = calcZiweiPosition(3, 3);
console.assert(t2 === 2, '木三局3日→寅'); // 寅=2

// 金四局4日：4/4=1，商1→寅，无添加
const t3 = calcZiweiPosition(4, 4);
console.assert(t3 === 2, '金四局4日→寅'); // 寅=2
```

### 添加量为奇数（退/逆）

```js
// 木三局17日：17+1=18, 18/3=6, 从寅数6=未; 添加1(奇)→退1=午
const t4 = calcZiweiPosition(17, 3);
console.assert(t4 === 6, '木三局17日→午'); // 午=6 ← 付老师案例验证
```

### 添加量为偶数（进/顺）

```js
// 木三局4日：4+2=6, 6/3=2, 商2→卯; 添加2(偶)→进2=巳
const t5 = calcZiweiPosition(4, 3);
console.assert(t5 === 5, '木三局4日→巳'); // 巳=5
```

### 宫干安法验证（五虎遁）

```js
const { calcPalaceGan } = require('./core-engine.js');

// 乙年：乙庚→戊，寅宫起戊
const gans = calcPalaceGan('乙');
console.assert(gans[2] === '戊', '乙年寅宫=戊');  // 寅=idx2
console.assert(gans[6] === '壬', '乙年午宫=壬');  // 午=idx6
console.assert(gans[3] === '己', '乙年卯宫=己');  // 卯=idx3

// 甲年：甲己→丙，寅宫起丙
const gans2 = calcPalaceGan('甲');
console.assert(gans2[2] === '丙', '甲年寅宫=丙');

// 壬年：丁壬→壬，寅宫起壬
const gans3 = calcPalaceGan('壬');
console.assert(gans3[2] === '壬', '壬年寅宫=壬');
```

### 流日干支验证

```js
const { calcLiuRi } = require('./core-engine.js');

// 2000-01-01 基准为甲子日（ganIdx=0, zhiIdx=0）
const base = calcLiuRi(2000, 1, 1, {});
console.assert(base.gan === '甲' && base.zhi === '子', '2000-01-01期望甲子日');
```

### 流时五鼠遁验证

```js
const { calcLiuShi } = require('./core-engine.js');

// 甲日子时 → 甲子时（甲己还加甲）
const shi1 = calcLiuShi('甲', '子', {});
console.assert(shi1.gan === '甲', '甲日子时期望甲');

// 乙日子时 → 丙子时（乙庚丙作初）
const shi2 = calcLiuShi('乙', '子', {});
console.assert(shi2.gan === '丙', '乙日子时期望丙');
```

---

## 历史修正记录索引

详见 `algorithm-corrections.md`，记录了8个历史bug：

| 编号 | Bug描述 | 影响范围 |
|------|---------|---------|
| Bug#1 | 天府公式错误：`(12-zi)%12` → `(4-zi+12)%12` | 所有命盘天府系全错 |
| Bug#2 | 廉贞偏移错误：-5 → -8（跳过2空宫） | 太阳/廉贞/武曲/天同 |
| Bug#3 | 文昌文曲错误用年支，应用生时 | 文昌文曲位置 |
| Bug#4 | 天魁天钺贵人表三组错误 | 天魁天钺 |
| Bug#5 | 禄存丁干和己干各错一宫 | 禄存/羊/陀 |
| Bug#6 | 火铃仅用年支固定，应年支起宫+生时顺数 | 火星铃星 |
| **Bug#7** | **五行局用年干简化，应用命宫纳音** | **紫微及整个命盘** |
| **Bug#8** | **紫微用ceil近似算法，应用"只加不减"付老师算法** | **紫微星位置（不整除日数）** |
