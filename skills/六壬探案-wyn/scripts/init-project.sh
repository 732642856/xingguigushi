#!/bin/bash
# novel-generator 初始化脚本
# 用法：./init-novel.sh [小说名称]

NOVEL_NAME="${1:-新小说}"
OUTPUT_DIR="output"
LEARNINGS_DIR=".learnings"

echo "=========================================="
echo "  爽文小说生成器 - 初始化"
echo "=========================================="
echo ""

# 创建输出目录
if [ ! -d "$OUTPUT_DIR" ]; then
    echo "📁 创建输出目录: $OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR"
else
    echo "✅ 输出目录已存在: $OUTPUT_DIR"
fi

# 备份并重置 learnings 目录
if [ -d "$LEARNINGS_DIR" ]; then
    BACKUP_DIR="$LEARNINGS_DIR.backup_$(date +%Y%m%d_%H%M%S)"
    echo "📦 备份现有 learnings 到: $BACKUP_DIR"
    mv "$LEARNINGS_DIR" "$BACKUP_DIR"
fi

echo "📁 创建记忆目录: $LEARNINGS_DIR"
mkdir -p "$LEARNINGS_DIR"

# 初始化 CHARACTERS.md
cat > "$LEARNINGS_DIR/CHARACTERS.md" << 'EOF'
# 角色档案

## 主角

| 字段 | 内容 |
|------|------|
| 姓名 | |
| 年龄 | |
| 身份 | |
| 性格 | |
| 金手指 | |
| 初始状态 | |

## 主要配角

### 盟友/伙伴

### 对手/反派

### 情感线

---

## 角色状态追踪

| 角色 | 状态 | 等级/实力 | 位置 | 最后出现章节 |
|------|------|-----------|------|--------------|
|      |      |           |      |              |
EOF

# 初始化 LOCATIONS.md
cat > "$LEARNINGS_DIR/LOCATIONS.md" << 'EOF'
# 地点档案

## 已出现地点

| 地点名 | 类型 | 特点 | 首次出现章节 |
|--------|------|------|--------------|
|        |      |      |              |

## 势力范围

```
[势力地图]
```
EOF

# 初始化 PLOT_POINTS.md
cat > "$LEARNINGS_DIR/PLOT_POINTS.md" << 'EOF'
# 关键情节线

## 主线剧情

| 序号 | 情节 | 章节 | 状态 |
|------|------|------|------|
|      |      |      |      |

## 支线剧情

## 伏笔与回收

| 伏笔 | 埋下章节 | 回收章节 | 方式 |
|------|----------|----------|------|
|      |          |          |      |
EOF

# 初始化 STORY_BIBLE.md
cat > "$LEARNINGS_DIR/STORY_BIBLE.md" << 'EOF'
# 世界观设定

## 力量/等级体系

| 等级 | 名称 | 实力描述 |
|------|------|----------|
|      |      |          |

## 社会规则

## 核心设定

## 货币/资源体系
EOF

# 初始化 ERRORS.md
cat > "$LEARNINGS_DIR/ERRORS.md" << 'EOF'
# 失败记录

## 记录格式
如有错误，按以下格式记录：
```markdown
## [NOVEL-ERR-YYYYMMDD-XXX] 错误类型
**章节**:
**问题**:
**修正**:
```
EOF

# 提示用户输入小说方向
echo ""
echo "=========================================="
echo "  初始化完成！"
echo "=========================================="
echo ""
echo "📝 接下来请在 output/提示词.md 中描述你的小说方向"
echo ""
echo "示例："
echo "  - 都市+修仙+重生"
echo "  - 废柴少年获得系统后逆袭"
echo "  - 豪门千金被陷害后复仇"
echo ""
echo "输入格式示例："
echo "  题材：都市修仙"
echo "  主角：外卖员 → 修仙者"
echo "  金手指：神秘玉佩"
echo "  爽点：打脸富二代、收获女神"
echo ""

exit 0