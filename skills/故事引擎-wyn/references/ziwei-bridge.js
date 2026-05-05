/**
 * 星语 × 星轨人生 - 数据联动桥接模块
 * 实现紫微斗数命理数据与星语编剧引擎的深度对接
 * 
 * 支持的数据格式：
 *   1. 纯文本小传（向后兼容现有格式）
 *   2. JSON结构化数据（星轨人生导出格式）
 *   3. 带标签的命盘数据（#mingGong#/#fuDeGong# 等）
 * 
 * 模块组成：
 *   - ZiweiDataExtractor  星轨数据提取与解析
 *   - ChartToHexagram     命理→卦象映射系统
 *   - RelationToYiXue     角色关系易学映射
 *   - ZiweiBridge         统一集成接口
 */

// ====================================================================
// 第一部分：星轨数据提取器
// ====================================================================

const ZiweiDataExtractor = {

  /**
   * 主入口：自动识别输入格式并解析
   * @param {string} bioText - 角色小传文本（纯文本/JSON/带标签）
   * @returns {Object} 结构化的命理+弧光+气质数据
   */
  parse(bioText) {
    if (!bioText || typeof bioText !== 'string') return {};

    // 尝试JSON解析
    const jsonResult = this._tryParseJSON(bioText);
    if (jsonResult) return jsonResult;

    // 尝试标签格式解析
    const taggedResult = this._tryParseTagged(bioText);
    if (taggedResult.hasTags) return taggedResult.data;

    // 纯文本解析（向后兼容）
    return {
      chart: this.extractChartData(bioText),
      arc: this.extractArcData(bioText),
      appearance: this.extractAppearance(bioText),
      source: 'plaintext'
    };
  },

  /**
   * 尝试JSON解析
   */
  _tryParseJSON(bioText) {
    try {
      const data = JSON.parse(bioText);
      if (!data || typeof data !== 'object') return null;

      // 星轨人生导出的JSON格式
      const result = { source: 'json' };

      result.chart = {
        mingGong: data.mingGong || data.ming_zhu || data.ming || '',
        fuDeGong: data.fuDeGong || data.fude || data.fu_de || '',
        fuQiGong: data.fuQiGong || data.fuqi || data.fu_qi || '',
        sihua: data.sihua || data.fourTransformations || [],
        daXian: data.daXian || data.daxian || data.major_period || '',
        liuNian: data.liuNian || data.liunian || data.current_year || '',
        sanFangSiZheng: data.sanFangSiZheng || data.trigram || null,
        gongWei: data.gongWei || data.palaces || {},
        raw: data
      };

      result.arc = {
        want: data.want || '',
        need: data.need || '',
        ghost: data.ghost || '',
        lie: data.lie || '',
        flaw: data.flaw || '',
        arc: data.arc || data.characterArc || ''
      };

      result.appearance = {
        temperament: data.temperament || data.qizhi || '',
        appearance: data.appearance || data.waiguan || '',
        aura: data.aura || data.qichang || ''
      };

      return result;
    } catch (e) {
      return null;
    }
  },

  /**
   * 尝试标签格式解析
   * 支持格式：#mingGong:紫微贪狼# #fuDeGong:天机太阴# #命宫:紫微贪狼# 等
   */
  _tryParseTagged(bioText) {
    const tagPattern = /#([\u4e00-\u9fff\w]+)(?::([^\#]*))?#/g;
    let match;
    let hasTags = false;
    const tags = {};

    while ((match = tagPattern.exec(bioText)) !== null) {
      hasTags = true;
      tags[match[1]] = (match[2] || '').trim();
    }

    if (!hasTags) return { hasTags: false };

    // 将标签映射为标准字段名
    const fieldMap = {
      mingGong: 'mingGong', ming: 'mingGong', 命宫: 'mingGong',
      fuDeGong: 'fuDeGong', fude: 'fuDeGong', 福德宫: 'fuDeGong',
      fuQiGong: 'fuQiGong', fuqi: 'fuQiGong', 夫妻宫: 'fuQiGong',
      sihua: 'sihua', 四化: 'sihua',
      daXian: 'daXian', daxian: 'daXian', 大限: 'daXian',
      liuNian: 'liuNian', liunian: 'liuNian', 流年: 'liuNian',
      want: 'want', Want: 'want',
      need: 'need', Need: 'need',
      ghost: 'ghost', Ghost: 'ghost',
      lie: 'lie', Lie: 'lie',
      flaw: 'flaw', Flaw: 'flaw',
      arc: 'arc', Arc: 'arc',
      temperament: 'temperament', 气质: 'temperament',
      appearance: 'appearance', 外貌: 'appearance',
      aura: 'aura', 气场: 'aura'
    };

    const mapped = {};
    for (const [key, value] of Object.entries(tags)) {
      const standardKey = fieldMap[key];
      if (standardKey && value) mapped[standardKey] = value;
    }

    return {
      hasTags: true,
      data: {
        source: 'tagged',
        chart: {
          mingGong: mapped.mingGong || '',
          fuDeGong: mapped.fuDeGong || '',
          fuQiGong: mapped.fuQiGong || '',
          sihua: this._parseSihuaText(mapped.sihua || ''),
          daXian: mapped.daXian || '',
          liuNian: mapped.liuNian || ''
        },
        arc: {
          want: mapped.want || '',
          need: mapped.need || '',
          ghost: mapped.ghost || '',
          lie: mapped.lie || '',
          flaw: mapped.flaw || '',
          arc: mapped.arc || ''
        },
        appearance: {
          temperament: mapped.temperament || '',
          appearance: mapped.appearance || '',
          aura: mapped.aura || ''
        }
      }
    };
  },

  /**
   * 解析四化文本为数组
   * 支持格式："化禄,化权" / "化禄化权" / "禄权"
   */
  _parseSihuaText(text) {
    if (!text) return [];
    if (Array.isArray(text)) return text;
    // 补全简写
    const expanded = text
      .replace(/禄/g, '化禄').replace(/权/g, '化权')
      .replace(/科/g, '化科').replace(/忌/g, '化忌');
    return expanded.split(/[,\s、]+/).filter(s => s.startsWith('化'));
  },

  // ================================================================
  // 纯文本模式：从自由文本中提取命盘信息
  // ================================================================

  /**
   * 从纯文本小传中提取命盘信息
   * @param {string} bioText - 角色小传文本
   * @returns {Object} 命盘数据
   */
  extractChartData(bioText) {
    const text = bioText || '';

    // 十四主星关键词库
    const STAR_PATTERNS = {
      mingGong: {
        stars: ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴',
                '贪狼', '巨门', '天相', '天梁', '七杀', '破军'],
        prefixes: ['命宫', '命宫主星', '本命', '命主', '命盘主星'],
        separator: /[,，、\s]+/
      },
      fuDeGong: {
        stars: ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴',
                '贪狼', '巨门', '天相', '天梁', '七杀', '破军'],
        prefixes: ['福德宫', '福德', '潜意识', '精神世界', '内心世界'],
        separator: /[,，、\s]+/
      },
      fuQiGong: {
        stars: ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴',
                '贪狼', '巨门', '天相', '天梁', '七杀', '破军'],
        prefixes: ['夫妻宫', '夫妻', '感情宫', '恋爱宫', '婚姻宫'],
        separator: /[,，、\s]+/
      }
    };

    const result = { mingGong: '', fuDeGong: '', fuQiGong: '', sihua: [], daXian: '', liuNian: '' };

    // 提取各宫位主星 — 支持 【命宫主星】xxx 和 命宫：xxx 两种格式
    for (const [field, config] of Object.entries(STAR_PATTERNS)) {
      for (const prefix of config.prefixes) {
        // 格式1: 【前缀】xxx
        const bracketRegex = new RegExp('【\\s*' + prefix + '\\s*】\\s*([\\u4e00-\\u9fff]+)');
        // 格式2: 前缀：xxx 或 前缀: xxx
        const colonRegex = new RegExp(prefix + '\\s*[：:]\\s*([\\u4e00-\\u9fff]+)');

        let match = text.match(bracketRegex) || text.match(colonRegex);
        if (match) {
          const value = match[1].trim();
          const foundStars = config.stars.filter(s => value.includes(s));
          if (foundStars.length > 0) {
            result[field] = foundStars.slice(0, 3).join('');
          } else {
            result[field] = value;
          }
          break;
        }
      }
    }

    // 如果没找到带前缀的格式，尝试从整段文本中捕捉星名组合
    if (!result.mingGong) {
      const allStars = STAR_PATTERNS.mingGong.stars;
      const foundInText = allStars.filter(s => text.includes(s));
      // 取前两个作为命宫主星
      if (foundInText.length >= 1) {
        result.mingGong = foundInText.slice(0, Math.min(2, foundInText.length)).join('');
      }
    }

    // 提取四化 — 支持 "化禄/化权/化科/化忌" 和 "四化：化禄在XX"
    const sihuaKeywords = ['化禄', '化权', '化科', '化忌'];
    for (const kw of sihuaKeywords) {
      if (text.includes(kw)) result.sihua.push(kw);
    }

    // 提取大限 — 支持 【当前大限】xxx 和 大限：xxx
    const daXianMatch = text.match(/【\s*当前大限\s*】\s*([^\n\r【]*)/) || text.match(/大限\s*[：:]\s*(\S+)/);
    if (daXianMatch) result.daXian = daXianMatch[1].trim();

    // 提取流年 — 支持 【流年】xxx 和 流年：xxx
    const liuNianMatch = text.match(/【\s*流年\s*】\s*([^\n\r【]*)/) || text.match(/流年\s*[：:]\s*(\S+)/);
    if (liuNianMatch) result.liuNian = liuNianMatch[1].trim();

    return result;
  },

  /**
   * 从纯文本小传中提取 Want/Need/Ghost/Lie 等弧光数据
   * 增强版：在现有 plotGenerator.js 的 extractCharacterArc 基础上
   * 增加星轨人生特有的心理学维度解析
   * @param {string} bioText - 角色小传文本
   * @returns {Object} 弧光数据
   */
  extractArcData(bioText) {
    const text = bioText || '';
    const lower = text.toLowerCase();

    // 基础弧光提取（与 plotGenerator.js 兼容）
    let want = '', need = '', ghost = '', lie = '', flaw = '', arc = '';

    // 尝试从结构化格式提取（支持多种格式）
    // 格式1: "Want：获得认可" / "Want: 获得认可"
    // 格式2: "【Want】获得认可" / "【Want】：获得认可"
    // 格式3: "显性欲望：获得认可" / "Want（显性欲望）：获得认可"
    const wantMatch = text.match(/(?:【\s*Want\s*】\s*[:：]?\s*|Want(?:\s*[:：])\s*|显性欲望\s*[:：]\s*)([^\n\r【】,，。]{2,60})/i)
      || text.match(/【\s*Want\s*】([^\n\r【]*)/i);
    if (wantMatch) want = wantMatch[1].trim();

    const needMatch = text.match(/(?:【\s*Need\s*】\s*[:：]?\s*|Need(?:\s*[:：])\s*|内在需求\s*[:：]\s*|真实需求\s*[:：]\s*)([^\n\r【】,，。]{2,60})/i)
      || text.match(/【\s*Need\s*】([^\n\r【]*)/i);
    if (needMatch) needMatch[1] && (need = needMatch[1].trim());

    const ghostMatch = text.match(/(?:【\s*Ghost\s*】\s*[:：]?\s*|Ghost(?:\s*[:：])\s*|灵魂创伤\s*[:：]\s*|心理创伤\s*[:：]\s*|Ghost事件\s*[:：]\s*)([^\n\r【】,，。]{2,60})/i)
      || text.match(/【\s*Ghost\s*】([^\n\r【]*)/i);
    if (ghostMatch) ghostMatch[1] && (ghost = ghostMatch[1].trim());

    const lieMatch = text.match(/(?:【\s*Lie\s*】\s*[:：]?\s*|Lie(?:\s*[:：])\s*|核心信念\s*[:：]\s*|核心谎言\s*[:：]\s*)([^\n\r【】,，。]{2,60})/i)
      || text.match(/【\s*Lie\s*】([^\n\r【]*)/i);
    if (lieMatch) lieMatch[1] && (lie = lieMatch[1].trim());

    const flawMatch = text.match(/(?:【\s*Flaw\s*】\s*[:：]?\s*|Flaw(?:\s*[:：])\s*|性格缺陷\s*[:：]\s*|致命弱点\s*[:：]\s*)([^\n\r【】,，。]{2,60})/i)
      || text.match(/【\s*Flaw\s*】([^\n\r【]*)/i);
    if (flawMatch) flawMatch[1] && (flaw = flawMatch[1].trim());

    const arcMatch = text.match(/(?:【\s*Arc\s*】\s*[:：]?\s*|Arc(?:\s*[:：])\s*|人物弧光\s*[:：]\s*|弧光类型\s*[:：]\s*)([^\n\r【】,，。]{2,20})/i)
      || text.match(/【\s*Arc\s*】([^\n\r【]*)/i);
    if (arcMatch) arcMatch[1] && (arc = arcMatch[1].trim());

    // 如果没有结构化格式，尝试关键词匹配（兼容 plotGenerator.js 的 CharacterArcs 库）
    if (!want) want = this._matchFromLibrary(lower, 'want');
    if (!need) need = this._matchFromLibrary(lower, 'need');
    if (!ghost) ghost = this._matchFromLibrary(lower, 'ghost');
    if (!lie) lie = this._matchFromLibrary(lower, 'lie');
    if (!flaw) flaw = this._matchFromLibrary(lower, 'flaw');

    // 弧光类型推断
    if (!arc) {
      if (lower.includes('悲剧') || lower.includes('绝望') || lower.includes('毁灭')) arc = '悲剧';
      else if (lower.includes('救赎') || lower.includes('放下') || lower.includes('宽恕')) arc = '救赎';
      else if (lower.includes('觉醒') || lower.includes('醒悟') || lower.includes('顿悟')) arc = '觉醒';
      else if (lower.includes('堕落') || lower.includes('黑化') || lower.includes('沉沦')) arc = '堕落';
      else if (lower.includes('坚持') || lower.includes('信念') || lower.includes('不渝')) arc = '坚持';
      else arc = '成长';
    }

    return { want, need, ghost, lie, flaw, arc };
  },

  /**
   * 从纯文本中提取面相/气质描述
   * @param {string} bioText - 角色小传文本
   * @returns {Object} 气质/外貌/气场数据
   */
  extractAppearance(bioText) {
    const text = bioText || '';

    // 气质类型关键词
    const TEMPERAMENTS = {
      '威严': ['威严', '霸气', '气场强大', '王者之气', '不怒自威'],
      '儒雅': ['儒雅', '温和', '斯文', '温文尔雅', '书卷气'],
      '冷峻': ['冷峻', '高冷', '冷漠', '面无表情', '不苟言笑'],
      '活泼': ['活泼', '开朗', '热情', '爱笑', '活力四射'],
      '阴郁': ['阴郁', '忧郁', '沉闷', '心事重重', '眉间紧锁'],
      '狡猾': ['狡猾', '精明', '算计', '城府深', '老狐狸'],
      '天真': ['天真', '单纯', '善良', '质朴', '不谙世事'],
      '沧桑': ['沧桑', '饱经风霜', '沧桑感', '阅历深厚', '岁月痕迹']
    };

    // 外貌特征关键词
    const APPEARANCES = {
      '俊美': ['英俊', '帅气', '俊朗', '五官端正', '棱角分明'],
      '柔美': ['美丽', '温婉', '秀美', '清秀', '眉目如画'],
      '刚毅': ['刚毅', '粗犷', '硬朗', '健壮', '肌肉结实'],
      '清瘦': ['清瘦', '瘦削', '纤细', '苗条', '单薄'],
      '出众': ['出众', '引人注目', '回头率高', '气质非凡', '卓尔不群']
    };

    // 气场描述关键词
    const AURAS = {
      '压迫感': ['压迫感', '气场', '威压', '令人窒息', '不怒自威'],
      '亲和力': ['亲和力', '温暖', '如沐春风', '容易接近', '让人放松'],
      '神秘感': ['神秘', '捉摸不透', '深不可测', '若即若离', '高深莫测'],
      '颓废感': ['颓废', '颓靡', '自暴自弃', '浑浑噩噩', '萎靡不振'],
      '锐利感': ['锐利', '精光四射', '目光如炬', '洞察一切', '鹰视狼顾']
    };

    const findTemperament = (text, dict) => {
      for (const [type, keywords] of Object.entries(dict)) {
        for (const kw of keywords) {
          if (text.includes(kw)) return type;
        }
      }
      return '';
    };

    // 提取气质描述文本段
    const temperamentDesc = this._extractSentence(text, TEMPERAMENTS);
    const appearanceDesc = this._extractSentence(text, APPEARANCES);
    const auraDesc = this._extractSentence(text, AURAS);

    return {
      temperament: findTemperament(text, TEMPERAMENTS),
      appearance: findTemperament(text, APPEARANCES),
      aura: findTemperament(text, AURAS),
      temperamentDesc,
      appearanceDesc,
      auraDesc
    };
  },

  /**
   * 从文本中提取包含关键词的句子
   */
  _extractSentence(text, keywordDict) {
    const allKeywords = Object.values(keywordDict).flat();
    for (const kw of allKeywords) {
      const idx = text.indexOf(kw);
      if (idx >= 0) {
        // 找到包含该关键词的完整句子
        const start = Math.max(0, text.lastIndexOf('。', idx) + 1);
        const end = text.indexOf('。', idx);
        const sentence = end >= 0
          ? text.substring(start, end + 1)
          : text.substring(start);
        return sentence.trim();
      }
    }
    return '';
  },

  /**
   * 从关键词库匹配（与 plotGenerator.js CharacterArcs 兼容）
   */
  _matchFromLibrary(lower, type) {
    // 使用 plotGenerator.js 中已有的 CharacterArcs 库
    if (typeof CharacterArcs !== 'undefined') {
      const libMap = {
        want: CharacterArcs.wantTemplates,
        need: CharacterArcs.needTemplates,
        ghost: CharacterArcs.ghostTemplates,
        lie: CharacterArcs.lieTemplates,
        flaw: CharacterArcs.flawTemplates
      };
      const lib = libMap[type];
      if (lib) {
        for (const [keyword, template] of Object.entries(lib)) {
          if (lower.includes(keyword.toLowerCase())) {
            return typeof template === 'string' ? template : template;
          }
        }
      }
    }
    // 默认值
    const defaults = {
      want: '找到真正想要的目标',
      need: '学会真正面对自己',
      ghost: '过去的创伤经历',
      lie: '必须通过某种方式证明自己',
      flaw: '用某种方式回避真正的亲密/冲突'
    };
    return defaults[type] || '';
  }
};


