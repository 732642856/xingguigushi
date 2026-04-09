/**
 * ziwei-engine — 紫微斗数排盘核心模块
 * ============================================
 * 版本：v3.0（来自 fine-chart-engine.js，去 UI 耦合后提炼）
 * 算法来源：付老师全套讲义 + 梁若瑜飞星派 + 令东来体系 跨派共识
 * 修正记录：见 references/algorithm-corrections.md
 *
 * 对外接口（开发者直接用这几个函数）：
 *   calcMingPalace(lunarMonth, shichen) → 命宫地支索引
 *   calcShenPalace(lunarMonth, shichen) → 身宫地支索引
 *   calcZiweiPosition(lunarMonth, lunarDay, yearGan, mingIdx) → 紫微星地支索引
 *   calcMainStars(ziweiIdx) → 十四主星位置表 Object
 *   calcMinorStars(yearGan, yearZhiIdx, lunarMonth, shichenIdx) → 六吉六煞位置表 Object
 *   calcFourTransformations(yearGan, mainStars) → 四化落宫 Object
 *   calcSanFangSiZheng(mingIdx) → 三方四正 Object
 *   calcWuxingJu(yearGan) → 五行局数 (2/3/4/5/6)
 *   yearToGanZhi(year) → { gan, zhi, zhiIdx, ganIdx }
 *
 * 标准 JSON 输出格式：见 references/api-spec.md
 * 测试用例：见 references/test-cases.md
 */

'use strict';

// ==================== 基础常量 ====================

const DIZHI  = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const TIANGAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const PALACE_NAMES = [
    '命宫','兄弟宫','夫妻宫','子女宫','财帛宫','疾厄宫',
    '迁移宫','交友宫','官禄宫','田宅宫','福德宫','父母宫'
];

// ==================== 年份 → 干支 ====================

/**
 * 公历年份 → 天干地支
 * @param {number} year - 公历年（如 1990）
 * @returns {{ gan: string, zhi: string, zhiIdx: number, ganIdx: number }}
 */
function yearToGanZhi(year) {
    const ganIdx = (year - 4 + 40) % 10;
    const zhiIdx = (year - 4 + 48) % 12;
    return { gan: TIANGAN[ganIdx], zhi: DIZHI[zhiIdx], zhiIdx, ganIdx };
}

// ==================== 五行局 ====================

/**
 * 命宫纳音五行局（正统算法 - 付老师体系）
 * 以命宫宫干+命宫地支查纳音得五行局数
 *
 * 天干配数：甲乙=1, 丙丁=2, 戊己=3, 庚辛=4, 壬癸=5
 * 地支配数：子丑午未=1, 寅卯申酉=2, 辰巳戌亥=3
 * 干支数相加，大于5则减5，余数查表：1→木三, 2→金四, 3→水二, 4→火六, 5→土五
 *
 * @param {string} mingGan - 命宫宫干（天干）
 * @param {string} mingDz  - 命宫地支
 * @returns {number} 五行局数（2/3/4/5/6）
 */
const NAYIN_TG_NUM  = {'甲':1,'乙':1,'丙':2,'丁':2,'戊':3,'己':3,'庚':4,'辛':4,'壬':5,'癸':5};
const NAYIN_DZ_NUM  = {'子':1,'丑':1,'午':1,'未':1,'寅':2,'卯':2,'申':2,'酉':2,'辰':3,'巳':3,'戌':3,'亥':3};
const NAYIN_JU_MAP  = {1:3, 2:4, 3:2, 4:6, 5:5};

function calcWuxingJuNaYin(mingGan, mingDz) {
    let sum = (NAYIN_TG_NUM[mingGan] || 1) + (NAYIN_DZ_NUM[mingDz] || 1);
    if (sum > 5) sum -= 5;
    return NAYIN_JU_MAP[sum] || 3;
}

/**
 * 年干简化法（用于快速估算，不如纳音准确）
 * 甲己→土五(5)，乙庚→金四(4)，丙辛→水二(2)，丁壬→木三(3)，戊癸→火六(6)
 * @deprecated 建议使用 calcWuxingJuNaYin，需要命宫宫干支
 */
function calcWuxingJu(yearGan) {
    return { '甲':5,'己':5,'乙':4,'庚':4,'丙':2,'辛':2,'丁':3,'壬':3,'戊':6,'癸':6 }[yearGan] || 3;
}

// ==================== 命宫 / 身宫 ====================

/**
 * 安命宫：寅宫起正月顺数到生月，再逆数到生时
 * 口诀：虎起正月顺布月，逆数时辰得命宫
 * @param {number} lunarMonth - 农历月(1-12)
 * @param {string} shichen    - 时辰地支名（'子'~'亥'）
 * @returns {number} 命宫地支索引 (0=子 … 11=亥)
 */
function calcMingPalace(lunarMonth, shichen) {
    const monthIdx = (2 + lunarMonth - 1) % 12;  // 寅=2 顺数
    const timeIdx  = DIZHI.indexOf(shichen);
    return (monthIdx - timeIdx + 12) % 12;
}

/**
 * 安身宫：寅宫起正月顺数到生月，再顺数到生时
 */
function calcShenPalace(lunarMonth, shichen) {
    const monthIdx = (2 + lunarMonth - 1) % 12;
    const timeIdx  = DIZHI.indexOf(shichen);
    return (monthIdx + timeIdx) % 12;
}

// ==================== 紫微星 ====================

/**
 * 安紫微星（付老师/传统算法：只加不减到整除，阳退阴进）
 *
 * 口诀：生日除局商为月，一自寅起紫微定。只加不减到整除，阳退阴进记心中。
 *
 * 步骤：
 *   1. 用农历日数 ÷ 五行局数；若整除，商数即组号
 *   2. 若不能整除，日数不断加1直到整除；记录所加的数(added)
 *   3. 商数从寅(1)起数，商=1→寅, 2→卯...得到基础宫位
 *   4. 若added>0：奇数→逆退added位；偶数→顺进added位
 *
 * @param {number} lunarDay  - 农历日(1-30)
 * @param {number} wuxingJu  - 命宫纳音五行局数（2/3/4/5/6），必须用纳音法！
 * @returns {number} 紫微星地支索引
 */
