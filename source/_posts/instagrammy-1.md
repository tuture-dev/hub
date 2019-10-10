---
title: 从零开始用 Express + MongoDB 搭建图片分享社区（一）
comments: true
description: "在这篇教程中，我们将用 Node.js 中最流行的 Express 框架搭建一个类似 Instagram 的图片分享社区，数据库选用 MongoDB。本教程的代码改编自 Mithun Satheesh，Bruno Joseph D'mello 和 Jason Krol 的《Web Development with MongoDB and NodeJS: Second Edition》一书。"
tags: ["Node", "MongoDB"]
---

## 初始化项目结构

首先我们创建项目目录，并初始化 npm：

```bash
$ mkdir Instagrammy && cd Instagrammy
$ npm init
```

添加 express 的项目依赖：

```bash
$ npm install express
```

最终生成的 package.json 文件如下：

```json package.json
{
  "name": "instagrammy",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.17.1"
  }
}
```

然后编写服务器的入口文件 `{% raw %}server.js{% endraw %}`，内容如下：

```js server.js
const express = require('express');

app = express();
app.set('port', process.env.PORT || 3000);

app.get('/', function(req, res) {
  res.send('Hello World!');
});

app.listen(app.get('port'), function() {
  console.log(`Server is running on http://localhost:${app.get('port')}`);
});
```

通过 `{% raw %}node server.js{% endraw %}` 运行 server.js 文件，然后在浏览器中访问 [http://localhost:3000](http://localhost:3000)，便可以看到服务器的返回的 Hello World：

![](/images/figure-1.png)

## 配置中间件

Express 本身是一个非常简洁的 web 框架，但是通过中间件这一设计模式，能够实现非常丰富的功能。一个 Express 中间件本质上是一个函数：

```js
function someMiddleware(req, res, next) {}
```

`{% raw %}req{% endraw %}` 参数是一个 `{% raw %}express.Request{% endraw %}` 对象，封装了用户请求；`{% raw %}res{% endraw %}` 参数则是一个 `{% raw %}express.Response{% endraw %}` 对象，封装了即将返回给用户的响应；`{% raw %}next{% endraw %}` 则是在执行完所有逻辑后用于触发下一个中间件的函数。

添加中间件的代码则非常简单：

```js
app.use(middlewareA);
app.use(middlewareB);
app.use(middlewareC);
```

中间件 A、B、C 将会在处理每次请求时***按顺序执行***（这也意味着中间件的顺序是非常重要的）。接下来我们将添加以下基础中间件（也是几乎所有应用都会用到的中间件）：

- `{% raw %}morgan{% endraw %}`：用于记录日志的中间件，对于开发调试和生产监控都很有用；
- `{% raw %}bodyParser{% endraw %}`：用于解析客户端请求的中间件，包括 HTML 表单和 JSON 请求；
- `{% raw %}methodOverride{% endraw %}`：为老的浏览器提供 REST 请求的兼容性支持；
- `{% raw %}cookieParser{% endraw %}`：用于收发 cookie；
- `{% raw %}errorHandler{% endraw %}`：用于在发生错误时打印调用栈，***仅在开发时使用***；
- `{% raw %}handlebars{% endraw %}`：用于渲染用户界面的模板引擎，会在后面细讲。

我们通过 npm 安装这些中间件：

```bash
$ npm install express-handlebars body-parser cookie-parser morgan method-override errorhandler
```


创建 server 目录，在其中添加 configure.js 模块，用于配置所有的中间件：

```js server/configure.js
const path = require('path');
const exphbs = require('express-handlebars');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const methodOverride = require('method-override');
const errorHandler = require('errorhandler');

