# 长期记忆

## 一楠的工作方式与意图理解

### 意图识别原则
- 一楠说"做紫微斗数相关的东西"，意思是**做一个工具 App**，不是帮他生成示例内容
- **一楠提需求时，先判断他要做"产品/工具"还是要"内容/输出"，不确定时直接问，不要自己脑补**

### 技能主动调用原则
- 一楠有一个 Skill：**「紫微斗数角色设计（144命盘版）」**，只要涉及角色设计/人物命盘/紫微斗数，**必须主动调用**
- 涉及小说/剧本创作的其他 Skill，也应主动判断场景后调用

## 代码质量教训（星轨人生积累）
- 多模块拼合前，必须先统一接口约定（函数名、DOM id、变量名、参数类型）
- 普通 `<script>` 标签加载 JS 时，**绝对不能有 `export/import` 语句**，否则全崩
- `const` 全局声明会互相冲突，多文件拼合时用 `var` 或 IIFE 包裹
- **`alert()` 在 iOS WKWebView 里会被静默屏蔽**，一律用 showToast 替代
- 说声"8000+种组合"不等于内容真的有差异——理论数和实际内容质量是两回事，不能用数字糊弄一楠

## 项目：星轨人生 iOS App

### 文件结构
- 主逻辑：`app-v2.js`，主样式：`styles-v2.css`
- 核心引擎：`ziwei-bio-core.js`（所有人物小传生成逻辑，挂为 `window._ziweiCoreGenerateBio`）
- iOS 打包：`ios/App/App/public/`（每次修改 www/ 后需同步，public/ 在 .gitignore 里，手动 cp）
- Repo: `https://github.com/732642856/star-track-life`
- Bundle ID: `com.yinan.xingguirensheng`，Team ID: `2DM78YY6PM`

### 生成函数接口（重要）
- `generateZiweiCharacterBio(userData, chart, attributes, sihuaType)` 挂在 `window._ziweiCoreGenerateBio`
- `userData` 字段：`{ name, gender(male/female), era(ancient/modern/contemporary), age(youth/middle/senior), profession(political/business/cultural/military/technical/other), family(wealthy/middle/poor/decline), socialClass(upper/middle/lower), parents(harmonious/strained/broken/loss), siblings(close/conflict/support/alone) }`
- `attributes` 字段：`{ appearance, speech, behavior, emotion, social, crisis, learning, growth }`（均为中文选项值）
- `app-v2.js` 里调用处：`socialClass: inputs.social`（注意：步骤2的"社会地位"叫`social`，8属性的"社交风格"也叫`social`，传给userData时用`socialClass`区分）

### 校验策略（2026-03-29 更新）
- **步骤2（基础信息）**：name/gender/age/profession/family/social/parents/siblings **全部硬拦截**，一项不填不让过（宫位推导基础）
- **步骤4（8属性）**：**软处理**，漏选的属性自动用该主星性格推导模糊描述（14主星各自独立兜底），不报错不拦截，仅轻提示「X项未选，对应内容以模糊风格呈现」

### 人物小传内容质量现状（2026-03-29 最新）
- **8属性全部叙事化**：speech/behavior/emotion/social/crisis/learning/growth 均通过 `_narrate*` 函数展开为角色行为模式描述，不再直接贴关键词
- **8属性未选兜底**：behavior/social/learning 三个函数新增14主星专属兜底描述（非通用废话）
- **5个基础信息字段接入真实宫位星曜**（2026-03-29 重大修复，commit `2b6245c`）：
  - `family` → 读取**田宅宫**（mingIdx+9）主星+四化
  - `parents` → 读取**父母宫**（mingIdx+11）主星+四化
  - `siblings` → 读取**兄弟宫**（mingIdx+1）主星+四化
  - `socialClass` → 读取**官禄宫**（mingIdx+8）主星+四化
  - `profession` → 读取**官禄宫**（mingIdx+8）主星+四化
  - 每个选项末尾附「命盘印证」注脚，显示真实宫位星曜推理，不同命盘生成不同内容
- **新增3个宫位工具函数**：`_getPalaceStars(chart, offset)` / `_getPalaceSihua(chart, offset)` / `_palaceNote(stars, sihua, palaceName)`
- **年龄×时代叙事化**：3年龄段×3时代=9种独立人生处境描述
- **职业×时代叙事化**：6职业×3时代=18种独立职业处境描述
- **差异化维度**：14主星×4四化×3时代×4格局×12宫位 = 8064种理论组合，且每个维度内容均独立编写（非共用）
- 最新commit：`7204ce1`，已推送
- **2026-03-29 追加修复**：① 女性角色「此刻状态」里的"他"→"她"（正则全局替换）；② 古代/近代角色不再显示"丙寅年·未时"这类当代干支时辰，仅现代角色保留时辰标注
- **2026-03-29 新功能**：角色对比页重构为全屏覆盖层，直接展示三列完整小传并排，每列独立滚动，顶部摘要条+戏剧关系分析，无需额外点击
- **2026-03-29 代词兜底**：`generateZiweiCharacterBio` 在 `return bio` 前新增全局代词替换（女性：所有"他"→"她"），彻底解决任何数据函数里残留男性代词的问题
- **2026-03-29 三项优化（commit 24974c0）**：
  - 生成小传时新增loading动效（星盘旋转图+脉冲文字"推算命盘星曜中…"），先showStep(5)再setTimeout 80ms生成
  - 小传末尾新增「九、角色语录」模块：3句专属台词（内心独白/对他人/面对命运），基于主星×四化×格局，同角色每次稳定
  - 对比页（2人时）新增命盘相性评分：0-100分+可视化进度条+多维评分（四化匹配/时代/年龄/性别），`_calcCompat` 函数在 app-v2.js