function calcZiweiPosition(lunarDay, wuxingJu) {
    let d     = lunarDay;
    let added = 0;
    while (d % wuxingJu !== 0) { d++; added++; }
    const quotient = d / wuxingJu;
    // 从寅起数quotient格（寅=1对应寅，寅地支索引=2）
    let zhiIdx = (2 + quotient - 1) % 12;  // 寅(2)起，商数作步数
    // 添加量处理：奇数退，偶数进
    if (added > 0) {
        if (added % 2 === 1) {
            zhiIdx = (zhiIdx - added + 120) % 12;   // 退（逆）
        } else {
            zhiIdx = (zhiIdx + added) % 12;           // 进（顺）
        }
    }
    return zhiIdx;
}

// ==================== 十四主星 ====================

/**
 * 安十四主星
 *
 * 紫微系（逆布）：
 *   口诀：紫微天机逆行旁，隔一阳武天同当，又隔二位廉贞地
 *   紫微(±0) → 天机(-1) → [空] → 太阳(-3) → 武曲(-4) → 天同(-5) → [空空] → 廉贞(-8)
 *
 * 天府位置：紫微宫 + 天府宫 ≡ 4 (mod 12)  [Bug#1 修正]
 *   tianfuIdx = (4 - ziweiIdx + 12) % 12
 *
 * 天府系（顺布）：
 *   口诀：天府太阴与贪狼，巨门天相及天梁，七杀空三破军位
 *   天府(+0) → 太阴(+1) → 贪狼(+2) → 巨门(+3) → 天相(+4) → 天梁(+5) → 七杀(+6) → [空3] → 破军(+10)
 *
 * @param {number} ziweiIdx
 * @returns {Object} { '紫微': idx, '天机': idx, ... }（14个键）
 */
function calcMainStars(ziweiIdx) {
    const s = {};
    // 紫微系
    s['紫微'] = ziweiIdx;
    s['天机'] = (ziweiIdx - 1 + 12) % 12;
    s['太阳'] = (ziweiIdx - 3 + 12) % 12;  // 跳1空宫
    s['武曲'] = (ziweiIdx - 4 + 12) % 12;
    s['天同'] = (ziweiIdx - 5 + 12) % 12;
    s['廉贞'] = (ziweiIdx - 8 + 12) % 12;  // 跳2空宫 [Bug#2 修正：旧为-5]

    // 天府位置 [Bug#1 修正：旧为 (12-ziweiIdx)%12]
    const tf = (4 - ziweiIdx + 12) % 12;
    // 天府系
    s['天府'] = tf;
    s['太阴'] = (tf + 1)  % 12;
    s['贪狼'] = (tf + 2)  % 12;
    s['巨门'] = (tf + 3)  % 12;
    s['天相'] = (tf + 4)  % 12;
    s['天梁'] = (tf + 5)  % 12;
    s['七杀'] = (tf + 6)  % 12;
    s['破军'] = (tf + 10) % 12;  // 跳3空宫
    return s;
}

// ==================== 四化 ====================

/**
 * 生年四化表（跨派共识）
 * 天干 → { 化禄, 化权, 化科, 化忌 }
 */
const SIHUA_TABLE = {
    '甲': { '化禄':'廉贞', '化权':'破军', '化科':'武曲', '化忌':'太阳' },
    '乙': { '化禄':'天机', '化权':'天梁', '化科':'紫微', '化忌':'太阴' },
    '丙': { '化禄':'天同', '化权':'天机', '化科':'文昌', '化忌':'廉贞' },
    '丁': { '化禄':'太阴', '化权':'天同', '化科':'天机', '化忌':'巨门' },
    '戊': { '化禄':'贪狼', '化权':'太阴', '化科':'右弼', '化忌':'天机' },
    '己': { '化禄':'武曲', '化权':'贪狼', '化科':'天梁', '化忌':'文曲' },
    '庚': { '化禄':'太阳', '化权':'武曲', '化科':'太阴', '化忌':'天同' },
    '辛': { '化禄':'巨门', '化权':'太阳', '化科':'文曲', '化忌':'文昌' },
    '壬': { '化禄':'天梁', '化权':'紫微', '化科':'左辅', '化忌':'武曲' },
    '癸': { '化禄':'破军', '化权':'巨门', '化科':'太阴', '化忌':'贪狼' }
};

/**
 * 计算四化落宫（含辅星：文昌/文曲/左辅/右弼）
 * @param {string} yearGan
 * @param {Object} mainStars  - calcMainStars() 的返回值
 * @param {Object} [minorStars] - calcMinorStars() 的返回值（可选，用于文昌文曲左辅右弼化）
 * @returns {{ '化禄': { star, palaceIdx, palaceDizhi }, ... }}
 */
function calcFourTransformations(yearGan, mainStars, minorStars) {
    const rule = SIHUA_TABLE[yearGan] || SIHUA_TABLE['甲'];
    const result = {};
    for (const [sihua, star] of Object.entries(rule)) {
        // 先查主星，再查辅星
        let palaceIdx = mainStars[star];
        if (palaceIdx === undefined && minorStars && minorStars[star]) {
            palaceIdx = minorStars[star].palaceIdx;
        }
        result[sihua] = {
            star,
            palaceIdx:   palaceIdx !== undefined ? palaceIdx : -1,
            palaceDizhi: palaceIdx !== undefined ? DIZHI[palaceIdx] : '未知'
        };
    }
    return result;
}

// ==================== 三方四正 ====================

const SANHE_GROUPS = [[2,6,10],[8,0,4],[11,3,7],[5,9,1]];

/**
 * 计算三方四正
 * 三方 = 命宫 + 财帛宫(+4) + 官禄宫(+8)
 * 四正 = 三方 + 迁移宫(对冲, +6)
 * @param {number} mingIdx
 * @returns {{ mingIdx, caiboIdx, guanluIdx, qianyiIdx }}
 */
