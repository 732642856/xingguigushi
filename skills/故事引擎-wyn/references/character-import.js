/**
 * 星语 - 角色导入模块
 * ====================
 * 模块名称: character-import.js
 * 功能描述: 从星轨人生应用导入并解析人物小传JSON数据
 * 版本: 1.0.0
 * 
 * 本模块负责：
 * 1. 解析星轨人生导出的JSON格式人物小传
 * 2. 提取关键字段供64卦方案生成器使用
 * 3. 验证数据结构和完整性
 * 4. 提取编剧理论维度 (Want/Need/Ghost/Lie)
 * 5. 提取主星特质信息
 */

// ==================== 字段映射配置 ====================

/**
 * 字段映射表 - 处理不同版本和数据源的字段名称差异
 */
const FIELD_MAPPING = {
    // 基本信息
    name: ['name', 'characterName', 'character_name', '姓名', '角色名'],
    era: ['era', 'selectedEra', '时代', '年代'],
    gender: ['gender', 'sex', '性别'],
    age: ['age', '年龄', '角色年龄'],
    
    // 紫微斗数维度
    mainStars: ['mainStars', 'majorStars', '主星', '主星群'],
    palaces: ['palaces', '宫位', '十二宫'],
    fourTransforms: ['fourTransforms', '四化', 'sihua', 'sIHua'],
    
    // 编剧理论维度
    want: ['want', '欲望', 'want', 'Want', '渴望', 'surfaceWant'],
    need: ['need', '需要', 'need', 'Need', '深层需求', 'coreNeed'],
    ghost: ['ghost', '幽灵', 'ghost', 'Ghost', '内心恐惧', 'innerFear'],
    lie: ['lie', '谎言', 'lie', 'Lie', '错误信念', 'falseBelief'],
    
    // 性格与背景
    personalityTraits: ['personalityTraits', 'personality', '性格特质', '人格特质', 'traits'],
    background: ['background', '背景', '人生背景', '出身背景'],
    talents: ['talents', '天赋', '才能', '优势'],
    flaws: ['flaws', '缺陷', '弱点', '不足'],
    
    // 人生维度
    lifeTrajectory: ['lifeTrajectory', '人生轨迹', '命程', '发展轨迹'],
    emotionalPattern: ['emotionalPattern', '情感模式', '情绪模式', '感情模式'],
    career: ['career', '事业', '职业', '职业生涯'],
    turningPoints: ['turningPoints', '转折点', '关键节点', '人生转折'],
    conflicts: ['conflicts', '冲突', '矛盾', '核心冲突']
};

/**
 * 必需字段列表
 */
const REQUIRED_FIELDS = ['name'];

/**
 * 编剧维度必需字段
 */
const WNGL_REQUIRED = ['want', 'need', 'ghost', 'lie'];

/**
 * 主星列表 (14颗主星)
 */
const MAIN_STAR_LIST = [
    '紫微', '天机', '太阳', '武曲', '天同', '廉贞',
    '天府', '太阴', '贪狼', '巨门', '天相', '天梁',
    '七杀', '破军'
];

// ==================== 核心函数 ====================

/**
 * 解析星轨人生人物小传JSON数据
 * @param {string|Object} input - JSON字符串或对象
 * @returns {Object} 解析后的角色数据
 */
function parseCharacterBio(input) {
    let data;
    
    // 如果是字符串，尝试解析
    if (typeof input === 'string') {
        try {
            data = JSON.parse(input);
        } catch (error) {
            throw new Error(`JSON解析失败: ${error.message}`);
        }
    } else if (typeof input === 'object' && input !== null) {
        data = input;
    } else {
        throw new Error('输入必须是JSON字符串或对象');
    }
    
    // 提取关键字段
    return extractKeyFields(data);
}

/**
 * 从原始数据中提取关键字段
 * @param {Object} data - 原始数据对象
 * @returns {Object} 提取后的角色数据
 */
function extractKeyFields(data) {
    const extracted = {
        // 基本信息
        name: getFieldValue(data, 'name') || '未命名角色',
        era: getFieldValue(data, 'era') || '现代',
        gender: getFieldValue(data, 'gender') || '未指定',
        age: getFieldValue(data, 'age') || null,
        
        // 紫微斗数维度
        mainStars: extractArrayField(data, 'mainStars'),
        palaces: extractObjectField(data, 'palaces'),
        fourTransforms: extractFourTransforms(data),
        
        // 编剧理论维度
        want: getFieldValue(data, 'want'),
        need: getFieldValue(data, 'need'),
        ghost: getFieldValue(data, 'ghost'),
        lie: getFieldValue(data, 'lie'),
        
        // 性格与背景
        personalityTraits: extractArrayField(data, 'personalityTraits'),
        background: getFieldValue(data, 'background'),
        talents: extractArrayField(data, 'talents'),
        flaws: extractArrayField(data, 'flaws'),
        
        // 人生维度
        lifeTrajectory: getFieldValue(data, 'lifeTrajectory'),
        emotionalPattern: getFieldValue(data, 'emotionalPattern'),
        career: getFieldValue(data, 'career'),
        turningPoints: extractArrayField(data, 'turningPoints'),
        conflicts: extractArrayField(data, 'conflicts'),
        
        // 元数据
        metadata: {
            source: 'star-track-life',
            importTime: new Date().toISOString(),
            version: '1.0.0'
        }
    };
    
    return extracted;
}

