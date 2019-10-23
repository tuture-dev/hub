# Tuture Hub

图雀社区教程合集！本项目是一个 hexo 博客，这里汇集了由社区贡献的、通过 [Tuture](https://tuture.co) 工具写成的优质实战教程。

**目前仅支持中文教程！Currently only Chinese tutorials are supported!**

## 本地查看

首先确保本地已安装 tuture，如果没有则通过 `npm install -g tuture` 安装。然后将仓库克隆到本地（包括所有 Git 子模块）：

```bash
$ git clone --recurse-submodules https://github.com/tutureproject/hub.git
```

进入仓库，安装 npm 包，构建所有教程：

```bash
$ cd hub
$ npm install
$ npm run buildTutorials
```

最后打开 hexo 服务器：

```bash
$ npm start
```

## 贡献教程

首先，非常感谢你选择分享教程！分享教程非常容易，只需按照以下步骤：

1. Fork 此仓库，并 clone 到本地：

```bash
$ git clone --recurse-submodules https://github.com/<username>/hub.git
```

`<username>` 是你的 GitHub 用户名。

2. 将你的教程仓库作为 Git 子模块添加到本项目的 tutorials 目录中：

```bash
$ git submodule add <repo_git_url> tutorials/<repo_name>
```

`<repo_git_url>` 是你仓库的 Git URL，`<repo_name>` 则是仓库的名称。

3. 本地运行并查看效果：

```bash
$ npm run buildTutorials
$ npm start
```

4. 推送分支，发起 Pull Request！如果通过我们的评审，这篇教程将被合并进主分支，并部署到 [Tuture Hub](https://tuture.co/hub)。