function calcSanFangSiZheng(mingIdx) {
    const qianyiIdx = (mingIdx + 6) % 12;
    let caiboIdx = (mingIdx + 4) % 12;
    let guanluIdx = (mingIdx + 8) % 12;
    // 优先从三合组精确匹配
    for (const g of SANHE_GROUPS) {
        if (g.includes(mingIdx)) {
            const others = g.filter(i => i !== mingIdx);
            caiboIdx  = others.find(i => (i - mingIdx + 12) % 12 === 4) ?? caiboIdx;
            guanluIdx = others.find(i => (i - mingIdx + 12) % 12 === 8) ?? guanluIdx;
            break;
        }
    }
    return { mingIdx, caiboIdx, guanluIdx, qianyiIdx };
}

// ==================== 六吉六煞 ====================

/** 天魁天钺贵人表（年干 → 宫位索引）[Bug#4 修正] */
const KUIYUE = {
    '甲':{魁:1,钺:7},'戊':{魁:1,钺:7},'庚':{魁:1,钺:7},
    '乙':{魁:0,钺:8},'己':{魁:0,钺:8},   // 申=8（旧代码6是错的）
    '丙':{魁:11,钺:9},'丁':{魁:11,钺:9},
    '壬':{魁:3,钺:5},'癸':{魁:3,钺:5},   // 卯=3，巳=5（旧代码4/4是错的）
    '辛':{魁:6,钺:2}                        // 午=6，寅=2（旧代码3/3是错的）
};

/** 禄存宫位表（年干）[Bug#5 修正：丁=6，己=6] */
const LUXUN_BY_GAN = { '甲':2,'乙':3,'丙':5,'丁':6,'戊':5,'己':6,'庚':8,'辛':9,'壬':11,'癸':0 };

/** 火星起宫（年支三合局）*/
const HUOXING_START = {
    2:1,6:1,10:1,   // 寅午戌 → 丑(1)
    8:2,0:2,4:2,    // 申子辰 → 寅(2)
    5:3,9:3,1:3,    // 巳酉丑 → 卯(3)
    11:9,3:9,7:9    // 亥卯未 → 酉(9)
};

/** 铃星起宫（年支三合局）*/
const LINGXING_START = { 2:3,6:3,10:3 };  // 寅午戌→卯(3)，其余默认戌(10)

/**
 * 计算六吉六煞位置
 * [Bug#3 修正] 文昌文曲按生时，不是年支
 * [Bug#6 修正] 火铃按年支起宫+生时顺数，不是仅年支
 *
 * @param {string} yearGan     - 生年天干
 * @param {number} yearZhiIdx  - 生年地支索引
 * @param {number} lunarMonth  - 农历月(1-12)
 * @param {number} shichenIdx  - 生时地支索引(0=子…11=亥)
 * @returns {Object} { '文昌': { palaceIdx, type }, ... }
 */
function calcMinorStars(yearGan, yearZhiIdx, lunarMonth, shichenIdx) {
    const shi = shichenIdx ?? 0;
    const result = {};

    // ── 文昌/文曲（生时安，非年支）[Bug#3 修正] ──
    result['文昌'] = { palaceIdx: (10 - shi + 12) % 12, type: '吉' };  // 戌(10)起逆数
    result['文曲'] = { palaceIdx: (4  + shi) % 12,       type: '吉' };  // 辰(4)起顺数

    // ── 天魁/天钺（年干贵人表）[Bug#4 修正] ──
    const ky = KUIYUE[yearGan] || { 魁:1, 钺:7 };
    result['天魁'] = { palaceIdx: ky.魁, type: '吉' };
    result['天钺'] = { palaceIdx: ky.钺, type: '吉' };

    // ── 左辅/右弼（生月安）──
    result['左辅'] = { palaceIdx: (4  + lunarMonth - 1) % 12, type: '吉' };  // 辰(4)起正月顺
    result['右弼'] = { palaceIdx: (10 - lunarMonth + 1 + 12) % 12, type: '吉' }; // 戌(10)起正月逆

    // ── 禄存/擎羊/陀罗（年干）[Bug#5 修正] ──
    const lu = LUXUN_BY_GAN[yearGan] ?? 2;
    result['禄存'] = { palaceIdx: lu,                   type: '吉' };
    result['擎羊'] = { palaceIdx: (lu + 1) % 12,        type: '煞' };
    result['陀罗'] = { palaceIdx: (lu - 1 + 12) % 12,   type: '煞' };

    // ── 火星/铃星（年支三合局起宫+生时）[Bug#6 修正] ──
    const fireStart = HUOXING_START[yearZhiIdx] ?? 2;
    const bellStart = LINGXING_START[yearZhiIdx] ?? 10;
    result['火星'] = { palaceIdx: (fireStart + shi) % 12, type: '煞' };
    result['铃星'] = { palaceIdx: (bellStart + shi) % 12, type: '煞' };

    // ── 地劫/地空（生时安）──
    // 地劫：亥(11)起子时顺数  地空：亥(11)起子时逆数
    result['地劫'] = { palaceIdx: (11 + shi) % 12,       type: '煞' };
    result['地空'] = { palaceIdx: (11 - shi + 12) % 12,  type: '煞' };

    // ── 天马（年支三合局）──
    const TIANMA = { 2:8,6:8,10:8, 8:2,0:2,4:2, 5:11,9:11,1:11, 11:5,3:5,7:5 };
    result['天马'] = { palaceIdx: TIANMA[yearZhiIdx] ?? 8, type: '吉' };

    return result;
}

// ==================== 星曜庙旺利陷 ====================

/**
 * 各主星庙旺利陷表
 * 数据来源：《紫微斗数全书》
 * 等级：庙(4) > 旺(3) > 利(2) > 平(1) > 陷(0)
 * 索引：0=子, 1=丑, ..., 11=亥
 */
