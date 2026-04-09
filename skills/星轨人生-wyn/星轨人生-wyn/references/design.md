# 星轨人生产品设计

## 核心功能

### 1. 排盘输入
- 出生日期（农历）
- 出生时辰
- 性别
- 当年运势

### 2. 命盘输出
- 12宫位
- 14主星
- 108辅星
- 四化飞星

### 3. 角色生成
- 8维度性格
- 7段人生弧光
- 人物小传

### 4. 对比功能
- 2-3人配对
- 相性评分

## 技术栈
- 前端：React + Tailwind
- 算法：纯JS
- 存储：localStorage
- 部署：Vercel/GitHub Pages

## 接口设计

```javascript
function generateChart(data) {
  // 返回完整命盘
}
function compareCharts(charts) {
  // 返回相性分析
}
function generateBio(chart, profile) {
  // 返回人物小传
}
```