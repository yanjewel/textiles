# Cloudflare Git 部署说明

## 这次线上图片消失的原因

我联网检查了 `https://dawn-recipe-5f61.junyan911s.workers.dev/`：

- 首页 `/`：200，页面已部署成功。
- `styles.css`：200，样式已部署成功。
- 图片、产品图、工厂图、视频路径：404。

说明问题不是页面坏了，而是 Git/Cloudflare 发布时没有把素材目录一起发布，或者中文目录路径没有正确进入线上静态资源目录。线上页面还在引用 `独立站材料/图片/...`，但服务器上没有这些文件。

我已经把线上资源改成更稳定的英文路径：

- 图片：`assets/images/...`
- 视频：`assets/videos/...`
- 封面中英文切换图：`assets/images/brand/hero-en.png`、`assets/images/brand/hero-zh.png`

后面 Git 部署时，请确保 `assets` 文件夹一起提交。

## 推荐方式：Cloudflare Pages 连接 Git

1. 把项目推送到 GitHub。
2. 打开 Cloudflare Dashboard。
3. 进入 `Workers & Pages`。
4. 选择 `Pages`，点击连接 Git。
5. 选择你的 GitHub 仓库。
6. 构建设置：
   - Framework preset：`None`
   - Build command：`exit 0`
   - Build output directory：`cloudflare-git-dist`
7. 保存并部署。

## 第一次推送到 GitHub 的命令

当前推荐只把干净发布目录提交给 Cloudflare：

```bash
git init
git add cloudflare-git-dist CLOUDFLARE_DEPLOY.md .gitignore
git commit -m "Deploy textile website to Cloudflare"
git branch -M main
git remote add origin https://github.com/你的账号/你的仓库名.git
git push -u origin main
```

如果你希望 GitHub 里也保留可编辑源文件，可以额外提交这些文件：

```bash
git add index.html styles.css script.js analytics.js visitor-stats.html _headers assets
git commit -m "Add editable website source"
git push
```

`.gitignore` 已经排除了 `独立站材料/`、`cloudflare-dist/` 和 zip 包，避免营业执照或未使用素材被误提交。

## 如果继续使用 Workers 静态资源

你当前线上域名是 `workers.dev`，更像是 Workers 项目，不是 Pages 默认的 `pages.dev`。

如果继续走 Workers，请在 Cloudflare 的静态资源设置里确认发布目录包含这些文件：

- `index.html`
- `styles.css`
- `script.js`
- `analytics.js`
- `visitor-stats.html`
- `_headers`
- `assets/`

最稳妥的发布目录是 `cloudflare-git-dist`。

## 已生成的发布包

- `cloudflare-git-dist/`：干净的 Git/Cloudflare 发布目录。
- `textiles-cloudflare-git.zip`：干净压缩包，约 29 MB。

## 上线后建议

- 在 Cloudflare Pages 里绑定正式域名。
- 开启 Cloudflare Web Analytics，用于正式线上访客统计。
- WhatsApp 已配置：`+86 13735172341`。
- 发布目录不包含营业执照文件。