const STAR_BRIGHTNESS_TABLE = {
    '紫微': [1,2,4,1,2,3,3,2,1,3,2,4],
    '天机': [2,4,1,3,2,4,1,3,2,4,1,3],
    '太阳': [0,1,2,3,4,4,4,3,2,1,0,1],
    '武曲': [3,2,1,3,2,1,3,2,1,4,2,1],
    '天同': [3,1,3,1,0,3,3,1,3,1,0,3],
    '廉贞': [1,0,4,1,0,3,1,0,4,1,0,3],
    '天府': [3,4,3,4,3,4,3,4,3,4,3,4],
    '太阴': [1,0,1,0,1,0,4,3,2,4,3,4],
    '贪狼': [2,3,2,3,2,3,2,3,2,3,2,3],
    '巨门': [0,2,0,2,3,0,2,0,3,4,0,2],
    '天相': [3,2,3,2,3,2,3,2,3,2,3,2],
    '天梁': [3,2,3,2,3,2,3,2,3,2,3,2],
    '七杀': [2,1,3,1,2,4,2,1,3,1,2,4],
    '破军': [1,0,2,0,1,3,1,0,2,0,1,3]
};
const BRIGHTNESS_NAMES = ['陷','平','利','旺','庙'];

function getStarBrightness(starName, palaceIdx) {
    const t = STAR_BRIGHTNESS_TABLE[starName];
    if (!t) return '平';
    return BRIGHTNESS_NAMES[t[palaceIdx] ?? 0];
}

// ==================== 完整排盘入口 ====================

/**
 * 排一张完整命盘（最小化输入版本）
 *
 * @param {Object} input
 * @param {number} input.year       - 公历出生年份
 * @param {number} input.lunarMonth - 农历生月(1-12)
 * @param {number} input.lunarDay   - 农历生日(1-30)
 * @param {string} input.shichen    - 生时地支名('子'~'亥')
 * @param {string} [input.gender]   - 'male'/'female'
 *
 * @returns {Object} 标准命盘 JSON（见 references/api-spec.md）
 */
function generateChart(input) {
    const { year, lunarMonth, lunarDay, shichen, gender = 'male' } = input;

    const shichenIdx = DIZHI.indexOf(shichen);
    const { gan: yearGan, zhi: yearZhi, zhiIdx: yearZhiIdx } = yearToGanZhi(year);
    const mingIdx    = calcMingPalace(lunarMonth, shichen);
    const shenIdx    = calcShenPalace(lunarMonth, shichen);

    // 安宫干（五虎遁）
    const palaceGans = calcPalaceGan(yearGan);
    const mingGan    = palaceGans[mingIdx];    // 命宫宫干
    const mingDz     = DIZHI[mingIdx];         // 命宫地支

    // 五行局：用命宫纳音（正统）
    const wuxingJu = calcWuxingJuNaYin(mingGan, mingDz);

    // 紫微定宫（付老师真实算法）
    const ziweiIdx   = calcZiweiPosition(lunarDay, wuxingJu);
    const mainStars  = calcMainStars(ziweiIdx);
    const minorStars = calcMinorStars(yearGan, yearZhiIdx, lunarMonth, shichenIdx);
    const fourTrans  = calcFourTransformations(yearGan, mainStars, minorStars);
    const sanfang    = calcSanFangSiZheng(mingIdx);

    // 十二宫星曜汇总
    const palaces = Array.from({ length: 12 }, (_, i) => {
        const name = PALACE_NAMES[(i - mingIdx + 12) % 12];
        const stars = Object.entries(mainStars)
            .filter(([,idx]) => idx === i).map(([s]) => s);
        const minor = Object.entries(minorStars)
            .filter(([,v]) => v.palaceIdx === i).map(([s]) => s);
        const sihua = Object.entries(fourTrans)
            .filter(([,v]) => v.palaceIdx === i).map(([s]) => s);
        return {
            dizhi: DIZHI[i],
            palaceIdx: i,
            palaceName: name,
            palaceGan: palaceGans[i],
            mainStars: stars,
            minorStars: minor,
            sihua,
            brightness: stars.reduce((acc, s) => {
                acc[s] = getStarBrightness(s, i); return acc;
            }, {})
        };
    });

    return {
        input: { year, lunarMonth, lunarDay, shichen, gender },
        yearGanZhi: { gan: yearGan, zhi: yearZhi },
        wuxingJu,
        wuxingJuName: {2:'水二局',3:'木三局',4:'金四局',5:'土五局',6:'火六局'}[wuxingJu] || '',
        mingPalace:  { dizhi: DIZHI[mingIdx],  index: mingIdx,  gan: mingGan },
        shenPalace:  { dizhi: DIZHI[shenIdx],  index: shenIdx },
        ziweiPalace: { dizhi: DIZHI[ziweiIdx], index: ziweiIdx },
        palaceGans,
        palaces,
        mainStars,
        minorStars,
        fourTransformations: fourTrans,
        sanFangSiZheng: sanfang,
        _meta: {
            engine: 'ziwei-engine v3.0',
            source: '跨派共识（付老师+梁若瑜+令东来）',
            wuxingMethod: '命宫纳音五行局（付老师正统算法）',
            generatedAt: new Date().toISOString()
        }
    };
}

// ==================== 宫干安法（五虎遁）+ 飞星宫干飞化 ====================
//
// 【飞星体系核心逻辑】（付老师体系）
//
// 第一步：安宫干
//   口诀"五虎遁年起月法"——寅宫天干由年干决定，再顺布十二宫：
//     甲己之年丙作首 → 年干甲/己，寅宫起丙
//     乙庚之岁戊为头 → 年干乙/庚，寅宫起戊
//     丙辛必定寻庚起 → 年干丙/辛，寅宫起庚
//     丁壬壬位顺行流 → 年干丁/壬，寅宫起壬
//     若问戊癸何方发，甲寅之上好追求 → 年干戊/癸，寅宫起甲
//
// 第二步：飞星飞化
//   每个宫位都有宫干，宫干查四化表（SIHUA_TABLE），得到该宫飞出的四化落在哪个宫
//   这就是"宫干飞化"，也叫"飞宫四化"

