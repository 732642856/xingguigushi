/**
 * worldview-story-engine.js
 * ─────────────────────────────────────────────────────────────────────
 * 世界观故事引擎 - 整合25维度世界观标签库
 * 
 * 功能：
 * 1. 提供世界观维度选择接口
 * 2. 世界观×紫微斗数主星映射
 * 3. 世界观×编剧理论整合
 * 4. 生成世界观背景设定
 * 
 * 版本：v1.0  日期：2026-04-09
 */

;(function(global) {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────
    // 25维度世界观标签库（精简版，完整版见JSON文件）
    // ─────────────────────────────────────────────────────────────────────

    const WORLDVIEW_DIMENSIONS = {
        politics: {
            name: '政治',
            keywords: ['政权', '体制', '权谋', '外交', '革命', '政变', '集权', '分权', '宫廷斗争', '权力交接'],
            conflicts: ['权力斗争', '派系之争', '改革vs保守', '集权vs分权'],
            scenes: ['宫廷夜宴', '密室谋划', '政变当晚', '国会质询'],
            themes: ['权力异化×初心迷失', '理想主义×政治妥协', '忠诚与背叛']
        },
        history: {
            name: '历史',
            keywords: ['王朝更迭', '历史恩怨', '文化遗产', '秘史野史', '历史周期律'],
            conflicts: ['历史恩怨', '文化传承', '历史修正'],
            scenes: ['博物馆', '考古现场', '族谱查阅', '历史剧拍摄'],
            themes: ['历史记忆×集体创伤', '文化遗产×身份认同']
        },
        economy: {
            name: '经济',
            keywords: ['通胀', '金融危机', '贫富差距', '货币战争', '泡沫经济', '资本外逃'],
            conflicts: ['贫富分化', '金融危机', '财富传承', '全球化冲击'],
            scenes: ['证券交易所', '银行金库', '工厂倒闭现场'],
            themes: ['贫富分化×阶层固化', '金融危机×家庭破碎']
        },
        business: {
            name: '商业',
            keywords: ['并购', '上市', '商战', '垄断', '融资', '对赌协议', '家族企业'],
            conflicts: ['商战', '融资危机', '控制权争夺', '代际传承'],
            scenes: ['董事会', 'IPO敲钟', '商业谈判', '并购现场'],
            themes: ['创业激情×现实碾压', '融资对赌×控制权丧失']
        },
        military: {
            name: '军事',
            keywords: ['军队', '战略', '战术', '军备竞赛', '征兵', '兵变'],
            conflicts: ['军令vs良心', '军民矛盾', '权力斗争'],
            scenes: ['军事基地', '作战指挥室', '阅兵场'],
            themes: ['军人荣誉×战争创伤', '征兵制度×公民义务']
        },
        war: {
            name: '战争',
            keywords: ['侵略', '内战', '游击战', '巷战', '战俘', '难民', '战后重建'],
            conflicts: ['战争罪行', '战俘困境', '战后和解'],
            scenes: ['战场前线', '难民营', '战俘营', '战后废墟'],
            themes: ['战场厮杀×人性泯灭', '战后重建×创伤修复']
        },
        law: {
            name: '法律',
            keywords: ['司法', '执法', '诉讼', '冤假错案', '法外之地', '司法腐败'],
            conflicts: ['程序vs实体正义', '司法腐败', '冤假错案'],
            scenes: ['法庭审判', '监狱', '律师事务所'],
            themes: ['程序正义×实体正义', '司法腐败×正义缺席']
        },
        religion: {
            name: '宗教',
            keywords: ['教派', '神权', '异端', '圣战', '信仰冲突', '宗教仪式'],
            conflicts: ['信仰冲突', '宗教狂热', '政教之争'],
            scenes: ['教堂/寺庙', '朝圣之路', '宗教审判'],
            themes: ['虔诚信仰×宗教狂热', '宗教宽容×圣战暴力']
        },
        philosophy: {
            name: '哲学',
            keywords: ['存在主义', '宿命论', '自由意志', '道德困境', '正义'],
            conflicts: ['自由意志vs决定论', '理想vs现实', '个体vs集体'],
            scenes: ['哲学系课堂', '伦理委员会'],
            themes: ['自由意志×决定论', '理想主义×现实主义']
        },
        culture: {
            name: '文化',
            keywords: ['传统文化', '亚文化', '文化认同', '文化冲突', '文化输出'],
            conflicts: ['传统vs现代', '文化认同危机', '文化输出vs霸权'],
            scenes: ['文化庆典', '非遗展览', '动漫展'],
            themes: ['文化认同×身份认同', '传统守护×现代冲击']
        },
        art: {
            name: '艺术',
            keywords: ['先锋艺术', '商业艺术', '艺术市场', 'NFT', '艺术洗钱'],
            conflicts: ['艺术vs商业', '创作自由vs审查'],
            scenes: ['美术馆', '拍卖行', '工作室'],
            themes: ['艺术追求×商业妥协', '先锋艺术×公众接受']
        },
        technology: {
            name: '科技',
            keywords: ['赛博朋克', '人工智能', '基因编辑', '科技伦理', '算法控制', '数字永生'],
            conflicts: ['科技vs伦理', 'AI权利', '隐私vs监控', '自动化失业'],
            scenes: ['实验室', '服务器机房', '赛博朋克夜城', '太空站'],
            themes: ['科技垄断×阶级固化', 'AI意识×人权', '基因编辑×伦理崩塌']
        },
        education: {
            name: '教育',
            keywords: ['应试教育', '精英教育', '学术垄断', '文凭通胀', '鸡娃'],
            conflicts: ['应试vs素质', '精英vs平民', '传统vs创新教育'],
            scenes: ['考场', '毕业典礼', '学术会议'],
            themes: ['应试焦虑×亲子关系', '精英教育×阶层固化']
        },
        media: {
            name: '传媒',
            keywords: ['舆论操控', '信息茧房', '假新闻', '算法推荐', '审查制度'],
            conflicts: ['新闻自由vs审查', '流量vs质量', '真相vs谎言'],
            scenes: ['新闻编辑室', '舆论监控室', '假新闻工厂'],
            themes: ['舆论引导×思想控制', '假新闻×信任危机']
        },
        society: {
            name: '社会',
            keywords: ['阶层固化', '城乡差距', '社会撕裂', '弱势群体', '社会运动'],
            conflicts: ['阶层矛盾', '城乡二元', '代际冲突'],
            scenes: ['高档社区', '贫民窟', '城中村', '社会运动现场'],
            themes: ['阶层固化×向上流动', '贫富分化×社会稳定']
        },
        folklore: {
            name: '民俗',
            keywords: ['婚丧嫁娶', '风水', '禁忌', '民间信仰', '宗族仪式'],
            conflicts: ['传统vs现代', '宗族vs个人'],
            scenes: ['婚礼现场', '祭祖', '庙会'],
            themes: ['宗族纽带×个人自由', '民间信仰×科学理性']
        },
        ethics: {
            name: '伦理道德',
            keywords: ['道德困境', '道德绑架', '忠诚', '背叛', '牺牲'],
            conflicts: ['道德两难', '忠诚vs背叛', '正义vs复仇'],
            scenes: ['伦理委员会', '道德审判'],
            themes: ['道德困境×两难抉择', '道德勇气×同流合污']
        },
        psychology: {
            name: '人性心理',
            keywords: ['创伤', '救赎', '认知偏差', '群体心理', '精神控制', '依恋类型'],
            conflicts: ['创伤vs疗愈', '个体vs群体', '真实vs面具'],
            scenes: ['心理咨询室', '精神病院', '群体聚集现场'],
            themes: ['创伤后应激×自我救赎', '人格面具×真实自我']
        },
        geography: {
            name: '地理环境',
            keywords: ['疆域', '要塞', '资源产地', '环境污染', '气候灾难'],
            conflicts: ['环境vs发展', '领土争端', '城乡矛盾'],
            scenes: ['边境哨所', '灾区现场', '资源城市'],
            themes: ['城市扩张×乡愁', '环境问题×代际正义']
        },
        resources: {
            name: '资源能源',
            keywords: ['资源诅咒', '能源转型', '粮食安全', '战略储备', '资源垄断'],
            conflicts: ['资源争夺', '能源转型vs失业', '当代vs后代'],
            scenes: ['油田', '粮食仓库', '战略储备库'],
            themes: ['资源诅咒×国家衰败', '能源转型×代际冲突']
        },
        healthcare: {
            name: '医疗健康',
            keywords: ['医患关系', '医疗腐败', '器官黑市', '瘟疫封城', '基因优选'],
            conflicts: ['医患矛盾', '生命vs金钱', '医疗公平'],
            scenes: ['急诊室', '瘟疫隔离区', '临终关怀室'],
            themes: ['医保覆盖×因病致贫', '器官黑市×道德困境']
        },
        crime: {
            name: '犯罪黑产',
            keywords: ['黑帮', '洗钱', '人口贩卖', '网络犯罪', '灰色产业'],
            conflicts: ['黑白边缘', '犯罪家族传承', '线人困境'],
            scenes: ['黑市', '地下赌场', '犯罪集团总部'],
            themes: ['黑吃黑×江湖规矩', '犯罪家族×金盆洗手']
        },
        family: {
            name: '家族宗族',
            keywords: ['继承权', '嫡庶', '家族斗争', '联姻', '族谱', '家训'],
            conflicts: ['继承之争', '嫡庶之分', '家族vs个人'],
            scenes: ['家族祠堂', '继承仪式', '家族婚礼'],
            themes: ['家族荣耀×个人追求', '继承之争×公平偏见']
        },
        emotion: {
            name: '情感人性',
            keywords: ['出轨', '利益婚姻', '三角关系', '亲情绑架', '执念'],
            conflicts: ['真爱vs利益', '出轨vs原谅', '亲情vs个人边界'],
            scenes: ['婚礼', '离婚法庭', '情感咨询'],
            themes: ['真爱×婚姻本质', '出轨×信任重建']
        },
        ideology: {
            name: '舆论意识形态',
            keywords: ['思想控制', '舆论战', '身份政治', '认知作战', '叙事战争'],
            conflicts: ['思想自由vs控制', '群体认同vs独立思考'],
            scenes: ['政治集会', '舆论战指挥部', '觉醒运动'],
            themes: ['思想自由×意识形态控制', '群体认同×独立思考']
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // 主星×世界观维度映射
    // ─────────────────────────────────────────────────────────────────────

    const STAR_TO_WORLDVIEW_MAP = {
        '紫微': {
            primary: ['politics', 'family', 'business'],
            secondary: ['history', 'law', 'ideology'],
            conflicts: ['权力斗争', '继承之争', '派系斗争']
        },
        '天机': {
            primary: ['technology', 'education', 'media'],
            secondary: ['philosophy', 'psychology'],
            conflicts: ['科技伦理', '信息控制', '认知作战']
        },
        '太阳': {
            primary: ['politics', 'society', 'ideology'],
            secondary: ['law', 'ethics'],
            conflicts: ['正义vs权力', '理想vs现实']
        },
        '武曲': {
            primary: ['military', 'war', 'business'],
            secondary: ['crime', 'resources'],
            conflicts: ['战争罪行', '商战', '资源争夺']
        },
        '天同': {
            primary: ['emotion', 'family', 'folklore'],
            secondary: ['psychology', 'ethics'],
            conflicts: ['情感纠葛', '家族责任', '个人幸福']
        },
        '廉贞': {
            primary: ['emotion', 'ethics', 'psychology'],
            secondary: ['law', 'crime'],
            conflicts: ['道德困境', '忠诚vs背叛', '情与法']
        },
        '天府': {
            primary: ['business', 'family', 'economy'],
            secondary: ['politics', 'resources'],
            conflicts: ['财富传承', '家族企业', '利益分配']
        },
        '太阴': {
            primary: ['emotion', 'art', 'culture'],
            secondary: ['psychology', 'folklore'],
            conflicts: ['情感依赖', '艺术追求vs生存', '传统vs现代']
        },
        '贪狼': {
            primary: ['crime', 'emotion', 'business'],
            secondary: ['art', 'media'],
            conflicts: ['欲望vs道德', '黑白边缘', '诱惑与底线']
        },
        '巨门': {
            primary: ['media', 'law', 'ideology'],
            secondary: ['psychology', 'technology'],
            conflicts: ['真相vs谎言', '言论自由vs审查', '隐私vs公开']
        },
        '天相': {
            primary: ['law', 'ethics', 'family'],
            secondary: ['politics', 'culture'],
            conflicts: ['公正vs人情', '传统vs变革', '个人vs集体']
        },
        '天梁': {
            primary: ['healthcare', 'education', 'religion'],
            secondary: ['ethics', 'psychology'],
            conflicts: ['生命vs金钱', '传统医学vs现代科技', '信仰vs理性']
        },
        '七杀': {
            primary: ['military', 'war', 'crime'],
            secondary: ['business', 'technology'],
            conflicts: ['暴力vs和平', '生存vs道德', '革命vs稳定']
        },
        '破军': {
            primary: ['war', 'technology', 'society'],
            secondary: ['politics', 'crime'],
            conflicts: ['变革vs保守', '破坏vs重建', '边缘vs主流']
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // 场景×世界观标签生成
    // ─────────────────────────────────────────────────────────────────────

    const SCENE_WORLDVIEW_TEMPLATES = {
        '宫廷政治': {
            dimensions: ['politics', 'history', 'family'],
            keywords: ['权力交接', '派系斗争', '外戚干政', '储君之争'],
            conflicts: ['嫡庶之分', '改革vs保守', '忠诚考验']
        },
        '现代商战': {
            dimensions: ['business', 'law', 'media'],
            keywords: ['并购', '商战', '舆论战', '法律攻防'],
            conflicts: ['利益vs道德', '控制权争夺', '家族vs职业经理人']
        },
        '科幻未来': {
            dimensions: ['technology', 'resources', 'society'],
            keywords: ['AI觉醒', '基因编辑', '资源枯竭', '阶层固化'],
            conflicts: ['科技vs伦理', '人机共存', '贫富差距']
        },
        '犯罪悬疑': {
            dimensions: ['crime', 'law', 'psychology'],
            keywords: ['黑帮', '卧底', '心理侧写', '连环案件'],
            conflicts: ['黑白边缘', '正义vs复仇', '线人困境']
        },
        '家族伦理': {
            dimensions: ['family', 'emotion', 'ethics'],
            keywords: ['继承权', '家族秘密', '代际冲突', '联姻'],
            conflicts: ['家族vs个人', '传统vs现代', '责任vs自由']
        },
        '社会现实': {
            dimensions: ['society', 'education', 'healthcare'],
            keywords: ['阶层固化', '应试焦虑', '医患矛盾', '社会运动'],
            conflicts: ['公平vs效率', '个人vs集体', '变革vs稳定']
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // 核心API
    // ─────────────────────────────────────────────────────────────────────

    const WorldviewStoryEngine = {
        
        /**
         * 获取世界观维度详情
         */
        getDimension(dimensionId) {
            return WORLDVIEW_DIMENSIONS[dimensionId] || null;
        },

        /**
         * 获取所有世界观维度
         */
        getAllDimensions() {
            return Object.keys(WORLDVIEW_DIMENSIONS).map(key => ({
                id: key,
                ...WORLDVIEW_DIMENSIONS[key]
            }));
        },

        /**
         * 根据主星获取推荐世界观维度
         */
        getDimensionsByStar(starName) {
            const mapping = STAR_TO_WORLDVIEW_MAP[starName];
            if (!mapping) return null;
            
            return {
                primary: mapping.primary.map(id => WORLDVIEW_DIMENSIONS[id]),
                secondary: mapping.secondary.map(id => WORLDVIEW_DIMENSIONS[id]),
                conflicts: mapping.conflicts
            };
        },

        /**
         * 根据场景类型获取世界观配置
         */
        getSceneTemplate(sceneType) {
            return SCENE_WORLDVIEW_TEMPLATES[sceneType] || null;
        },

        /**
         * 生成世界观背景设定
         */
        generateWorldviewSetting(options = {}) {
            const {
                dimensions = ['politics', 'society'],
                era = '现代',
                conflictLevel = '中等'
            } = options;

            const setting = {
                era,
                conflictLevel,
                dimensions: dimensions.map(id => WORLDVIEW_DIMENSIONS[id]),
                keywords: [],
                conflicts: [],
                themes: []
            };

            dimensions.forEach(id => {
                const dim = WORLDVIEW_DIMENSIONS[id];
                setting.keywords.push(...dim.keywords.slice(0, 3));
                setting.conflicts.push(...dim.conflicts.slice(0, 2));
                setting.themes.push(...dim.themes.slice(0, 1));
            });

            return setting;
        },

        /**
         * 生成人物与世界观的冲突
         */
        generateCharacterWorldviewConflict(starName, dimensionIds = []) {
            const starMapping = STAR_TO_WORLDVIEW_MAP[starName];
            if (!starMapping) return null;

            const allDimensions = [...starMapping.primary, ...starMapping.secondary];
            const selectedDimensions = dimensionIds.length > 0 
                ? dimensionIds.filter(id => allDimensions.includes(id))
                : starMapping.primary;

            const conflicts = [];
            selectedDimensions.forEach(dimId => {
                const dim = WORLDVIEW_DIMENSIONS[dimId];
                if (dim) {
                    conflicts.push({
                        dimension: dim.name,
                        conflict: dim.conflicts[Math.floor(Math.random() * dim.conflicts.length)],
                        theme: dim.themes[Math.floor(Math.random() * dim.themes.length)],
                        keywords: dim.keywords.slice(0, 3)
                    });
                }
            });

            return {
                star: starName,
                conflicts,
                recommendedScenes: conflicts.map(c => 
                    WORLDVIEW_DIMENSIONS[selectedDimensions[0]]?.scenes?.[0] || '待定'
                )
            };
        },

        /**
         * 搜索相关世界观维度
         */
        searchDimensions(query) {
            const results = [];
            Object.entries(WORLDVIEW_DIMENSIONS).forEach(([id, dim]) => {
                const matchScore = 
                    (dim.name.includes(query) ? 10 : 0) +
                    (dim.keywords.some(k => k.includes(query)) ? 5 : 0) +
                    (dim.conflicts.some(c => c.includes(query)) ? 3 : 0);
                
                if (matchScore > 0) {
                    results.push({ id, ...dim, matchScore });
                }
            });
            
            return results.sort((a, b) => b.matchScore - a.matchScore);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // 导出
    // ─────────────────────────────────────────────────────────────────────

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = WorldviewStoryEngine;
    } else if (typeof define === 'function' && define.amd) {
        define(() => WorldviewStoryEngine);
    } else {
        global.WorldviewStoryEngine = WorldviewStoryEngine;
    }

})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this);
