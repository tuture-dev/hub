# 图雀社区主站

本项目是一个 Hexo 博客，这里汇集了由社区贡献的、通过 [Tuture](https://github.com/tuture-dev/tuture) 工具写成的优质实战教程。

> **🇨🇳目前仅支持中文教程！Currently only Chinese tutorials are supported!**

## 本地查看

首先确保本地已安装 tuture，如果没有则通过 `npm install -g tuture` 安装。然后将仓库克隆到本地（包括所有 Git 子模块）：

```bash
$ git clone --recurse-submodules https://github.com/tuture-dev/hub.git
```

进入仓库，安装 npm 依赖：

```bash
cd hub
npm install
```

下载所有学习路线和教程，并构建（需要几分钟的时间）：

```bash
$ npm run download
$ npm run build:roadmaps
$ npm run build:tutorials
```

最后打开 hexo 服务器：

```bash
$ npm start
```

然后访问 `localhost:5000` 即可在本地查看图雀社区主站啦！（⚠️注意：搜索功能无法使用）

## 常见问题（FAQs）

我们对常见的问题都进行了解答，请访问[图雀社区 FAQ](https://tuture.co/FAQ/)。

## 贡献教程

首先，非常感谢你选择分享教程！分享教程非常容易，请阅读[分享教程指南](https://docs.tuture.co/guide/sharing.html)。

## 关注我们

想要第一时间获取最新教程的通知？不妨关注我们的微信公众号吧：

![](https://tuture.co/uploads/wechat-qcode.png)