/**
 * 五虎遁：年干 → 寅宫天干索引
 * 寅宫(地支索引=2)固定，此函数只返回天干索引
 */
const WUHU_DUAN = {
    '甲':2, '己':2,   // 丙寅 (丙=TIANGAN[2])
    '乙':4, '庚':4,   // 戊寅 (戊=TIANGAN[4])
    '丙':6, '辛':6,   // 庚寅 (庚=TIANGAN[6])
    '丁':8, '壬':8,   // 壬寅 (壬=TIANGAN[8])
    '戊':0, '癸':0    // 甲寅 (甲=TIANGAN[0])
};

/**
 * 安十二宫宫干
 * 以命宫年干（即生年天干）为基准，五虎遁得到寅宫天干，再顺布十二宫
 *
 * 注意：宫干以"寅宫"为起点顺布，地支盘固定(子丑寅卯…亥)
 * 所以宫位 i 的天干索引 = (寅宫天干索引 + (i - 2 + 12)) % 10
 *                           = (寅宫天干索引 + i - 2 + 20) % 10
 *
 * @param {string} yearGan - 生年天干（不是大限/流年的年干，这里安本命宫干）
 * @returns {string[]} 12个地支宫位对应的天干，索引0=子宫天干…11=亥宫天干
 */
function calcPalaceGan(yearGan) {
    const yinGanIdx = WUHU_DUAN[yearGan] ?? 0;  // 寅宫(index=2)的天干索引
    return DIZHI.map((_, i) => {
        // i=0→子, i=1→丑, i=2→寅(起点)
        // 关键：先 (i-2+12)%12 得到"距离寅宫的步数"，再 % 10 确保天干循环
        const step   = (i - 2 + 12) % 12;
        const ganIdx = (yinGanIdx + step) % 10;
        return TIANGAN[ganIdx];
    });
}

/**
 * 飞星宫干飞化
 * 每个宫位的宫干飞出四化，落在哪个宫（查主星+辅星位置）
 *
 * @param {string[]} palaceGans   - calcPalaceGan() 返回的12宫天干数组
 * @param {Object}   mainStars    - calcMainStars() 返回的主星位置对象
 * @param {Object}   [minorStars] - calcMinorStars() 返回的辅星位置（可选，含文昌文曲左辅右弼）
 * @returns {Array}  12个宫位的飞化信息
 */
function calcFlyingStars(palaceGans, mainStars, minorStars) {
    return palaceGans.map((gan, i) => {
        const rule = SIHUA_TABLE[gan] || {};
        const sihua = {};
        for (const [name, star] of Object.entries(rule)) {
            let targetIdx = mainStars[star];
            if (targetIdx === undefined && minorStars && minorStars[star]) {
                targetIdx = minorStars[star].palaceIdx;
            }
            sihua[name] = {
                star,
                targetIdx:   targetIdx !== undefined ? targetIdx : -1,
                targetDizhi: targetIdx !== undefined ? DIZHI[targetIdx] : '未知'
            };
        }
        return {
            palaceIdx:   i,
            palaceDizhi: DIZHI[i],
            palaceGan:   gan,
            sihua
        };
    });
}

/**
 * 自化判断
 * 当某宫的宫干飞出的四化落回本宫，称为"自化"（最重要的飞星现象之一）
 *
 * @param {Array} flyingStars - calcFlyingStars() 的返回值
 * @returns {Array} 自化列表，每项 { palaceIdx, palaceGan, sihuaName, star }
 */
function findSelfTransformations(flyingStars) {
    const result = [];
    for (const palace of flyingStars) {
        for (const [name, info] of Object.entries(palace.sihua)) {
            if (info.targetIdx === palace.palaceIdx) {
                result.push({
                    palaceIdx:   palace.palaceIdx,
                    palaceDizhi: palace.palaceDizhi,
                    palaceGan:   palace.palaceGan,
                    sihuaName:   name,
                    star:        info.star,
                    meaning:     _selfTransMeaning(name)
                });
            }
        }
    }
    return result;
}

/** 自化象意简注（付老师体系） */
function _selfTransMeaning(sihuaName) {
    return {
        '化禄': '自化禄：我喜好此宫事，但易三分热度、无头无尾，主花钱心不痛',
        '化权': '自化权：主观意识强，我掌控此宫事，但易刚愎自用、不听劝',
        '化科': '自化科：此宫事我有才华，但易自我标榜、表现欲强',
        '化忌': '自化忌：此宫事我有执念障碍，★最凶★，主此宫事业出不来'
    }[sihuaName] || '';
}


// ==================== 大限推演 ====================
//
// 【大限规则】（付老师第33节）
//   1. 起运年龄 = 五行局数（水二=2岁, 木三=3岁, 金四=4岁, 土五=5岁, 火六=6岁）
//   2. 阳男阴女：顺行（命宫→兄弟→夫妻→…）
//      阴男阳女：逆行（命宫→父母→福德→…）
//   3. 每宫管10年
//   4. 大限宫位也有宫干（用大限所在宫的原始宫干），可再做飞星飞化
//
// 【阴阳判断】：
//   年支为子寅辰午申戌（奇数地支索引0,2,4,6,8,10）→ 阳年
//   年支为丑卯巳未酉亥（偶数地支索引1,3,5,7,9,11）→ 阴年
//   注：子=0,丑=1… 所以 zhiIdx%2==0 为阳，zhiIdx%2==1 为阴

/**
 * 判断是否顺行大限
 * @param {number} yearZhiIdx - 生年地支索引
 * @param {string} gender     - 'male' / 'female'
 * @returns {boolean} true=顺行, false=逆行
 */
function isForwardDaxian(yearZhiIdx, gender) {
    const isYangYear = (yearZhiIdx % 2 === 0);  // 子寅辰午申戌为阳年
    const isMale = (gender === 'male');
    // 阳男阴女 顺行；阴男阳女 逆行
    return (isYangYear && isMale) || (!isYangYear && !isMale);
}