module.exports = function(app) {
  app.use(morgan('dev'));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser('secret-value'));
  app.use('/public/', express.static(path.join(__dirname, '../public')));

  if (app.get('env') === 'development') {
    app.use(errorHandler());
  }

  return app;
};
```

值得一提的是，除了上面提到的中间件，我们还用到了 express 自带的静态资源中间件 `{% raw %}express.static{% endraw %}`，用于向客户端发送图片、CSS等静态文件。最后，我们通过获取 `{% raw %}env{% endraw %}` 变量来判断是否处于开发环境，如果是的话就添加 `{% raw %}errorHandler{% endraw %}` 以便于调试代码。

在 server.js 中调用刚才用于配置中间件的代码：

```diff server.js
const express = require('express');
+ const configure = require('./server/configure');

app = express();
+ app = configure(app);
app.set('port', process.env.PORT || 3000);

app.get('/', function(req, res) {
```

## 搭建路由和控制器

现在我们已经配置好了基础的中间件，但是只有主页（URL 为 `{% raw %}/{% endraw %}`）可以访问。接下来我们将实现以下路由：

- `{% raw %}GET /{% endraw %}`：网站主页
- `{% raw %}GET /images/image_id{% endraw %}`：展示单张图片
- `{% raw %}POST /images{% endraw %}`：上传图片
- `{% raw %}POST /images/image_id/like{% endraw %}`：点赞图片
- `{% raw %}POST /images/image_id/comment{% endraw %}`：评论图片

虽然 Express 的项目结构没有固定的套路，但是我们将采用经典的 MVC 模式（即 Model View Controller）来搭建我们的项目。Model 定义了数据模型，View 定义了用户界面，而 Controller 则定义了相应的业务逻辑。

首先创建 controllers 目录，在其中创建 home.js 文件，并定义 `{% raw %}index{% endraw %}` 控制器如下：

```js controllers/home.js
module.exports = {
  index: function(req, res) {
    res.send('The home:index controller');
  },
};
```

每个控制器实际上都是一个 Express 中间件（只不过不需要 `{% raw %}next{% endraw %}` 函数，因为是最后一个中间件）。这里我们暂时用 `{% raw %}res.send{% endraw %}` 发一条文字来代表这个 controller 已经实现。

再在 controllers 目录下创建 image.js，实现与图片处理相关的控制器：

```js controllers/image.js
module.exports = {
  index: function(req, res) {
    res.send('The image:index controller ' + req.params.image_id);
  },
  create: function(req, res) {
    res.send('The image:create POST controller');
  },
  like: function(req, res) {
    res.send('The image:like POST controller');
  },
  comment: function(req, res) {
    res.send('The image:comment POST controller');
  },
};
```

然后在 server 目录下创建路由模块 routes.js，建立从 URL 到控制器之间的映射：

```js server/routes.js
const express = require('express');

const router = express.Router();
const home = require('../controllers/home');
const image = require('../controllers/image');

module.exports = function(app) {
  router.get('/', home.index);
  router.get('/images/:image_id', image.index);
  router.post('/images', image.create);
  router.post('/images/:image_id/like', image.like);
  router.post('/images/:image_id/comment', image.comment);
  app.use(router);
};
```

这里我们用到了 Express 自带的路由类 `{% raw %}Router{% endraw %}`，可以很方便地定义路由，并且 `{% raw %}Router{% endraw %}` 本身也是一个中间件，可以直接通过 `{% raw %}app.use{% endraw %}` 进行配置。

接着在 server/configure.js 模块中调用路由模块。

```diff server/configure.js
const methodOverride = require('method-override');
const errorHandler = require('errorhandler');

+ const routes = require('./routes');
+
module.exports = function(app) {
  app.use(morgan('dev'));
  app.use(bodyParser.urlencoded({ extended: true }));

============================================
============= 此处省略 n 行代码 ==============
============================================

    app.use(errorHandler());
  }

+   routes(app);
  return app;
};
```

最后我们去掉 server.js 中原来的首页路由。

```diff server.js
app = configure(app);
app.set('port', process.env.PORT || 3000);

- app.get('/', function(req, res) {
-   res.send('Hello World!');
- });
-
app.listen(app.get('port'), function() {
  console.log(`Server is running on http://localhost:${app.get('port')}`);
});
```

到了这一步，我们运行服务器，打开浏览器访问 [http://localhost:3000](http://localhost:3000)，可以看到 `{% raw %}The home:index controller{% endraw %}` 的信息；访问 [http://localhost:3000/test123](http://localhost:3000/test123)，则是 `{% raw %}The image:index controller test123{% endraw %}`。进一步，我们还可以通过 Postman 或者 curl 等工具测试 POST 方法的 controller 是否可用。下面以 curl 为例测试 `{% raw %}POST /images{% endraw %}`：

```bash
$ curl -X POST localhost:3000/images
The image:create POST controller
```

一切顺利！到这里可以泡杯茶好好犒劳一下自己了~

## 配置 handlebars 模板引擎

这一步，我们将开始实现 MVC 中的 V，即 View，用户界面。

首页的效果如下图所示：

![](/images/figure-2.png)

图片详情的效果如下图所示：

![](/images/figure-3.png)

尽管如今前后端分离已经是大势所趋，但是通过模板引擎在服务器端渲染页面也是有用武之地的，特别是快速地开发一些简单的应用。在模板引擎中，[Handlebars](http://handlebarsjs.com/) 和 [Pug](https://pugjs.org/api/getting-started.html) 当属其中的佼佼者。由于 Handlebars 和普通的 HTML 文档几乎完全一致，容易上手，因此这篇教程中我们选用 Handlebars，并且选用 Bootstrap 样式。

与普通的 HTML 文档相比，模板最大的特点即在于提供了数据的接入。例如 handlebars，可以在双花括号 `{% raw %}{{}}{% endraw %}` 之间填写任何数据，当服务器渲染页面时只需传入相应的数据即可渲染成对应的内容。除此之外，handlebars 还支持条件语法、循环语法和模板嵌套等高级功能，下面将详细描述。

我们创建一个 views 目录，用于存放所有的模板代码。views 目录的结构如下所示：

```
views
├── image.handlebars
├── index.handlebars
├── layouts
│   └── main.handlebars
└── partials
    ├── comments.handlebars
    ├── popular.handlebars
    └── stats.handlebars
```

其中 image.handlebars 和 index.handlebars 是***页面模板***，layouts/main.handlebars 则是整个网站的***布局模板***（所有页面共享），partials 目录则用于存放页面之间共享的***组件模板***，例如评论、数据等等。

首先完成布局模板 layouts/main.handlebars：

```handlebars views/layouts/main.handlebars
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title>Instagrammy</title>
  <link href="http://netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css" rel="stylesheet">
</head>

<body>
  <div class="page-header">
    <div class="container">
      <div class="col-md-6">
        <h1><a href="/">Instagrammy</a></h1>
      </div>
    </div>
  </div>

  <div class="container">
    <div class="row">
      <div class="col-sm-8">{{{body}}}</div>
    </div>
  </div>
</body>

</html>
```

main.handlebars 本身是一个完整的 HTML 文档，包括 `{% raw %}head{% endraw %}` 和 `{% raw %}body{% endraw %}` 部分。在 `{% raw %}head{% endraw %}` 部分，我们定义了网站的一些元数据，还加入了 Bootstrap 的 CDN 链接；在 `{% raw %}body{% endraw %}` 部分，包含两个容器：网站头部（header）和每个页面的自定义内容（即`{% raw %}{{{body}}}{% endraw %}` ）。

接下来编写 index.handlebars，即主页内容。这里我们暂时先写上一个大标题：

```handlebars views/index.handlebars
<h1>Index Page</h1>
```

还有 image.handlebars，即图片详情页面内容：

```handlebars views/image.handlebars
<h1>Image Page</h1>
```

index.handlebars 和 image.handlebars 的内容将替换布局模板中的 `{% raw %}{{{body}}}{% endraw %}` 部分。在用户访问某个页面时，页面内容 = ***布局模板+页面模板***。

模板写好之后，我们修改控制器相应的代码，通过 `{% raw %}res.render{% endraw %}` 函数渲染模板：

```diff controllers/home.js
module.exports = {
  index: function(req, res) {
-     res.send('The home:index controller');
+     res.render('index');
  },
};
```

`{% raw %}render{% endraw %}` 函数接受一个字符串参数，即页面模板的名称。例如 `{% raw %}index.handlebars{% endraw %}` 的名称即为 `{% raw %}index{% endraw %}`。

同样地，我们修改 image 控制器的代码：

```diff controllers/image.js
module.exports = {
  index: function(req, res) {
-     res.send('The image:index controller ' + req.params.image_id);
+     res.render('image');
  },
  create: function(req, res) {
    res.send('The image:create POST controller');
```

最后，不要忘记在 server/configure.js 模块中配置 handlebars 中间件：

```diff server/configure.js
const routes = require('./routes');

module.exports = function(app) {
+   app.engine('handlebars', exphbs());
+   app.set('view engine', 'handlebars');
+
  app.use(morgan('dev'));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
```

大功告成！现在运行服务器，分别访问主页（[http://localhost:3000](http://localhost:3000)）和图片详情页面（[http://localhost:3000/images/test](http://localhost:3000/images/test)），可以看到完整的页面（虽然没有数据），包括所有页面共享的头部和每个页面的自定义内容。

## 完善界面代码

在上面一步的基础上，我们将继续完善模板代码。

首先是在 index.handlebars 中添加上传图片的表单和展示最新图片的容器。

```diff views/index.handlebars
- <h1>Index Page</h1>
+ <div class="panel panel-primary">
+   <div class="panel-heading">
+     <h3 class="panel-title">
+       上传图片
+     </h3>
+   </div>
+   <form action="/images" method="post" enctype="multipart/form-data">
+     <div class="panel-body form-horizontal">
+       <div class="form-group col-md-12">
+         <label for="file" class="col-sm-2 control-label">浏览:</label>
+         <div class="col-md-10">
+           <input type="file" class="form-control" name="file" id="file">
+         </div>
+       </div>
+       <div class="form-group col-md-12">
+         <label for="title" class="col-md-2 control-label">标题:</label>
+         <div class="col-md-10">
+           <input type="text" class="form-control" name="title">
+         </div>
+       </div>
+       <div class="form-group col-md-12">
+         <label for="description" class="col-md-2 control-label">描述:</label>
+         <div class="col-md-10">
+           <textarea name="description" rows="2" class="form-control"></textarea>
+         </div>
+       </div>
+       <div class="form-group col-md-12">
+         <div class="col-md-12 text-right">
+           <button type="submit" id="login-btn" class="btn btn-success">
+             <i class="fa fa-cloud-upload"> 上传图片</i>
+           </button>
+         </div>
+       </div>
+     </div>
+   </form>
+ </div>
+
+ <div class="panel panel-default">
+   <div class="panel-heading">
+     <h3 class="panel-title">
+       最新图片
+     </h3>
+   </div>
+   <div class="panel-body">
+     {{#each images}}
+       <div class="col-md-4 text-center" style="padding-bottom: 1em;">
+         <a href="/images/{{uniqueId}}">
+           <img src="/public/upload/{{filename}}" alt="{{title}}"
+             style="width: 175px; height: 175px;" class="img-thumbnail">
+         </a>
+       </div>
+     {{/each}}
+   </div>
+ </div>
```

在展示最新图片时，我们用到了 handlebars 提供的循环语法（第 46 行到 53 行）。对于传入模板的数据对象 `{% raw %}images{% endraw %}` 进行遍历，每个循环中可以访问单个 `{% raw %}image{% endraw %}` 的全部属性，例如 `{% raw %}uniqueId{% endraw %}` 等等。

接着完善 image.handlebars 的内容，包括展示图片的详细内容、发表评论的表单和展示所有评论的容器。

```diff views/image.handlebars
- <h1>Image Page</h1>
+ <div class="panel panel-primary">
+   <div class="panel-heading">
+     <h2 class="panel-title">{{image.title}}</h2>
+   </div>
+   <div class="panel-body">
+     <p>{{image.description}}</p>
+     <div class="col-md-12 text-center">
+       <img src="/public/upload/{{image.filename}}" alt="{{image.title}}"
+         class="thumbnail">
+     </div>
+   </div>
+   <div class="panel-footer">
+     <div class="row">
+       <div class="col-md-8">
+         <button class="btn btn-success" id="btn-like" data-id="{{image.uniqueId}}">
+           <i class="fa fa-heart"> 点赞</i>
+         </button>
+         <strong class="likes-count">{{image.likes}}</strong> &nbsp; - &nbsp;
+         <i class="fa fa-eye"></i>
+         <strong>{{image.views}}</strong>
+         &nbsp; - &nbsp; 发表于: <em class="text-muted">{{image.timestamp}}</em>
+       </div>
+       <div class="col-md-4 text-right">
+         <button class="btn btn-danger" id="btn-delete" data-id="{{image.uniqueId}}">
+           <i class="fa fa-times"></i>
+         </button>
+       </div>
+     </div>
+   </div>
+ </div>
+
+ <div class="panel panel-default">
+   <div class="panel-heading">
+     <div class="row">
+       <div class="col-md-8">
+         <strong class="panel-title">评论</strong>
+       </div>
+       <div class="col-md-4 text-right">
+         <button class="btn btn-default btn-sm" id="btn-comment" data-id="{{image.uniqueId}}">
+           <i class="fa fa-comments-o"> 发表评论...</i>
+         </button>
+       </div>
+     </div>
+   </div>
+   <div class="panel-body">
+     <blockquote id="post-comment">
+       <div class="row">
+         <form action="/images/{{image.uniqueId}}/comment" method="post">
+           <div class="form-group col-sm-12">
+             <label for="name" class="col-sm-2 control-label">昵称:</label>
+             <div class="col-sm-10"><input type="text" class="form-control" name="name"></div>
+           </div>
+           <div class="form-group col-sm-12">
+             <label for="email" class="col-sm-2 control-label">Email:</label>
+             <div class="col-sm-10"><input type="text" class="form-control" name="email"></div>
+           </div>
+           <div class="form-group col-sm-12">
+             <label for="comment" class="col-sm-2 control-label">评论:</label>
+             <div class="col-sm-10">
+               <textarea name="comment" class="form-control" rows="2"></textarea>
+             </div>
+           </div>
+           <div class="form-group col-sm-12">
+             <div class="col-sm-12 text-right">
+               <button class="btn btn-success" id="comment-btn" type="button">
+                 <i class="fa fa-comment"></i> 发表
+               </button>
+             </div>
+           </div>
+         </form>
+       </div>
+     </blockquote>
+     <ul class="media-list">
+       {{#each comments}}
+       <li class="media">
+         <a href="#" class="pull-left">
+           <img src="http://www.gravatar.com/avatar/{{gravatar}}?d=monsterid&s=45"
+             class="media-object img-circle">
+         </a>
+         <div class="media-body">
+           {{comment}}
+           <br/>
+           <strong class="media-heading">{{name}}</strong>
+           <small class="text-muted">{{timestamp}}</small>
+         </div>
+       </li>
+       {{/each}}
+     </ul>
+   </div>
+ </div>
```

在展示所有评论的代码中，我们同样用到了 handlebars 的循环语法，非常方便。

然后，我们将分别实现网站右边栏中的统计数据、最受欢迎图片和最新评论组件。首先是统计数据组件模板：

```handlebars views/partials/stats.handlebars
<div class="panel panel-default">
  <div class="panel-heading">
    <h3 class="panel-title">统计数据</h3>
  </div>
  <div class="panel-body">
    <div class="row">
      <div class="col-md-4 text-left">图片:</div>
      <div class="col-md-8 text-right">{{sidebar.stats.images}}</div>
    </div>
    <div class="row">
      <div class="col-md-4 text-left">评论:</div>
      <div class="col-md-8 text-right">{{sidebar.stats.comments}}</div>
    </div>
    <div class="row">
      <div class="col-md-4 text-left">浏览:</div>
      <div class="col-md-8 text-right">{{sidebar.stats.views}}</div>
    </div>
    <div class="row">
      <div class="col-md-4 text-left">点赞:</div>
      <div class="col-md-8 text-right">{{sidebar.stats.likes}}</div>
    </div>
  </div>
</div>
```

可以看出组件模板和页面模板并没有什么不同，都是一些 HTML 代码再加上数据接口。

再分别实现最受欢迎图片组件（popular.handlebars）和最新评论组件（comments.handlebars）。

```handlebars views/partials/popular.handlebars
<div class="panel panel-default">
  <div class="panel-heading">
    <h3 class="panel-title">最受欢迎</h3>
  </div>
  <div class="panel-body">
    {{#each sidebar.popular}}
      <div class="col-md-4 text-center" style="padding-bottom: .5em;">
        <a href="/images/{{uniqueId}}">
          <img src="/public/upload/{{filename}}" style="width: 75px; height: 75px;"
            class="img-thumbnail">
        </a>
      </div>
    {{/each}}
  </div>
</div>
```

```handlebars views/partials/comments.handlebars
<div class="panel panel-default">
  <div class="panel-heading">
    <h3 class="panel-title">最新评论</h3>
  </div>
  <div class="panel-body">
    <ul class="media-list">
      {{#each sidebar.comments}}
      <li class="media">
        <a href="/images/{{image.uniqueId}}" class="pull-left">
          <img src="/public/upload/{{image.filename}}" class="media-object"
            height="45" width="45">
        </a>
        <div class="media-body">
          {{comment}}<br/>
          <strong class="media-heading">{{name}}</strong>
          <small class="text-muted">{{timestamp}}</small>
        </div>
      </li>
      {{/each}}
    </ul>
  </div>
</div>
```

最后，我们在布局模板 layouts/main.handlebars 中加入所有组件模板，加入模板的语法为 `{% raw %}{{> component this}}{% endraw %}`。除此之外，由于我们用到了一些小图标，所以加上 font-awesome 的链接。

```diff views/layouts/main.handlebars
  <meta charset="UTF-8">
  <title>Instagrammy</title>
  <link href="http://netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css" rel="stylesheet">
+   <link href="http://netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.min.css" rel="stylesheet">
</head>

<body>

============================================
============= 此处省略 n 行代码 ==============
============================================

  <div class="container">
    <div class="row">
      <div class="col-sm-8">{{{body}}}</div>
+       <div class="col-sm-4">
+         {{> stats this}}
+         {{> popular this}}
+         {{> comments this}}
+       </div>
    </div>
  </div>
</body>
```

在实际开发中，我们可能经常需要调整页面代码。在修改并保存模板后，只需刷新浏览器即可看到界面的变化（但是如果修改服务器代码则需要重新运行服务器）。

## 将数据传入模板视图

如果没有数据传入，那么模板相应的数据部分将全都是空白。在这一步中，我们将用一些假数据来演示如何从控制器将数据传入模板视图。

首先在 home 控制器中构造一个 `{% raw %}viewModel{% endraw %}` 对象，并在 `{% raw %}render{% endraw %}` 函数中作为第二参数传入。可以看到 `{% raw %}viewModel{% endraw %}` 对象与模板中的数据接口是完全一致的。

```diff controllers/home.js
module.exports = {
  index: function(req, res) {
-     res.render('index');
+     const viewModel = {
+       images: [
+         {
+           uniqueId: 1,
+           title: '示例图片1',
+           description: '',
+           filename: 'sample1.jpg',
+           views: 0,
+           likes: 0,
+           timestamp: Date.now(),
+         },
+         {
+           uniqueId: 2,
+           title: '示例图片2',
+           description: '',
+           filename: 'sample2.jpg',
+           views: 0,
+           likes: 0,
+           timestamp: Date.now(),
+         },
+         {
+           uniqueId: 3,
+           title: '示例图片3',
+           description: '',
+           filename: 'sample3.jpg',
+           views: 0,
+           likes: 0,
+           timestamp: Date.now(),
+         },
+       ],
+     };
+     res.render('index', viewModel);
  },
};
```

同理实现 image 控制器。

```diff controllers/image.js
module.exports = {
  index: function(req, res) {
-     res.render('image');
+     const viewModel = {
+       image: {
+         uniqueId: 1,
+         title: '示例图片1',
+         description: '这是张测试图片',
+         filename: 'sample1.jpg',
+         views: 0,
+         likes: 0,
+         timestamp: Date.now(),
+       },
+       comments: [
+         {
+           image_id: 1,
+           email: 'test@testing.com',
+           name: 'Test Tester',
+           comment: 'Test 1',
+           timestamp: Date.now(),
+         },
+         {
+           image_id: 1,
+           email: 'test@testing.com',
+           name: 'Test Tester',
+           comment: 'Test 2',
+           timestamp: Date.now(),
+         },
+       ],
+     };
+     res.render('image', viewModel);
  },
  create: function(req, res) {
    res.send('The image:create POST controller');
```

在传入数据时，我们可以自定义一些 helper 函数在模板中使用。例如 timestamp 时间戳，`{% raw %}Date.now(){% endraw %}` 返回的是一串数字，显然用户体验很不友好，因此我们需要将其转换为方便用户阅读的时间，例如“几秒前”“两小时前”。这里我们选用 JavaScript 最流行的处理时间的库 [moment.js](http://momentjs.cn/)，并通过 npm 安装：

```bash
$ npm install moment
```

然后在 server/configure.js 中配置 handlebars 的 helper 函数 `{% raw %}timeago{% endraw %}`：

```diff server/configure.js
const morgan = require('morgan');
const methodOverride = require('method-override');
const errorHandler = require('errorhandler');
+ const moment = require('moment');

const routes = require('./routes');

module.exports = function(app) {
-   app.engine('handlebars', exphbs());
+   // 定义 moment 全局语言
+   moment.locale('zh-cn');
+
+   app.engine(
+     'handlebars',
+     exphbs.create({
+       helpers: {
+         timeago: function(timestamp) {
+           return moment(timestamp).startOf('minute').fromNow();
+         },
+       },
+     }).engine,
+   );
  app.set('view engine', 'handlebars');

  app.use(morgan('dev'));
```

`{% raw %}timeago{% endraw %}` 函数能够在模板中使用，将原始的 UNIX 时间戳转换为易于理解的中文时间戳。

接着在相应用到时间戳的地方加入 `{% raw %}timeago{% endraw %}` 函数：

```diff views/image.handlebars
        <strong class="likes-count">{{image.likes}}</strong> &nbsp; - &nbsp;
        <i class="fa fa-eye"></i>
        <strong>{{image.views}}</strong>
-         &nbsp; - &nbsp; 发表于: <em class="text-muted">{{image.timestamp}}</em>
+         &nbsp; - &nbsp; 发表于: <em class="text-muted">{{timeago image.timestamp}}</em>
      </div>
      <div class="col-md-4 text-right">
        <button class="btn btn-danger" id="btn-delete" data-id="{{image.uniqueId}}">

============================================
============= 此处省略 n 行代码 ==============
============================================

          {{comment}}
          <br/>
          <strong class="media-heading">{{name}}</strong>
-           <small class="text-muted">{{timestamp}}</small>
+           <small class="text-muted">{{timeago timestamp}}</small>
        </div>
      </li>
      {{/each}}
```

```diff views/partials/comments.handlebars
        <div class="media-body">
          {{comment}}<br/>
          <strong class="media-heading">{{name}}</strong>
-           <small class="text-muted">{{timestamp}}</small>
+           <small class="text-muted">{{timeago timestamp}}</small>
        </div>
      </li>
      {{/each}}
```

至此，本系列教程的第一部分就已经完成了，MVC 我们实现了 V（视图）和 C （控制器）。在后续教程中，我们将接入 MongoDB 数据库用于网站数据的存取，并进一步实现图片上传、点赞和删除，以及添加评论等功能。