/**
 * 获取字段值（支持多名称映射）
 * @param {Object} data - 数据对象
 * @param {string} fieldName - 字段名
 * @returns {*} 字段值
 */
function getFieldValue(data, fieldName) {
    const possibleNames = FIELD_MAPPING[fieldName] || [fieldName];
    
    for (const name of possibleNames) {
        if (data[name] !== undefined && data[name] !== null) {
            return data[name];
        }
    }
    
    return null;
}

/**
 * 提取数组字段
 * @param {Object} data - 数据对象
 * @param {string} fieldName - 字段名
 * @returns {Array} 数组值
 */
function extractArrayField(data, fieldName) {
    const value = getFieldValue(data, fieldName);
    
    if (Array.isArray(value)) {
        return value;
    }
    
    if (typeof value === 'string') {
        return value.split(/[,，;；]/).map(s => s.trim()).filter(s => s);
    }
    
    return [];
}

/**
 * 提取对象字段
 * @param {Object} data - 数据对象
 * @param {string} fieldName - 字段名
 * @returns {Object} 对象值
 */
function extractObjectField(data, fieldName) {
    const value = getFieldValue(data, fieldName);
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return value;
    }
    
    return {};
}

/**
 * 提取四化信息
 * @param {Object} data - 数据对象
 * @returns {Object} 四化数据
 */
function extractFourTransforms(data) {
    const transforms = getFieldValue(data, 'fourTransforms');
    
    if (typeof transforms === 'object' && transforms !== null) {
        return {
            lu: transforms.lu || transforms.禄 || null,
            quan: transforms.quan || transforms.权 || null,
            ke: transforms.ke || transforms.科 || null,
            ji: transforms.ji || transforms.忌 || null
        };
    }
    
    return { lu: null, quan: null, ke: null, ji: null };
}

// ==================== 验证函数 ====================

/**
 * 验证角色数据完整性
 * @param {Object} character - 角色数据
 * @returns {Object} 验证结果
 */
function validateCharacterBio(character) {
    const errors = [];
    const warnings = [];
    
    // 检查必需字段
    for (const field of REQUIRED_FIELDS) {
        if (!character[field]) {
            errors.push(`缺少必需字段: ${field}`);
        }
    }
    
    // 检查编剧维度
    const missingWNGL = WNGL_REQUIRED.filter(field => !character[field]);
    if (missingWNGL.length > 0) {
        warnings.push(`缺少编剧维度字段: ${missingWNGL.join(', ')}，可能影响故事生成质量`);
    }
    
    // 检查主星
    if (!character.mainStars || character.mainStars.length === 0) {
        warnings.push('未检测到主星信息');
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        completeness: calculateCompleteness(character)
    };
}

/**
 * 计算数据完整度
 * @param {Object} character - 角色数据
 * @returns {number} 完整度百分比
 */
function calculateCompleteness(character) {
    const allFields = [
        'name', 'era', 'gender', 'age',
        'mainStars', 'palaces', 'fourTransforms',
        'want', 'need', 'ghost', 'lie',
        'personalityTraits', 'background', 'talents', 'flaws',
        'lifeTrajectory', 'emotionalPattern', 'career', 'turningPoints', 'conflicts'
    ];
    
    let filledCount = 0;
    
    for (const field of allFields) {
        const value = character[field];
        if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value) && value.length === 0) continue;
            if (typeof value === 'object' && Object.keys(value).length === 0) continue;
            filledCount++;
        }
    }
    
    return Math.round((filledCount / allFields.length) * 100);
}

// ==================== 提取函数 ====================

/**
 * 提取Want/Need/Ghost/Lie编剧维度
 * @param {Object} character - 角色数据
 * @returns {Object} WNGL数据
 */
function extractWantNeedGhostLie(character) {
    return {
        want: character.want || '未定义',
        need: character.need || '未定义',
        ghost: character.ghost || '未定义',
        lie: character.lie || '未定义',
        
        // 分析
        analysis: {
            hasCompleteWNGL: !!(character.want && character.need && character.ghost && character.lie),
            conflictType: determineConflictType(character),
            arcType: determineArcType(character)
        }
    };
}