/**
 * 计算大限序列
 * 返回每个大限的：起始年龄、结束年龄、所在宫位索引、宫位名、宫干
 *
 * @param {number} mingIdx     - 命宫地支索引
 * @param {number} wuxingJu    - 五行局数(2/3/4/5/6)
 * @param {number} yearZhiIdx  - 生年地支索引（判断阴阳）
 * @param {string} gender      - 'male'/'female'
 * @param {string[]} palaceGans - 十二宫宫干数组（calcPalaceGan返回）
 * @param {number}  [count=12]  - 要算几个大限（默认12个，覆盖120岁）
 * @returns {Array} 大限序列
 *   [{ index:0, startAge:3, endAge:12, palaceIdx:6, palaceDizhi:'午',
 *      palaceName:'迁移宫', palaceGan:'丙', sihua:{...} }, ...]
 */
function calcDaxianSequence(mingIdx, wuxingJu, yearZhiIdx, gender, palaceGans, mainStars, count = 12) {
    const forward = isForwardDaxian(yearZhiIdx, gender);
    const result  = [];
    let startAge  = wuxingJu;  // 起运年龄 = 五行局数

    for (let n = 0; n < count; n++) {
        // 第n个大限所在宫位
        let palaceIdx;
        if (forward) {
            palaceIdx = (mingIdx + n) % 12;
        } else {
            palaceIdx = (mingIdx - n + 120) % 12;
        }
        const endAge = startAge + 9;
        const palaceGan = palaceGans[palaceIdx];

        // 该大限的宫干飞化（用该宫天干查四化表）
        const rule = SIHUA_TABLE[palaceGan] || {};
        const sihua = {};
        for (const [name, star] of Object.entries(rule)) {
            const targetIdx = mainStars[star];
            sihua[name] = {
                star,
                targetIdx:   targetIdx !== undefined ? targetIdx : -1,
                targetDizhi: targetIdx !== undefined ? DIZHI[targetIdx] : '未知'
            };
        }

        result.push({
            index:       n,
            startAge,
            endAge,
            palaceIdx,
            palaceDizhi: DIZHI[palaceIdx],
            palaceName:  PALACE_NAMES[(palaceIdx - mingIdx + 12) % 12],
            palaceGan,
            sihua,
            label: `${startAge}-${endAge}岁 · ${PALACE_NAMES[(palaceIdx - mingIdx + 12) % 12]}大限`
        });

        startAge += 10;
    }
    return result;
}

/**
 * 根据年龄查当前所在大限
 * @param {Array}  daxianSeq - calcDaxianSequence() 的返回值
 * @param {number} age       - 当前年龄
 * @returns {Object|null} 对应的大限对象，不在范围内返回null
 */
function getDaxianByAge(daxianSeq, age) {
    return daxianSeq.find(d => age >= d.startAge && age <= d.endAge) || null;
}


// ==================== 流年 / 流月 / 流日 / 流时 ====================
//
// 【流年规则】
//   流年干支 = 当年的农历年干支（公历年算法同 yearToGanZhi）
//   流年宫位 = 从命宫起，虎跑（正月）寅宫算起，流年所在宫...
//   实际用法：以流年太岁地支直接"照临"该地支宫位，无需另算
//
// 【流年宫干飞化】
//   流年干支出来后，查流年干的四化表，得流年四化落宫
//   （同本命年干飞化，只是用流年天干）
//
// 【流月规则】
//   流月地支：正月=寅(2), 二月=卯(3)...十二月=丑(1)
//   流月天干：由流年天干查"五虎遁"，寅月起顺布
//
// 【流日规则】
//   流日从流月初一所在日，以纳甲（六十甲子）逐日推进
//   简化算法：流年甲子序 + 距年初的天数
//
// 【流时规则】
//   流时：当日干支 + 时辰，五鼠遁（日干→子时天干）
//   口诀：甲己还加甲，乙庚丙作初，丙辛从戊起，丁壬庚子居，戊癸何方发，壬子是真途

/**
 * 流年推算
 * @param {number} flowYear - 流年公历年份（如 2026）
 * @param {number} mingIdx  - 命宫地支索引
 * @param {Object} mainStars - 本命主星位置
 * @returns {{
 *   year: number,
 *   gan: string, zhi: string, zhiIdx: number,
 *   palaceIdx: number,      // 流年太岁照临宫位（= 流年地支索引）
 *   palaceDizhi: string,
 *   sihua: Object           // 流年干飞化（查四化表）
 * }}
 */
function calcLiuNian(flowYear, mingIdx, mainStars, minorStars) {
    const { gan, zhi, zhiIdx } = yearToGanZhi(flowYear);
    // 流年太岁照临：流年地支就是所在宫位（子宫=0, 丑宫=1…）
    const palaceIdx = zhiIdx;
    const rule = SIHUA_TABLE[gan] || {};
    const sihua = {};
    for (const [name, star] of Object.entries(rule)) {
        let targetIdx = mainStars[star];
        if (targetIdx === undefined && minorStars && minorStars[star]) targetIdx = minorStars[star].palaceIdx;
        sihua[name] = {
            star,
            targetIdx:   targetIdx !== undefined ? targetIdx : -1,
            targetDizhi: targetIdx !== undefined ? DIZHI[targetIdx] : '未知'
        };
    }
    return { year: flowYear, gan, zhi, zhiIdx, palaceIdx, palaceDizhi: DIZHI[palaceIdx], sihua };
}

/**
 * 流月推算
 * 五虎遁：流年天干 → 寅月(正月)天干 → 顺布十二月
 *
 * @param {string} liuNianGan  - 流年天干
 * @param {number} lunarMonth  - 农历月(1-12)
 * @param {Object} mainStars   - 本命主星位置（用于飞化落宫）
 * @returns {{
 *   lunarMonth: number,
 *   gan: string, zhi: string, zhiIdx: number,
 *   palaceIdx: number,     // 流月地支对应宫位（正月寅=2...）
 *   sihua: Object          // 流月干飞化
 * }}
 */
