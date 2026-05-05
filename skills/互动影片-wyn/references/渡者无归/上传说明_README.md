# 渡者无归 — 手动上传 GitHub 说明

## 文件位置
打包文件已生成：`/mnt/agents/output/渡者无归_互动叙事_当前版本.zip`（约 50MB）

## 当前环境限制
当前沙盒环境无法直接访问 GitHub（网络不可达），因此无法自动推送。请按以下步骤手动上传。

## 上传步骤

### 方式一：GitHub 网页直接拖拽（最快）
1. 下载 zip 包并解压，你会得到一个 `app/` 文件夹。
2. 进入你的仓库：https://github.com/732642856/wangzhan
3. 点击 **"Add file" → "Upload files"**
4. 把 `app/` 文件夹里的所有文件拖拽到上传区：
   - `index.html`
   - `Node_01_门前的异类.png`
   - `Node_S02_玉碎之问.png`
   - `Node_S03_汉骨.png`
   - `Node_D1_溺亡的镜子.png`
   - `Node_D2_战死的卷宗.png`
   - `Node_D3c_共振三角.png`
   - `Node_D3c1_歌姬返场.png`
   - `Node_D3c1b_横梁上的手.png`
   - `视频Node_01_门前的异类.mp4`
   - `A01`~`A09` 音频文件
5. 填写 commit message，例如：`Upload 渡者无归 interactive narrative`
6. 点击 **"Commit changes"**

### 方式二：Git 命令行（如果你本地有仓库）
```bash
git clone https://github.com/732642856/wangzhan.git
cd wangzhan
# 把 app/ 里的文件全部复制进来
cp -r /path/to/app/* .
git add .
git commit -m "Upload 渡者无归 interactive narrative"
git push origin main
```

## 启用 GitHub Pages（部署在线预览）
1. 进入仓库 → **Settings** → **Pages**
2. Source 选择 **Deploy from a branch**
3. Branch 选择 **main** / **master**，文件夹选择 `/ (root)`
4. 点击 Save
5. 等待 1-2 分钟，页面会生成一个 `https://732642856.github.io/wangzhan/` 的链接

## 文件清单（19 个文件）
| 文件 | 类型 | 说明 |
|------|------|------|
| index.html | 网页 | 主入口，包含所有 CSS/JS/场景逻辑 |
| Node_01_门前的异类.png | 背景图 | 序章 |
| Node_S02_玉碎之问.png | 背景图 | 玉碎之问 + 内化节点 |
| Node_S03_汉骨.png | 背景图 | 汉骨 |
| Node_D1_溺亡的镜子.png | 背景图 | 溺亡 |
| Node_D2_战死的卷宗.png | 背景图 | 卷宗 |
| Node_D3c_共振三角.png | 背景图 | 共振三角 |
| Node_D3c1_歌姬返场.png | 背景图 | 歌姬返场 |
| Node_D3c1b_横梁上的手.png | 背景图 | 横梁 |
| 视频Node_01_门前的异类.mp4 | 视频 | Node_01 动态背景 |
| A01全局底层环境氛围循环背景音.mp3 | 音频 | 全局环境音 |
| A02Node_01玉佩共鸣触发音.mp3 | 音频 | 玉佩触发 |
| A03Node_01 : S02黑线灼烧压迫音效.mp3 | 音频 | 压迫音效 |
| A04Node_S02 : S03记忆闪回事件音效.mp3 | 音频 | 闪回音效 |
| A05Node_S03汉骨ambience循环背景音.mp3 | 音频 | 汉骨氛围 |
| A06Node_D1溺亡水滴亡魂特征音.mp3 | 音频 | 溺亡水声 |
| A07Node_D3c1剧场环境循环背景音.mp3 | 音频 | 剧场环境 |
| A08Node_D3c1歌姬人声人声处理参数.mp3 | 音频 | 歌姬人声 |
| A09Node_S04终幕仪式崩解事件音.mp3 | 音频 | 终幕崩解 |

## 明日待修复清单
根据你的反馈，以下是明天继续修改的内容：
1. **互动错误修复** — 检查各节点热区逻辑（D3c 共振三角选择后跳转、S03c 血擦判定等）
2. **音频开关** — 添加全局静音/音量控制按钮
3. **其他细节** — 你提到的 "很多互动有错误"，请具体描述哪些节点异常，方便精准定位
