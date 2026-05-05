---
name: 星轨管家-wyn
description: "独立开发者App上架全流程助手。专为Mac/iOS应用开发者设计，覆盖App Store元数据生成、签名诊断、审核预审、发布文档。与星轨人生App配套使用最佳。Trigger: App Store上架、应用元数据、签名问题、审核检查、发布说明、版本管理。"
license: MIT-0
compatibility: "适用于 WorkBuddy / CodeBuddy Code / Cursor 等支持 Agent Skills 的工具。需要文件读写、网络搜索权限。"
metadata:
  author: wuyongnaren
  version: "1.0.0"
  language: zh-CN
  category: app-development
  tags: "App Store, 上架, 元数据, 签名, 审核, 发布, Mac应用, iOS, 独立开发者, 星轨人生"
xinggui:
  layer: product
  layer_name: "产品层"
  phase: [1, 6]
  invokes:
    - "故事引擎-wyn"
    - "tencent-docs"
  produces:
    - "App元数据(中英双语)"
    - "签名诊断报告"
    - "审核预检清单"
    - "版本发布说明"
    - "竞品分析报告"
---

# 星轨管家

独立开发者的App Store上架全流程助手。

---

## 核心定位

| 场景 | 能力 |
|---|---|
| **元数据生成** | App名称/副标题/关键词/描述/更新说明（中英双语） |
| **签名诊断** | 证书/Provisioning Profile故障排查、entitlements配置 |
| **审核预审** | 提交前自动检查清单、隐私政策合规、截图规范 |
| **发布文档** | PRD、竞品分析、版本发布说明、GitHub Release |

---

## 快速入口

| 用户说 | 执行 |
|---|---|
| "帮我准备上架" | 启动完整上架检查清单 |
| "生成元数据" | 输入App功能→输出完整元数据（中英） |
| "签名出错了" | 输入错误代码→诊断+解决方案 |
| "检查隐私政策" | 检查隐私政策链接/内容合规性 |
| "写发布说明" | 输入Git commit→生成用户友好更新日志 |
| "竞品分析" | 输入竞品名称→抓取App Store信息+对比表格 |

---

## 工作流

### 流程1：App Store元数据生成

**输入**：App核心功能、目标用户、差异化卖点
**输出**：
- 应用名称（30字符内）
- 副标题（30字符内）
- 关键词（100字符，中文逗号分隔）
- 应用描述（4000字符内，中英双语）
- 宣传文本（170字符内，促销用）
- 新功能说明（版本更新用）

**字符检查**：自动验证各字段长度限制

---

### 流程2：签名问题诊断

**常见错误代码对照**：

| 错误代码 | 含义 | 解决方案 |
|---|---|---|
| -8183 | Provisioning Profile解码失败 | 检查Secret是否为空、重新导入证书 |
| CSSMERR_TP_CERT_REVOKED | 证书被撤销 | 重新生成证书、更新Provisioning Profile |
| errSecInternalComponent | 钥匙串访问失败 | 解锁钥匙串、检查权限 |
| no identity found | 找不到签名身份 | 检查证书安装、确认Team ID匹配 |

**诊断步骤**：
1. 收集错误信息/日志
2. 匹配错误代码
3. 提供修复方案
4. 生成验证命令

---

### 流程3：审核预审清单

**提交前检查项**：

- [ ] 隐私政策链接可访问
- [ ] 隐私政策内容完整（数据收集/使用/共享/用户权利）
- [ ] 应用截图尺寸正确（6.5寸/5.5寸/iPad等）
- [ ] 截图内容符合审核规范
- [ ] 应用图标1024×1024无透明通道
- [ ] 元数据无占位符文本
- [ ] 测试账号已准备（如需要）
- [ ] 应用内购买已配置（如需要）

**App Store Review Guidelines对照**：
- 检查高风险条款（1.1/2.1/3.1等）
- 标记潜在问题点
- 提供修改建议

---

### 流程4：发布说明生成

**输入**：Git commit log 或功能列表
**输出**：
- 应用内更新说明（简洁版）
- App Store版本说明（详细版）
- 社交媒体宣传文案（微博/公众号/推特）
- 邮件通知文案

**格式**：
```
版本 X.X.X

✨ 新功能
- 功能A：描述

🔧 优化
- 优化项B：描述

🐛 修复
- 修复问题C：描述
```

---

### 流程5：竞品分析

**输入**：竞品App名称
**输出**：
- App Store/Google Play信息抓取
- 功能对比表格
- 用户评价关键词提取（好评/差评TOP10）
- 差异化建议

---

## 技术配置模板

### electron-builder.yml（Mac签名）

```yaml
appId: com.yinan.xingguirensheng
copyright: Copyright © 2026 yinan wu
productName: 星轨人生

asar: true

mac:
  target:
    - target: dmg
      arch: x64
    - target: zip
      arch: x64
  category: public.app-category.productivity
  icon: build/icon.icns
  identity: null  # 让electron-builder自动选择
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist

# 签名配置
sign: |
  if [ "$SIGN" = "true" ]; then
    echo "Signing with Developer ID..."
  else
    echo "Ad-hoc signing..."
  fi
```

### entitlements.mac.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.allow-dyld-environment-variables</key>
    <true/>
    <key>com.apple.security.automation.apple-events</key>
    <true/>
</dict>
</plist>
```

---

## 记忆管理

### 记录时机

| 事件 | 记录位置 | 内容 |
|---|---|---|
| 新App项目 | `.learnings/APPS.md` | App名称、Bundle ID、版本历史 |
| 签名问题解决 | `.learnings/SIGNING.md` | 错误代码、原因、解决方案 |
| 审核被拒 | `.learnings/REVIEW.md` | 拒绝原因、修改方案、申诉结果 |
| 版本发布 | `.learnings/RELEASES.md` | 版本号、发布时间、更新内容 |

---

## 使用示例

### 示例1：元数据生成

```
用户：帮我生成星轨人生的元数据
助手：了解！请提供以下信息：
1. App核心功能（一句话描述）
2. 目标用户群体
3. 主要差异化特点

用户：1. 角色关系管理与剧本创作工具
      2. 编剧、小说作者、内容创作者
      3. 离线使用、隐私优先、视觉化关系图谱

助手：【生成中...】

📱 应用名称：星轨人生 - 剧本创作与角色管理
📏 副标题：离线创作 · 关系图谱 · 隐私优先
🔑 关键词：剧本创作,小说写作,角色管理,故事大纲,离线写作,编剧工具,人物关系...
📝 描述：[中英文双语完整描述]
```

### 示例2：签名诊断

```
用户：我遇到-8183错误
助手：这是Provisioning Profile解码失败。

可能原因：
1. GitHub Secret为空或格式错误
2. Base64编码问题
3. 证书与Profile不匹配

修复步骤：
1. 检查Secrets中PROVISIONING_PROFILE是否设置
2. 重新导出并Base64编码
3. 验证：openssl base64 -d -in profile.b64 -out test.mobileprovision
```

---

## 关联技能

| 技能 | 协作方式 |
|---|---|
| `故事引擎-wyn` | App功能涉及创作工具时，调用故事引擎的创作能力 |
| `tencent-docs` | 生成文档后同步到腾讯文档 |
| `feishu-toolkit` | 发送上架通知到飞书 |

---

_专为独立开发者定制，特别适配星轨人生App的上架流程。_