// ====================================================================
// 第二部分：命理→卦象映射系统
// ====================================================================

const ChartToHexagram = {

  /**
   * 十四主星→卦象映射
   * 基于紫微斗数主星性格特征与易经卦象的对应关系
   * 每颗主星对应3个最匹配的卦象
   */
  mingZhuToHexagram: {
    '紫微': {
      name: '紫微帝星',
      traits: ['领导', '权威', '孤高', '宿命'],
      hexagrams: [
        { name: '乾', number: 1, desc: '天行健，紫微帝座', relevance: 95 },
        { name: '大有', number: 14, desc: '众星拱照，大有所成', relevance: 88 },
        { name: '鼎', number: 50, desc: '革故鼎新，正位凝命', relevance: 82 }
      ]
    },
    '天机': {
      name: '天机智星',
      traits: ['谋略', '善变', '智慧', '犹豫'],
      hexagrams: [
        { name: '屯', number: 3, desc: '万事开头难，需谨慎谋划', relevance: 92 },
        { name: '蒙', number: 4, desc: '启蒙求知，善于分析', relevance: 87 },
        { name: '巽', number: 57, desc: '进退自如，灵活应变', relevance: 80 }
      ]
    },
    '太阳': {
      name: '太阳贵星',
      traits: ['光明', '博爱', '刚健', '消耗'],
      hexagrams: [
        { name: '同人', number: 13, desc: '同人于野，光明磊落', relevance: 93 },
        { name: '明夷', number: 36, desc: '光明受伤，仍守正道', relevance: 85 },
        { name: '晋', number: 35, desc: '明出地上，事业上升', relevance: 83 }
      ]
    },
    '武曲': {
      name: '武曲将星',
      traits: ['刚毅', '战斗', '财运', '孤独'],
      hexagrams: [
        { name: '师', number: 7, desc: '能以众正，可以王矣', relevance: 94 },
        { name: '比', number: 8, desc: '亲比相辅，团结力量', relevance: 82 },
        { name: '小畜', number: 9, desc: '畜养实力，厚积薄发', relevance: 78 }
      ]
    },
    '天同': {
      name: '天同福星',
      traits: ['福气', '懒散', '乐观', '被动'],
      hexagrams: [
        { name: '泰', number: 11, desc: '天地交泰，平安顺遂', relevance: 91 },
        { name: '临', number: 19, desc: '居高临下，顺应自然', relevance: 84 },
        { name: '中孚', number: 61, desc: '信及豚鱼，内心平和', relevance: 76 }
      ]
    },
    '廉贞': {
      name: '廉贞囚星',
      traits: ['争斗', '桃花', '官非', '自囚'],
      hexagrams: [
        { name: '困', number: 47, desc: '困于险中，需守正待时', relevance: 93 },
        { name: '噬嗑', number: 21, desc: '刑罚之象，刚柔分明', relevance: 86 },
        { name: '坎', number: 29, desc: '习坎重重，险中求通', relevance: 79 }
      ]
    },
    '天府': {
      name: '天府财星',
      traits: ['保守', '稳重', '富足', '善藏'],
      hexagrams: [
        { name: '坤', number: 2, desc: '地势坤，厚德载物', relevance: 90 },
        { name: '大畜', number: 26, desc: '畜养贤能，积蓄财富', relevance: 85 },
        { name: '贲', number: 22, desc: '文饰之美，含蓄内敛', relevance: 77 }
      ]
    },
    '太阴': {
      name: '太阴阴星',
      traits: ['细腻', '敏感', '神秘', '忧郁'],
      hexagrams: [
        { name: '渐', number: 53, desc: '循序渐进，温婉柔顺', relevance: 91 },
        { name: '小过', number: 62, desc: '小有过越，宜小不宜大', relevance: 83 },
        { name: '观', number: 20, desc: '观天下，洞察幽微', relevance: 80 }
      ]
    },
    '贪狼': {
      name: '贪狼桃花星',
      traits: ['欲望', '多才', '桃花', '多变'],
      hexagrams: [
        { name: '咸', number: 31, desc: '感应之象，男女交感', relevance: 92 },
        { name: '恒', number: 32, desc: '持之以恒，贪念难消', relevance: 85 },
        { name: '归妹', number: 54, desc: '归妹以须，欲望之象', relevance: 78 }
      ]
    },
    '巨门': {
      name: '巨门暗星',
      traits: ['口才', '是非', '疑心', '分析'],
      hexagrams: [
        { name: '讼', number: 6, desc: '争讼之象，口舌是非', relevance: 93 },
        { name: '革', number: 49, desc: '变革之象，颠覆成见', relevance: 84 },
        { name: '家人', number: 37, desc: '齐家之道，口舌化解', relevance: 76 }
      ]
    },
    '天相': {
      name: '天相印星',
      traits: ['辅佐', '正直', '印信', '平衡'],
      hexagrams: [
        { name: '益', number: 42, desc: '损上益下，辅佐有道', relevance: 92 },
        { name: '升', number: 46, desc: '积小成大，稳步上升', relevance: 84 },
        { name: '萃', number: 45, desc: '群英荟萃，得贵人助', relevance: 79 }
      ]
    },
    '天梁': {
      name: '天梁荫星',
      traits: ['庇荫', '清高', '老成', '化解'],
      hexagrams: [
        { name: '井', number: 48, desc: '井养不穷，润泽万物', relevance: 90 },
        { name: '蹇', number: 39, desc: '山高水险，困难可化', relevance: 85 },
        { name: '解', number: 40, desc: '化解困难，柳暗花明', relevance: 82 }
      ]
    },
    '七杀': {
      name: '七杀将星',
      traits: ['杀伐', '叛逆', '冲锋', '破坏'],
      hexagrams: [
        { name: '夬', number: 43, desc: '刚决柔，以力服人', relevance: 94 },
        { name: '大过', number: 28, desc: '过而能改，破而后立', relevance: 87 },
        { name: '震', number: 51, desc: '震惊百里，破旧立新', relevance: 83 }
      ]
    },
    '破军': {
      name: '破军耗星',
      traits: ['破坏', '消耗', '变革', '重建'],
      hexagrams: [
        { name: '革', number: 49, desc: '天地革而四时成', relevance: 93 },
        { name: '丰', number: 55, desc: '盛极而衰，破而后立', relevance: 86 },
        { name: '既济', number: 63, desc: '已完成但暗藏变数', relevance: 79 }
      ]
    }
  },

  /**
   * 四化→卦象映射
   * 化禄=收获/化权=权力/化科=名望/化忌=困境
   */
  sihuaToHexagram: {
    '化禄': {
      name: '化禄·收获',
      hexagrams: [
        { name: '泰', number: 11, desc: '天地交泰，收获丰盛', relevance: 92 },
        { name: '益', number: 42, desc: '损上益下，得人助力', relevance: 86 },
        { name: '丰', number: 55, desc: '盛大丰盈，名利双收', relevance: 80 }
      ]
    },
    '化权': {
      name: '化权·权力',
      hexagrams: [
        { name: '乾', number: 1, desc: '大哉乾元，万物资始', relevance: 95 },
        { name: '大有', number: 14, desc: '大有收获，众望所归', relevance: 88 },
        { name: '夬', number: 43, desc: '决而必行，掌控全局', relevance: 82 }
      ]
    },
    '化科': {
      name: '化科·名望',
      hexagrams: [
        { name: '贲', number: 22, desc: '文饰之象，名望渐起', relevance: 90 },
        { name: '观', number: 20, desc: '观仰之象，受人敬仰', relevance: 85 },
        { name: '艮', number: 52, desc: '止而静之，稳重可信', relevance: 78 }
      ]
    },
    '化忌': {
      name: '化忌·困境',
      hexagrams: [
        { name: '否', number: 12, desc: '天地不交，闭塞不通', relevance: 93 },
        { name: '蹇', number: 39, desc: '山高水险，行路艰难', relevance: 88 },
        { name: '困', number: 47, desc: '泽无水困，陷入困境', relevance: 85 }
      ]
    }
  },

  /**
   * 宫位→卦象辅助映射
   */
  gongToHexagram: {
    ming: { name: '命宫', hexagrams: ['乾', '坤'] },
    xiongdi: { name: '兄弟宫', hexagrams: ['比', '师'] },
    fuqi: { name: '夫妻宫', hexagrams: ['咸', '恒'] },
    zizhi: { name: '子女宫', hexagrams: ['家人', '渐'] },
    caibo: { name: '财帛宫', hexagrams: ['大有', '损'] },
    jixiong: { name: '疾厄宫', hexagrams: ['坎', '困'] },
    qianyi: { name: '迁移宫', hexagrams: ['晋', '升'] },
    jiaoyou: { name: '交友宫', hexagrams: ['同人', '萃'] },
    guanlu: { name: '官禄宫', hexagrams: ['鼎', '丰'] },
    tianzhai: { name: '田宅宫', hexagrams: ['小畜', '大畜'] },
    fude: { name: '福德宫', hexagrams: ['颐', '中孚'] },
    fumu: { name: '父母宫', hexagrams: ['井', '蛊'] }
  },

  /**
   * 综合推荐算法：根据完整命盘数据推荐最适合的卦象
   * @param {Object} chartData - 命盘数据（ZiweiDataExtractor.extractChartData 的返回值）
   * @returns {Array} 推荐卦象数组，按匹配度排序
   */
  recommendHexagram(chartData) {
    if (!chartData) return [];

    const scoreMap = {}; // { 卦象名: 总分 }

    // 1. 命宫主星权重 40%
    if (chartData.mingGong) {
      const stars = this._extractStarNames(chartData.mingGong);
      for (const star of stars) {
        const mapping = this.mingZhuToHexagram[star];
        if (mapping) {
          for (const hex of mapping.hexagrams) {
            scoreMap[hex.name] = (scoreMap[hex.name] || 0) + hex.relevance * 0.4;
          }
        }
      }
    }

    // 2. 四化权重 35%
    if (chartData.sihua && chartData.sihua.length > 0) {
      const sihuaCount = chartData.sihua.length;
      const weightPerSihua = 0.35 / sihuaCount;
      for (const sh of chartData.sihua) {
        const mapping = this.sihuaToHexagram[sh];
        if (mapping) {
          for (const hex of mapping.hexagrams) {
            scoreMap[hex.name] = (scoreMap[hex.name] || 0) + hex.relevance * weightPerSihua;
          }
        }
      }
    }

    // 3. 福德宫权重 15%（潜意识层面）
    if (chartData.fuDeGong) {
      const stars = this._extractStarNames(chartData.fuDeGong);
      for (const star of stars) {
        const mapping = this.mingZhuToHexagram[star];
        if (mapping) {
          for (const hex of mapping.hexagrams) {
            scoreMap[hex.name] = (scoreMap[hex.name] || 0) + hex.relevance * 0.15;
          }
        }
      }
    }

    // 4. 夫妻宫权重 10%（关系层面）
    if (chartData.fuQiGong) {
      const stars = this._extractStarNames(chartData.fuQiGong);
      for (const star of stars) {
        const mapping = this.mingZhuToHexagram[star];
        if (mapping) {
          for (const hex of mapping.hexagrams) {
            scoreMap[hex.name] = (scoreMap[hex.name] || 0) + hex.relevance * 0.1;
          }
        }
      }
    }

    // 排序并返回结果
    const results = Object.entries(scoreMap)
      .map(([name, score]) => ({
        name,
        score: Math.round(score * 100) / 100,
        number: this._getHexagramNumber(name),
        desc: this._getHexagramDesc(name)
      }))
      .sort((a, b) => b.score - a.score);

    return results.slice(0, 6); // 返回Top 6
  },

  /**
   * 获取单个主星对应的卦象
   */
  getHexagramsForStar(starName) {
    return this.mingZhuToHexagram[starName]?.hexagrams || [];
  },

  /**
   * 获取四化对应的卦象
   */
  getHexagramsForSihua(sihuaType) {
    return this.sihuaToHexagram[sihuaType]?.hexagrams || [];
  },

  // --- 内部工具方法 ---

  /**
   * 从命宫字符串中提取星名
   * 如 "紫微贪狼" → ["紫微", "贪狼"]
   */
  _extractStarNames(starStr) {
    if (!starStr) return [];
    const allStars = Object.keys(this.mingZhuToHexagram);
    const found = [];
    let remaining = starStr;
    // 按星名长度降序排列，优先匹配长名
    const sorted = [...allStars].sort((a, b) => b.length - a.length);
    for (const star of sorted) {
      if (remaining.includes(star)) {
        found.push(star);
        remaining = remaining.replace(new RegExp(star, 'g'), '');
      }
    }
    return found;
  },

  /**
   * 获取卦象编号
   */
  _getHexagramNumber(name) {
    for (const mapping of Object.values(this.mingZhuToHexagram)) {
      for (const hex of mapping.hexagrams) {
        if (hex.name === name) return hex.number;
      }
    }
    for (const mapping of Object.values(this.sihuaToHexagram)) {
      for (const hex of mapping.hexagrams) {
        if (hex.name === name) return hex.number;
      }
    }
    return 0;
  },

  /**
   * 获取卦象描述
   */
  _getHexagramDesc(name) {
    for (const mapping of Object.values(this.mingZhuToHexagram)) {
      for (const hex of mapping.hexagrams) {
        if (hex.name === name) return hex.desc;
      }
    }
    for (const mapping of Object.values(this.sihuaToHexagram)) {
      for (const hex of mapping.hexagrams) {
        if (hex.name === name) return hex.desc;
      }
    }
    return '';
  }
};