function calcLiuYue(liuNianGan, lunarMonth, mainStars, minorStars) {
    // 五虎遁：流年天干 → 寅月起始天干
    const yinMonthGanIdx = WUHU_DUAN[liuNianGan] ?? 0;
    // 第n月(正月=1)的天干索引 = (寅月干索引 + n - 1) % 10
    const ganIdx  = (yinMonthGanIdx + lunarMonth - 1) % 10;
    // 月地支：正月寅=2, 顺序: 寅卯辰巳午未申酉戌亥子丑
    const zhiIdx  = (2 + lunarMonth - 1) % 12;
    const gan     = TIANGAN[ganIdx];
    const zhi     = DIZHI[zhiIdx];
    const rule    = SIHUA_TABLE[gan] || {};
    const sihua   = {};
    for (const [name, star] of Object.entries(rule)) {
        let targetIdx = mainStars[star];
        if (targetIdx === undefined && minorStars && minorStars[star]) targetIdx = minorStars[star].palaceIdx;
        sihua[name] = {
            star,
            targetIdx:   targetIdx !== undefined ? targetIdx : -1,
            targetDizhi: targetIdx !== undefined ? DIZHI[targetIdx] : '未知'
        };
    }
    return { lunarMonth, gan, zhi, zhiIdx, palaceIdx: zhiIdx, palaceDizhi: zhi, sihua };
}

/**
 * 流日推算（简化版：基于公历日期推干支）
 *
 * 干支纪日以甲子日为基准：
 *   基准：公历 1900-01-01 = 甲戌日（天干0=甲, 地支11=戌? 需校准）
 *   实用基准：2000-01-01 = 己卯日（己=5, 卯=3）
 *
 * @param {number} year  - 公历年
 * @param {number} month - 公历月(1-12)
 * @param {number} day   - 公历日
 * @param {Object} mainStars - 本命主星（用于飞化）
 * @returns {{ gan, zhi, ganIdx, zhiIdx, palaceIdx, sihua }}
 */
function calcLiuRi(year, month, day, mainStars, minorStars) {
    // 基准：2000-01-01 为甲子日（ganIdx=0, zhiIdx=0）
    const base = new Date(2000, 0, 1);
    const curr = new Date(year, month - 1, day);
    const diffDays = Math.round((curr - base) / 86400000);
    const ganIdx = ((diffDays % 10) + 10) % 10;
    const zhiIdx = ((diffDays % 12) + 12) % 12;
    const gan    = TIANGAN[ganIdx];
    const zhi    = DIZHI[zhiIdx];
    const rule   = SIHUA_TABLE[gan] || {};
    const sihua  = {};
    for (const [name, star] of Object.entries(rule)) {
        let targetIdx = mainStars[star];
        if (targetIdx === undefined && minorStars && minorStars[star]) targetIdx = minorStars[star].palaceIdx;
        sihua[name] = {
            star,
            targetIdx:   targetIdx !== undefined ? targetIdx : -1,
            targetDizhi: targetIdx !== undefined ? DIZHI[targetIdx] : '未知'
        };
    }
    return { year, month, day, gan, zhi, ganIdx, zhiIdx, palaceIdx: zhiIdx, palaceDizhi: zhi, sihua };
}

/**
 * 流时推算（五鼠遁）
 * 根据流日天干推子时起始天干，再顺布十二时辰
 *
 * 五鼠遁口诀：
 *   甲己还加甲 → 甲/己日，子时起甲
 *   乙庚丙作初 → 乙/庚日，子时起丙
 *   丙辛从戊起 → 丙/辛日，子时起戊
 *   丁壬庚子居 → 丁/壬日，子时起庚
 *   戊癸何方发，壬子是真途 → 戊/癸日，子时起壬
 *
 * @param {string} dayGan  - 流日天干
 * @param {string} shichen - 时辰地支名('子'~'亥')
 * @param {Object} mainStars
 * @returns {{ gan, zhi, zhiIdx, palaceIdx, sihua }}
 */
const WUSHU_DUAN = {
    '甲':0, '己':0,   // 甲子 (甲=TIANGAN[0])
    '乙':2, '庚':2,   // 丙子 (丙=TIANGAN[2])
    '丙':4, '辛':4,   // 戊子 (戊=TIANGAN[4])
    '丁':6, '壬':6,   // 庚子 (庚=TIANGAN[6])
    '戊':8, '癸':8    // 壬子 (壬=TIANGAN[8])
};

function calcLiuShi(dayGan, shichen, mainStars, minorStars) {
    const ziGanIdx  = WUSHU_DUAN[dayGan] ?? 0;  // 子时天干索引
    const zhiIdx    = DIZHI.indexOf(shichen);
    const ganIdx    = (ziGanIdx + zhiIdx) % 10;
    const gan       = TIANGAN[ganIdx];
    const rule      = SIHUA_TABLE[gan] || {};
    const sihua     = {};
    for (const [name, star] of Object.entries(rule)) {
        let targetIdx = mainStars[star];
        if (targetIdx === undefined && minorStars && minorStars[star]) targetIdx = minorStars[star].palaceIdx;
        sihua[name] = {
            star,
            targetIdx:   targetIdx !== undefined ? targetIdx : -1,
            targetDizhi: targetIdx !== undefined ? DIZHI[targetIdx] : '未知'
        };
    }
    return { dayGan, shichen, gan, zhi: shichen, zhiIdx, palaceIdx: zhiIdx, palaceDizhi: shichen, sihua };
}

/**
 * 完整流盘（宫职重叠分析入口）
 * 将大限、流年、流月宫位与本命十二宫叠加，得到"宫职重叠"列表
 * 这是付老师飞星体系最核心的分析方法
 *
 * @param {Object} chart      - generateChart() 或 generateFullChart() 返回的本命盘
 * @param {Object} flowParams - { flowYear, lunarMonth, age }
 * @returns {Object} 完整流盘分析
 */
