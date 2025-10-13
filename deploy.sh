#!/usr/bin/env sh

# 发生错误时中止
set -e

# 删除 dist 目录
rm -rf dist

# 构建
npm run build

# 进入构建目录
cd dist

# 初始化 Git 并提交
git init
git add -A
git commit -m 'deploy to GitHub Pages'

# 推送到 gh-pages 分支
git push -f git@github.com:kong0836/vue2.git master:gh-pages
cd -
