# 天马黑珍珠内容索引站

这是一个可直接托管到 GitHub Pages 的静态网站，用来展示和筛选「天马黑珍珠」社群内容。

## 已包含能力

- 按关键词搜索标题、作者、分类、期数、备注
- 按年份、作者、期数、类型筛选
- 按主题分类快速切换
- 支持“只看精华”“只看有备注”
- 点击卡片查看详情，跳转原始星球链接

## 文件结构

- `index.html`：页面入口
- `assets/styles.css`：页面样式
- `assets/app.js`：前端交互
- `assets/content-data.js`：站点数据
- `scripts/build_data.py`：CSV 转站点数据脚本

## 更新数据

在项目目录运行：

```bash
python3 ./scripts/build_data.py \
  "/你的路径/知识星球内容索引1.csv" \
  "/你的路径/知识星球内容索引2.csv"
```

运行后会自动更新 `assets/content-data.js`。

## 发布到 GitHub Pages

1. 在 GitHub 新建一个仓库。
2. 把 `tianma-heizhenzhu-site` 目录里的全部文件上传到仓库根目录。
3. 进入 GitHub 仓库 `Settings` → `Pages`。
4. 在 `Build and deployment` 里选择 `Deploy from a branch`。
5. 分支选择 `main`，目录选择 `/ (root)`。
6. 保存后等待几分钟，GitHub 会生成公开访问链接。

## 备注

如果你后面又从飞书或知识星球导出了新的 CSV，我们只需要重新运行一次 `build_data.py`，站点内容就会同步更新。