function calcFullFlow(chart, flowParams) {
    const { flowYear, lunarMonth = 1, age } = flowParams;
    const { mingPalace, mainStars, minorStars, wuxingJu, palaceGans, yearGanZhi } = chart;
    const yearZhiIdx = DIZHI.indexOf(yearGanZhi.zhi);
    const gender     = chart.input.gender;
    const mingIdx    = mingPalace.index;

    // 飞星宫干飞化（本命）
    const flyingStars  = calcFlyingStars(palaceGans, mainStars, minorStars);
    // 自化检测
    const selfTrans    = findSelfTransformations(flyingStars);
    // 大限序列
    const daxianSeq    = calcDaxianSequence(mingIdx, wuxingJu, yearZhiIdx, gender, palaceGans, mainStars);
    // 当前大限
    const currentDaxian = age !== undefined ? getDaxianByAge(daxianSeq, age) : null;
    // 流年
    const liuNian = calcLiuNian(flowYear, mingIdx, mainStars);
    // 流月
    const liuYue  = calcLiuYue(liuNian.gan, lunarMonth, mainStars);

    // 宫职重叠分析（命宫维度）
    const overlap = [];
    if (currentDaxian) {
        const dx = currentDaxian.palaceIdx;
        const ly = liuNian.palaceIdx;
        overlap.push({
            desc: '大限宫与流年宫关系',
            daxianPalace:  DIZHI[dx] + ' ' + PALACE_NAMES[(dx - mingIdx + 12) % 12],
            liuNianPalace: DIZHI[ly] + ' ' + PALACE_NAMES[(ly - mingIdx + 12) % 12],
            offset: (ly - dx + 12) % 12,
            note: _overlapNote((ly - dx + 12) % 12)
        });
    }

    return {
        palaceGans,
        flyingStars,
        selfTransformations: selfTrans,
        daxianSequence:      daxianSeq,
        currentDaxian,
        liuNian,
        liuYue,
        overlap,
        _meta: { engine: 'ziwei-engine v3.0', source: '付老师飞星体系' }
    };
}

/** 大限与流年宫位偏移量的象意简注 */
function _overlapNote(offset) {
    const notes = {
        0:  '大限流年同宫：此年为该大限中最重要的爆发年，格局好则大吉，格局差则大凶',
        6:  '大限流年对冲：此年为该大限中的重要变动年，主明显转折',
        4:  '流年进入大限财帛宫：财运应期',
        8:  '流年进入大限官禄宫：事业应期',
        3:  '流年进入大限兄弟宫：六亲/兄弟应期',
        9:  '流年进入大限田宅宫：家宅/不动产应期'
    };
    return notes[offset] || `大限与流年差${offset}宫，结合飞化做具体分析`;
}


// ==================== 更新 generateChart 加入飞星模块 ====================

/**
 * 增强版排盘入口（完整飞星体系）
 * 在 generateChart 基础上额外返回：飞星飞化、自化列表、大限序列
 *
 * @param {Object} input - 同 generateChart，额外可传 { age, flowYear, lunarFlowMonth }
 * @returns {Object} 完整命盘 + 飞星体系
 */
function generateFullChart(input) {
    const base = generateChart(input);
    const { yearGanZhi, mainStars, minorStars, mingPalace, wuxingJu, palaceGans } = base;
    const yearZhiIdx = DIZHI.indexOf(yearGanZhi.zhi);

    // 飞星宫干飞化（palaceGans 已在 generateChart 内计算并返回）
    const flyingStars = calcFlyingStars(palaceGans, mainStars, minorStars);
    // 自化
    const selfTrans   = findSelfTransformations(flyingStars);
    // 大限序列
    const daxianSeq   = calcDaxianSequence(
        mingPalace.index, wuxingJu, yearZhiIdx,
        input.gender || 'male', palaceGans, mainStars
    );

    // 可选：流盘
    let flow = null;
    if (input.flowYear) {
        flow = calcFullFlow(base, {
            flowYear:   input.flowYear,
            lunarMonth: input.lunarFlowMonth || 1,
            age:        input.age
        });
    }

    return {
        ...base,
        flyingStars,
        selfTransformations: selfTrans,
        daxianSequence: daxianSeq,
        flow,
        _meta: {
            engine:      'ziwei-engine v3.0',
            source:      '跨派共识（付老师+梁若瑜+令东来）',
            wuxingMethod:'命宫纳音五行局（付老师正统算法）',
            flyingStars: '付老师飞星体系（五虎遁宫干+四化飞宫）',
            generatedAt: new Date().toISOString()
        }
    };
}


// ==================== 导出 ====================
// Node.js 环境
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        yearToGanZhi, calcWuxingJu, calcWuxingJuNaYin,
        calcMingPalace, calcShenPalace,
        calcZiweiPosition, calcMainStars,
        calcMinorStars, calcFourTransformations,
        calcSanFangSiZheng, getStarBrightness,
        calcPalaceGan, calcFlyingStars,
        findSelfTransformations,
        calcDaxianSequence, getDaxianByAge,
        isForwardDaxian,
        calcLiuNian, calcLiuYue, calcLiuRi, calcLiuShi,
        calcFullFlow,
        generateChart, generateFullChart,
        DIZHI, TIANGAN, PALACE_NAMES, SIHUA_TABLE, WUHU_DUAN, WUSHU_DUAN
    };
}
// 浏览器环境
if (typeof window !== 'undefined') {
    window.ZiweiEngine = {
        yearToGanZhi, calcWuxingJu, calcWuxingJuNaYin,
        calcMingPalace, calcShenPalace,
        calcZiweiPosition, calcMainStars,
        calcMinorStars, calcFourTransformations,
        calcSanFangSiZheng, getStarBrightness,
        calcPalaceGan, calcFlyingStars,
        findSelfTransformations,
        calcDaxianSequence, getDaxianByAge,
        isForwardDaxian,
        calcLiuNian, calcLiuYue, calcLiuRi, calcLiuShi,
        calcFullFlow,
        generateChart, generateFullChart,
        DIZHI, TIANGAN, PALACE_NAMES, SIHUA_TABLE, WUHU_DUAN, WUSHU_DUAN
    };
}
