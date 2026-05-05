#!/bin/bash
# 星轨体系 EvalView 测试套件运行器
# 用法：bash run-tests.sh [snapshot|check|since|list]

EVALVIEW="python3 -m evalview"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR"

case "$1" in
  snapshot)
    echo "=== 星轨体系 — 建立 Baseline ==="
    echo ""
    echo "测试文件："
    ls -1 *.yaml | nl
    echo ""
    echo "共 $(ls -1 *.yaml | wc -l | tr -d ' ') 个测试用例"
    echo ""
    echo "注意：完整的 snapshot 需要配置 Agent 端点。"
    echo "当前测试用例已就绪，可通过以下方式运行："
    echo ""
    echo "  1. 对接 WorkBuddy API 后运行 snapshot"
    echo "  2. 使用 evalview simulate --record 录制真实交互"
    echo "  3. 使用 Python API gate() 编程式运行"
    echo ""
    echo "测试覆盖："
    echo "  01  绿灯评估阶段"
    echo "  02  灵感开发阶段"
    echo "  03  人物工厂阶段"
    echo "  04  结构建设阶段"
    echo "  05  剧本会诊阶段"
    echo "  06  技能路由准确性"
    echo "  07  知识资产调用"
    echo "  08  反模式检测"
    echo "  09  记忆一致性"
    echo "  10  互动影片工作流"
    ;;
  check)
    echo "=== 星轨体系 — 回归检查 ==="
    $EVALVIEW check --test-dir "$SCRIPT_DIR"
    ;;
  since)
    echo "=== 星轨体系 — 变更概览 ==="
    $EVALVIEW since
    ;;
  list)
    echo "=== 星轨体系 — 测试清单 ==="
    for f in *.yaml; do
      name=$(grep "^name:" "$f" | head -1 | sed 's/name: *//')
      desc=$(grep "^description:" "$f" | head -1 | sed 's/description: *//')
      echo "  $f"
      echo "    名称: $name"
      echo "    说明: $desc"
      turns=$(grep -c "query:" "$f")
      echo "    轮次: $turns"
      echo ""
    done
    ;;
  *)
    echo "星轨体系 EvalView 测试套件"
    echo ""
    echo "用法: bash run-tests.sh <命令>"
    echo ""
    echo "命令:"
    echo "  list      列出所有测试用例"
    echo "  snapshot  建立 baseline"
    echo "  check     运行回归检查"
    echo "  since     查看最近变更"
    echo ""
    echo "测试覆盖 10 个维度，$(ls -1 "$SCRIPT_DIR"/*.yaml | wc -l | tr -d ' ') 个用例"
    ;;
esac