// ====================================================================
// 第三部分：角色关系易学映射
// ====================================================================

const RelationToYiXue = {

  /**
   * 星宿关系类型库
   */
  XIU_RELATION_TYPES: ['安坏', '危成', '荣亲', '友衰', '业胎', '命之星'],

  /**
   * 星宿关系事件模板
   */
  XIU_EVENT_TEMPLATES: {
    '安坏': {
      prelife: '经济亏欠',
      thisLife: '虐恋纠葛',
      events: [
        'A为B付出却被当成理所当然',
        'A生病时B不在身边',
        'A发现B并不珍惜自己的付出',
        'A终于爆发，关系破裂',
        'B事后追悔莫及'
      ]
    },
    '危成': {
      prelife: '事业互助',
      thisLife: '救赎互补',
      events: [
        '两人在事业上产生交集',
        'B想用感情回报A的帮助',
        '一方过度依赖另一方',
        '一方太实际一方太浪漫'
      ]
    },
    '荣亲': {
      prelife: '血缘关系',
      thisLife: '和谐温暖',
      events: [
        '共同朋友起哄撮合',
        '肢体接触时的微妙尴尬',
        '出现追求者引发波澜',
        '家庭背景的差异带来挑战'
      ]
    },
    '友衰': {
      prelife: '朋友关系',
      thisLife: '友达以上',
      events: [
        '喝醉后意外表白',
        '误以为对方有了恋人',
        '第三方刺激关系变化',
        '太熟了反而下不去手'
      ]
    },
    '业胎': {
      prelife: '情感纠葛',
      thisLife: '灵魂伴侣',
      events: [
        '初次见面便有似曾相识感',
        '对方频繁出现在自己的梦境中',
        '在陌生城市偶然相遇',
        '深入交流后产生灵魂共振'
      ]
    },
    '命之星': {
      prelife: '深厚羁绊',
      thisLife: '命运共同体',
      events: [
        '躲不过的反复相遇',
        '在最不想见时偏偏出现',
        '命运般的重逢',
        '抗拒命运vs接受宿命'
      ]
    }
  },

  /**
   * 奇门遁甲八门格局
   */
  QIMEN_MEN: {
    '开门': {
      name: '开门·开疆拓土',
      desc: '适合主动出击，开拓新领域',
      strategies: ['主动出击', '新市场', '扩张版图', '挑战权威'],
      element: '金'
    },
    '休门': {
      name: '休门·休养生息',
      desc: '适合蓄势待发，等待时机',
      strategies: ['暂时退让', '积蓄力量', '等待时机', '养精蓄锐'],
      element: '水'
    },
    '生门': {
      name: '生门·生机勃勃',
      desc: '适合绝处逢生，创造转机',
      strategies: ['绝处逢生', '获得新机会', '贵人相助', '东山再起'],
      element: '土'
    },
    '伤门': {
      name: '伤门·损伤争夺',
      desc: '必有损伤的激烈竞争',
      strategies: ['激烈竞争', '两败俱伤', '冲突对抗', '以伤换胜'],
      element: '木'
    },
    '杜门': {
      name: '杜门·密谋隐藏',
      desc: '适合暗中行动，隐藏实力',
      strategies: ['暗中行动', '隐藏实力', '秘密联盟', '暗中使绊'],
      element: '木'
    },
    '景门': {
      name: '景门·虚张声势',
      desc: '适合迷惑对手，制造假象',
      strategies: ['迷惑对手', '制造假象', '声东击西', '谈判施压'],
      element: '火'
    },
    '死门': {
      name: '死门·置之死地',
      desc: '背水一战的绝境',
      strategies: ['背水一战', '玉石俱焚', '同归于尽', '最后一搏'],
      element: '土'
    },
    '惊门': {
      name: '惊门·惊慌动荡',
      desc: '突发变数打破平衡',
      strategies: ['意外变数', '舆论危机', '信任崩塌', '人心惶惶'],
      element: '金'
    }
  },

  /**
   * 六壬事件链模板
   */
  LIUREN_EVENT_CHAINS: {
    '调查': {
      name: '调查链',
      steps: ['发现异常 → 追查线索 → 遭遇阻碍 → 线索中断 → 发现新方向 → 接近真相']
    },
    '追踪': {
      name: '追踪链',
      steps: ['锁定目标 → 跟踪观察 → 发现异常 → 目标察觉 → 激烈追逐 → 真相浮出']
    },
    '背叛': {
      name: '背叛链',
      steps: ['建立信任 → 发现疑点 → 搜集证据 → 确认背叛 → 摊牌对峙 → 结果分化']
    },
    '逃脱': {
      name: '逃脱链',
      steps: ['陷入困境 → 分析局势 → 寻找破绽 → 实施逃脱 → 被追杀 → 最终安全/被发现']
    },
    '复仇': {
      name: '复仇链',
      steps: ['确定目标 → 制定计划 → 接近仇人 → 实施报复 → 意外反转 → 最终清算']
    },
    '联盟': {
      name: '联盟链',
      steps: ['利益分析 → 试探接触 → 建立信任 → 签订盟约 → 共同行动 → 联盟考验']
    }
  },

  /**
   * 根据关系类型和角色命理数据，判断星宿关系
   * @param {string} relationshipType - 关系类型文本（如"恋人"、"仇人"等）
   * @param {Object} char1 - 角色1的命理数据（parse() 返回值）
   * @param {Object} char2 - 角色2的命理数据
   * @returns {Object} 星宿关系映射结果
   */
  mapToXiuRelation(relationshipType, char1, char2) {
    if (!relationshipType) {
      return {
        recommended: '友衰',
        alternatives: ['荣亲', '危成'],
        analysis: '未提供关系类型，默认推荐友衰关系'
      };
    }

    // 关系类型→星宿关系的粗映射
    const typeToXiu = {
      '恋人': ['业胎', '危成', '安坏'],
      '初恋': ['业胎', '命之星'],
      '暗恋': ['友衰', '危成'],
      '暧昧对象': ['危成', '友衰'],
      '前任': ['安坏', '业胎'],
      '结婚对象': ['荣亲', '业胎'],
      '离婚对象': ['安坏', '命之星'],
      '仇人': ['安坏', '命之星'],
      '竞争对手': ['安坏', '危成'],
      '挚友': ['荣亲', '友衰'],
      '合作伙伴': ['危成', '荣亲'],
      '父亲': ['荣亲', '业胎'],
      '母亲': ['荣亲', '业胎'],
      '兄弟姐妹': ['荣亲', '友衰'],
      '恩人': ['危成', '荣亲'],
      '债主': ['安坏'],
      '救命恩人': ['业胎', '危成']
    };

    // 获取候选星宿关系
    const candidates = typeToXiu[relationshipType] || ['友衰', '荣亲', '危成'];

    // 根据命理数据微调推荐
    let primary = candidates[0];

    // 如果有化忌的角色，倾向于安坏关系（虐恋张力）
    if (char1?.chart?.sihua?.includes('化忌') || char2?.chart?.sihua?.includes('化忌')) {
      if (candidates.includes('安坏')) primary = '安坏';
    }
    // 如果命宫有七杀/破军，倾向于安坏（冲突张力）
    const aggressiveStars = ['七杀', '破军', '廉贞', '武曲'];
    const char1Ming = char1?.chart?.mingGong || '';
    const char2Ming = char2?.chart?.mingGong || '';
    const hasAggressive = aggressiveStars.some(s => char1Ming.includes(s) || char2Ming.includes(s));
    if (hasAggressive && candidates.includes('安坏')) {
      primary = '安坏';
    }

    const template = this.XIU_EVENT_TEMPLATES[primary] || this.XIU_EVENT_TEMPLATES['友衰'];

    return {
      recommended: primary,
      alternatives: candidates.filter(c => c !== primary),
      prelife: template.prelife,
      thisLife: template.thisLife,
      events: template.events,
      analysis: `${relationshipType}关系映射为「${primary}」星宿关系，前世为${template.prelife}，今生呈现${template.thisLife}模式`
    };
  },

  /**
   * 分析多人关系的奇门遁甲格局
   * @param {Array} relationships - 关系数组 [{from, to, type}, ...]
   * @param {Array} characters - 角色数组（含命理数据）
   * @returns {Object} 奇门格局分析结果
   */
  mapToQimen(relationships, characters) {
    if (!relationships || relationships.length === 0) {
      return {
        primaryGate: '生门',
        gateAnalysis: '无关系数据，默认生门格局',
        strategies: this.QIMEN_MEN['生门'].strategies
      };
    }

    // 分析关系类型分布
    const typeCount = {};
    for (const rel of relationships) {
      const types = rel.customTypes || [rel.customType || '未知'].flat();
      for (const t of types) {
        typeCount[t] = (typeCount[t] || 0) + 1;
      }
    }

    // 关系类型→奇门格局映射
    const conflictTypes = ['仇人', '竞争对手', '债主', '夺爱之人'];
    const allianceTypes = ['合作伙伴', '挚友', '恩人'];
    const emotionTypes = ['恋人', '暧昧对象', '初恋', '结婚对象'];
    const mysteryTypes = ['救命恩人', '恩人'];

    let conflictScore = 0, allianceScore = 0, emotionScore = 0, mysteryScore = 0;
    for (const [type, count] of Object.entries(typeCount)) {
      if (conflictTypes.includes(type)) conflictScore += count;
      if (allianceTypes.includes(type)) allianceScore += count;
      if (emotionTypes.includes(type)) emotionScore += count;
      if (mysteryTypes.includes(type)) mysteryScore += count;
    }

    // 根据得分确定主门
    let primaryGate = '生门'; // 默认
    const maxScore = Math.max(conflictScore, allianceScore, emotionScore, mysteryScore);

    if (maxScore === conflictScore && conflictScore > 0) {
      primaryGate = conflictScore >= 2 ? '死门' : '伤门';
    } else if (maxScore === allianceScore && allianceScore > 0) {
      primaryGate = allianceScore >= 2 ? '开门' : '休门';
    } else if (maxScore === emotionScore && emotionScore > 0) {
      primaryGate = emotionScore >= 2 ? '景门' : '生门';
    } else if (maxScore === mysteryScore && mysteryScore > 0) {
      primaryGate = '杜门';
    }

    // 检查是否有角色命理数据影响
    if (characters && characters.length > 0) {
      for (const char of characters) {
        const parsed = char.ziweiData || {};
        const sihua = parsed.chart?.sihua || [];
        if (sihua.includes('化忌')) {
          // 化忌角色增加惊门权重
          if (Math.random() < 0.4) primaryGate = '惊门';
        }
        if (sihua.includes('化权')) {
          // 化权角色增加开门权重
          if (primaryGate === '休门') primaryGate = '开门';
        }
      }
    }

    const gateInfo = this.QIMEN_MEN[primaryGate] || this.QIMEN_MEN['生门'];

    return {
      primaryGate,
      gateName: gateInfo.name,
      gateDesc: gateInfo.desc,
      element: gateInfo.element,
      strategies: gateInfo.strategies,
      scores: { conflict: conflictScore, alliance: allianceScore, emotion: emotionScore, mystery: mysteryScore },
      gateAnalysis: `关系网络中对抗性${conflictScore}、联盟性${allianceScore}、情感性${emotionScore}、神秘性${mysteryScore}，主格局为「${gateInfo.name}」`
    };
  },

  /**
   * 根据冲突类型生成六壬事件链
   * @param {string} conflictType - 冲突类型
   * @param {Object} options - 附加选项
   * @returns {Object} 六壬事件链
   */
  mapToLiuren(conflictType, options = {}) {
    if (!conflictType) conflictType = '调查';

    // 冲突类型→事件链映射
    const conflictToChain = {
      '谋杀': '调查',
      '死亡': '调查',
      '真相': '调查',
      '背叛': '背叛',
      '竞争': '追踪',
      '复仇': '复仇',
      '联盟': '联盟',
      '逃脱': '逃脱',
      '调查': '调查'
    };

    const chainType = conflictToChain[conflictType] || '调查';
    const chain = this.LIUREN_EVENT_CHAINS[chainType] || this.LIUREN_EVENT_CHAINS['调查'];

    // 根据角色弧光添加细节
    const ghost = options.ghost || '';
    const lie = options.lie || '';

    const enrichedSteps = chain.steps.map((step, i) => {
      let enriched = step;
      // 在关键步骤注入心理元素
      if (i === 2 && ghost) enriched += `（Ghost触发：${ghost}）`;
      if (i === 4 && lie) enriched += `（Lie考验：${lie}）`;
      return enriched;
    });

    return {
      chainType: chain.name,
      conflictType,
      steps: enrichedSteps,
      rawSteps: chain.steps,
      tension: this._calculateTension(chainType, options)
    };
  },

  /**
   * 计算事件链的戏剧张力值（1-10）
   */
  _calculateTension(chainType, options) {
    const baseTension = {
      '调查': 6, '追踪': 7, '背叛': 8,
      '逃脱': 9, '复仇': 8, '联盟': 5
    };
    let tension = baseTension[chainType] || 6;

    // 化忌增加张力
    if (options.sihua?.includes('化忌')) tension = Math.min(10, tension + 1);
    // Ghost增加张力
    if (options.ghost) tension = Math.min(10, tension + 0.5);

    return Math.round(tension * 10) / 10;
  }
};