- **2026-03-29 修复与扩展（commit 76fd3c5）**：
  - loading动效修复：改用双rAF+300ms延迟（原80ms太短，生成同步覆盖了动效）
  - 相性评分扩展：从仅2人扩展为2/3人均显示，3人时自动呈现A×B、A×C、B×C三组配对分数
- **2026-03-29 对比页滚动修复（commit 66e6bb1）**：
  - 相性评分从顶部固定区域移到三列小传下方
  - 三列小传+相性评分包在cmp-body-scroll统一滚动容器，解决iOS对比页无法滑动的问题
  - 小传列标题改为sticky吸顶
- **2026-03-29 对比页滚动再修复（commit 00f1842）**：
  - 恢复每列独立overflow-y滚动（cmp-body-scroll方案破坏了列内独立滑动）
  - 相性评分追加到每列cmp-bio-col-body末尾，随列滑到底可见
- **2026-03-29 五项综合修复（commit 744af41）**：
  - 步骤2→3自动scrollIntoView到步骤3顶部，不再落在已保存角色区
  - 步骤5切换时自动scroll到顶部，loading动效可见
  - 删除角色弃用confirm()改为双击确认（iOS WKWebView屏蔽confirm会报错）
  - 角色保存上限从5提升到10
  - 对比页列滑动修复：height:100dvh+touch-action:pan-y+will-change:transform，清除重复CSS定义

### ⚠️ 历史教训（一楠明确强调过）
- **选项必须和宫位星曜挂钩**，不能只是叙事标签。之前多次改动只改了描述文字，没有真正接入 `chart.mainStars` + `chart.mingIdx` + `chart.fourTrans`，被一楠发现并批评。
- 凡是涉及用户选项→小传生成的改动，必须检查：该字段有没有真正读取对应宫位的星曜数据，而不只是用主星名称生成通用文字。

### 开机动画
- 头像 `spPopIn` 弹入 → `spRock` 微微摇晃衰减静止 → `whiteFlash` 白闪消失过渡到主界面
- 摇晃幅度：±1.5°（一楠要求，不可变大）

### 上架准备状态（2026-03-29）
- **已完成**：竖屏锁定、ITSAppUsesNonExemptEncryption=false、GitHub Secrets 9个全配、CI签名修复
- **待操作（一楠手动）**：App Store Connect 填年龄分级（全选否→4+）、定价免费、填简介/关键词、上传截图、填隐私政策 URL
- **隐私政策URL**：`https://732642856.github.io/star-track-life/privacy.html`
- **CI注意**：Apple Upload Limit 每天有上限，触顶后等重置再手动触发 Actions
- **2026-03-29 CI上传方式变更（commit 02637ba）**：
  - 原：`xcrun altool --apiKey`（App Store Connect API Key，触发了Upload Limit限制）
  - 新：`xcrun altool --username --password`（Apple ID + 应用专用密码）
  - 新增 GitHub Secrets：`APPLE_ID`=732642856@qq.com、`APPLE_ID_PASSWORD`=应用专用密码
  - 新增：IPA自动保存为artifact（retention 7天），即使上传失败也可手动下载用Transporter传
  - Apple ID：732642856@qq.com
- **2026-03-29 Upload limit 结论**：Apple 的 Upload limit 是针对 App 本身（不是账号/工具），无论用 API Key 还是 Apple ID + 应用专用密码，都受同一限制。触顶后必须等 24 小时。
- **Transporter 手动上传方案**：IPA 已在本地 Transporter 里（1.0(169)），明天北京时间 14:27 之后直接点「交付」即可
- **2026-03-29 换Bundle ID方案**：新Bundle ID `com.yinan.xinggui0`，App Store Connect 新建App条目（同名「星轨人生1.0」）。CI workflow 改为只打包+保存artifact，不自动上传。上传由一楠手动决定时机。
- **重要教训**：CI不可在代码未最终确认时反复触发上传，会耗尽Apple每日Upload Limit。今后上传步骤必须由一楠明确授权后才执行。

### 打包方式
- **GitHub Actions 云端打包**（一楠电脑 Xcode 版本低，不用本地打包）
- 推送到 `main` 分支自动触发 `.github/workflows/ios-deploy.yml`

### 用户偏好（UI/动画）
- 头像不可变形/遮罩/叠加额外元素，只允许整体旋转/位移
- 转场风格：白闪（排斥漩涡、渐变等复杂特效）
- 动画克制、不夸张
