---
title: 凡是过往，皆为序章
date: 2024-01-07 19:20:16
tags:
- Hexo
- Node.js
- Github
categories:
- 时间之外的往事
---

以前基于 {% link Hexo https://hexo.io/zh-cn/ %} 与 Github Pages 搭建的博客已然长草多年了，最近心血来潮想重新拾掇一下，却发现以前使用 `hexo deploy` 的方式部署到 Github Pages 的博客只有静态文件，而原始的 Markdown 文件实在是找不到在哪了。这感觉就跟发现已经在线上跑了十年只有二进制包的程序有 bug 一样难受。

看来博客和程序一样，应该把源代码直接托管到 Github 上，才更方便持续维护。

于是花了一点时间把笔记本上一万年未更新的 Node.js 和 npm 升级了一下，安装了最新版本的 Hexo。最关键的一点是，把博客的部署方式改为使用 Github Actions 自动部署。具体配置方法可以参考 {% link 官方文档 https://hexo.io/zh-cn/docs/github-pages external %}。

有了基本的框架之后，大部分的时候写博客都可以直接在 Github 上完成，即便是在公司也可以愉快地 ~~摸鱼~~ 学习和沉淀了。

踏平坎坷成大道，斗罢艰险又出发！