// ====================================================================
// 第四部分：统一集成接口
// ====================================================================

const ZiweiBridge = {

  /**
   * 解析单个角色的星轨数据
   * @param {string} bioText - 角色小传
   * @returns {Object} 完整的角色星轨数据
   */
  parseCharacter(bioText) {
    const parsed = ZiweiDataExtractor.parse(bioText);
    
    // 如果有命盘数据，计算卦象推荐
    let hexagramRecommendation = [];
    if (parsed.chart && (parsed.chart.mingGong || parsed.chart.sihua?.length)) {
      hexagramRecommendation = ChartToHexagram.recommendHexagram(parsed.chart);
    }

    return {
      ...parsed,
      hexagramRecommendation,
      timestamp: Date.now()
    };
  },

  /**
   * 批量解析所有角色的星轨数据
   * @param {Array} characters - 角色数组 [{name, content}, ...]
   * @returns {Array} 增强后的角色数组
   */
  parseAllCharacters(characters) {
    return characters.map(char => ({
      ...char,
      ziweiData: this.parseCharacter(char.content || '')
    }));
  },

  /**
   * 分析角色关系网络
   * @param {Array} relationships - 关系数组
   * @param {Array} characters - 增强后的角色数组（含ziweiData）
   * @returns {Object} 关系分析结果
   */
  analyzeRelationships(relationships, characters) {
    const results = [];

    for (const rel of relationships) {
      const char1 = characters[rel.from];
      const char2 = characters[rel.to];
      if (!char1 || !char2) continue;

      const types = rel.customTypes || [rel.customType || '未知'].flat();

      for (const type of types) {
        // 星宿关系映射
        const xiuRelation = RelationToYiXue.mapToXiuRelation(
          type,
          char1.ziweiData,
          char2.ziweiData
        );

        // 六壬事件链
        const conflictChain = RelationToYiXue.mapToLiuren(type, {
          ghost: char1.ziweiData?.arc?.ghost || '',
          lie: char1.ziweiData?.arc?.lie || '',
          sihua: char1.ziweiData?.chart?.sihua || []
        });

        results.push({
          from: char1.name,
          to: char2.name,
          relationType: type,
          xiuRelation,
          conflictChain
        });
      }
    }

    // 奇门遁甲整体格局分析
    const qimenAnalysis = RelationToYiXue.mapToQimen(relationships, characters);

    return {
      relationships: results,
      qimen: qimenAnalysis
    };
  },

  /**
   * 为 plotGenerator.js 提供集成接口
   * 增强现有的 matchSkills / extractCharacterArc 函数
   * @param {Array} characters - 角色数组
   * @param {Array} relationships - 关系数组
   * @returns {Object} 增强的剧情生成上下文
   */
  getEnhancedContext(characters, relationships) {
    // 解析角色星轨数据
    const enhancedChars = this.parseAllCharacters(characters);

    // 分析关系网络
    const relAnalysis = this.analyzeRelationships(relationships, enhancedChars);

    // 提取星轨要素
    const ziweiElements = {
      // 命理信息
      heroChart: enhancedChars[0]?.ziweiData?.chart || {},
      heroArc: enhancedChars[0]?.ziweiData?.arc || {},
      heroHexagrams: enhancedChars[0]?.ziweiData?.hexagramRecommendation || [],

      // 关系映射
      xiuRelations: relAnalysis.relationships.map(r => r.xiuRelation),
      qimenGate: relAnalysis.qimen.primaryGate,
      qimenStrategies: relAnalysis.qimen.strategies,

      // 冲突事件链
      conflictChains: relAnalysis.relationships.map(r => r.conflictChain),

      // 所有角色的卦象推荐
      allHexagrams: enhancedChars.map(c => ({
        name: c.name,
        hexagrams: c.ziweiData?.hexagramRecommendation || []
      }))
    };

    return {
      characters: enhancedChars,
      relationshipAnalysis: relAnalysis,
      ziweiElements,
      // 向后兼容：保持原有数据结构
      originalCharacters: characters,
      originalRelationships: relationships
    };
  },

  /**
   * 生成角色星轨分析报告（用于展示）
   * @param {Object} ziweiData - 角色的星轨数据
   * @param {string} charName - 角色名
   * @returns {string} 格式化的分析报告
   */
  generateReport(ziweiData, charName) {
    if (!ziweiData) return `${charName}：无星轨数据`;

    const lines = [`【${charName}·星轨分析】`, ''];

    // 命盘信息
    if (ziweiData.chart) {
      const c = ziweiData.chart;
      lines.push('命盘信息：');
      if (c.mingGong) lines.push(`  命宫主星：${c.mingGong}`);
      if (c.fuDeGong) lines.push(`  福德宫：${c.fuDeGong}`);
      if (c.fuQiGong) lines.push(`  夫妻宫：${c.fuQiGong}`);
      if (c.sihua?.length) lines.push(`  四化：${c.sihua.join(' ')}`);
      if (c.daXian) lines.push(`  大限：${c.daXian}`);
      if (c.liuNian) lines.push(`  流年：${c.liuNian}`);
      lines.push('');
    }

    // 弧光数据
    if (ziweiData.arc) {
      const a = ziweiData.arc;
      lines.push('角色弧光：');
      if (a.want) lines.push(`  Want（显性欲望）：${a.want}`);
      if (a.need) lines.push(`  Need（真实需求）：${a.need}`);
      if (a.ghost) lines.push(`  Ghost（灵魂创伤）：${a.ghost}`);
      if (a.lie) lines.push(`  Lie（核心信念）：${a.lie}`);
      if (a.flaw) lines.push(`  Flaw（性格缺陷）：${a.flaw}`);
      if (a.arc) lines.push(`  弧光类型：${a.arc}`);
      lines.push('');
    }

    // 气质
    if (ziweiData.appearance) {
      const ap = ziweiData.appearance;
      lines.push('气质特征：');
      if (ap.temperament) lines.push(`  气质类型：${ap.temperament}`);
      if (ap.aura) lines.push(`  气场：${ap.aura}`);
      lines.push('');
    }

    // 卦象推荐
    if (ziweiData.hexagramRecommendation?.length) {
      lines.push('推荐卦象（按匹配度排序）：');
      for (const hex of ziweiData.hexagramRecommendation.slice(0, 3)) {
        lines.push(`  ${hex.name}（第${hex.number}卦）- ${hex.desc} [${hex.score}分]`);
      }
    }

    return lines.join('\n');
  }
};


// ====================================================================
// 第五部分：导出与全局注册
// ====================================================================

// 全局注册（在浏览器环境中可用）
if (typeof window !== 'undefined') {
  window.ZiweiDataExtractor = ZiweiDataExtractor;
  window.ChartToHexagram = ChartToHexagram;
  window.RelationToYiXue = RelationToYiXue;
  window.ZiweiBridge = ZiweiBridge;
}

// Node.js/CommonJS 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ZiweiDataExtractor,
    ChartToHexagram,
    RelationToYiXue,
    ZiweiBridge
  };
}