/**
 * 提取主星特质
 * @param {Object} character - 角色数据
 * @returns {Object} 主星特质分析
 */
function extractMainStarTraits(character) {
    const mainStars = character.mainStars || [];
    
    const traits = {
        primaryStar: mainStars[0] || null,
        secondaryStars: mainStars.slice(1),
        allStars: mainStars,
        
        // 主星分类
        categories: {
            leadership: mainStars.filter(s => ['紫微', '天府', '廉贞', '武曲'].includes(s)),
            wisdom: mainStars.filter(s => ['天机', '天梁', '天相'].includes(s)),
            expression: mainStars.filter(s => ['太阳', '巨门'].includes(s)),
            emotion: mainStars.filter(s => ['太阴', '天同', '贪狼'].includes(s)),
            action: mainStars.filter(s => ['七杀', '破军'].includes(s))
        },
        
        // 主导特质
        dominantTraits: analyzeDominantTraits(mainStars)
    };
    
    return traits;
}

/**
 * 分析主导特质
 * @param {Array} mainStars - 主星列表
 * @returns {Array} 主导特质列表
 */
function analyzeDominantTraits(mainStars) {
    const traitMap = {
        '紫微': ['权威', '领导力', '自尊心强'],
        '天机': ['智慧', '机敏', '多思'],
        '太阳': ['热情', '博爱', '光明磊落'],
        '武曲': ['刚毅', '务实', '执行力强'],
        '天同': ['温和', '福气', '随遇而安'],
        '廉贞': ['执着', '情感丰富', '追求完美'],
        '天府': ['稳重', '包容', '保守'],
        '太阴': ['细腻', '敏感', '内敛'],
        '贪狼': ['多才多艺', '欲望强', '适应力'],
        '巨门': ['口才', '研究', '是非'],
        '天相': ['公正', '服务', '注重形象'],
        '天梁': ['成熟', '照顾人', '原则性强'],
        '七杀': ['果断', '冒险', '开创'],
        '破军': ['变革', '破坏重建', '不按常理']
    };
    
    const traits = [];
    for (const star of mainStars) {
        if (traitMap[star]) {
            traits.push(...traitMap[star]);
        }
    }
    
    return [...new Set(traits)]; // 去重
}

/**
 * 确定冲突类型
 * @param {Object} character - 角色数据
 * @returns {string} 冲突类型
 */
function determineConflictType(character) {
    if (!character.want || !character.need) return '未知';
    
    const want = character.want.toLowerCase();
    const need = character.need.toLowerCase();
    
    if (want.includes('权力') && need.includes('爱')) return '权力与情感的冲突';
    if (want.includes('成功') && need.includes('平静')) return '野心与安宁的冲突';
    if (want.includes('自由') && need.includes('责任')) return '自由与责任的冲突';
    if (want.includes('保护') && need.includes('放手')) return '控制与放手的冲突';
    
    return '内在价值观冲突';
}

/**
 * 确定弧线类型
 * @param {Object} character - 角色数据
 * @returns {string} 弧线类型
 */
function determineArcType(character) {
    if (!character.lie || !character.need) return '未知';
    
    const lie = character.lie.toLowerCase();
    
    if (lie.includes('独自') || lie.includes('一个人')) return '从孤独到连接';
    if (lie.includes('强大') || lie.includes('力量')) return '从控制到信任';
    if (lie.includes('完美') || lie.includes('最好')) return '从完美主义到接纳';
    if (lie.includes('安全') || lie.includes('保护')) return '从防御到脆弱';
    
    return '从错误信念到真理';
}

// ==================== 批量处理 ====================

/**
 * 批量解析多个角色
 * @param {Array} inputs - 多个角色数据
 * @returns {Array} 解析后的角色数组
 */
function parseMultipleCharacters(inputs) {
    if (!Array.isArray(inputs)) {
        throw new Error('输入必须是数组');
    }
    
    return inputs.map((input, index) => {
        try {
            const character = parseCharacterBio(input);
            return {
                index: index + 1,
                success: true,
                character,
                validation: validateCharacterBio(character)
            };
        } catch (error) {
            return {
                index: index + 1,
                success: false,
                error: error.message
            };
        }
    });
}

// ==================== 导出 ====================

module.exports = {
    // 核心函数
    parseCharacterBio,
    parseMultipleCharacters,
    
    // 验证函数
    validateCharacterBio,
    calculateCompleteness,
    
    // 提取函数
    extractWantNeedGhostLie,
    extractMainStarTraits,
    
    // 常量
    FIELD_MAPPING,
    REQUIRED_FIELDS,
    WNGL_REQUIRED,
    MAIN_STAR_LIST
};
