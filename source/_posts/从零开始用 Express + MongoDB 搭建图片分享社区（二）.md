---
title: "从零开始用 Express + MongoDB 搭建图片分享社区（二）"
description: "在本系列教程的第二部分中，我们将接入 MongoDB 数据库，并由此实现围绕图片、评论的功能。"
tags: ["Node", "MongoDB"]
---

## 实现图片上传功能

第一步，我们先实现图片上传功能。创建 `public/upload` 文件夹，用于存放用户上传的图片：

```bash
$ mkdir -p public/upload
```

然后安装 multer 中间件用于处理文件上传：

```bash
$ npm install multer
```

在 server/routes.js 模块中，我们初始化 multer 中间件，然后将其添加到上传图片的路由中（即 `POST /images`）：

```js server/routes.js
const express = require('express');
[tuture-add]const multer = require('multer');
[tuture-add]const path = require('path');

const router = express.Router();
[tuture-add]const upload = multer({ dest: path.join(__dirname, 'public/upload/temp') });
const home = require('../controllers/home');
const image = require('../controllers/image');

module.exports = function(app) {
  router.get('/', home.index);
  router.get('/images/:image_id', image.index);
[tuture-del]  router.post('/images', image.create);
[tuture-add]  router.post('/images', upload.single('file'), image.create);
  router.post('/images/:image_id/like', image.like);
  router.post('/images/:image_id/comment', image.comment);
  app.use(router);
```

上述代码有两点需要讲解：

- 第 6 行，在初始化 `upload` 中间件时，传入 `dest` 选项指定保存上传文件的路径，这里我们选择在 public/upload 目录中再创建一个 temp 目录用于临时保存上传到的图片；
- 第 14 行，`router.post` 除第一个参数为 URL，后面可以跟任意多个中间件，这里我们将上传文件的中间件添加到 `image.create` 控制器的前面，确保先处理用户上传的文件。这里 `upload.single('file')` 表示只处理单个上传文件，并且字段名为 `file`，在后续中间件中就可以通过 `req.file` 进行获取。

关于 multer 的详细用法，可以参考其[文档](https://github.com/expressjs/multer)。

在配置好上传文件的中间件后，相应地在控制器中加入获取并保存图片的代码：

```js controllers/image.js
[tuture-add]const fs = require('fs');
[tuture-add]const path = require('path');
[tuture-add]
module.exports = {
  index: function(req, res) {
    const viewModel = {
[tuture-omit]
    res.render('image', viewModel);
  },
  create: function(req, res) {
[tuture-del]    res.send('The image:create POST controller');
[tuture-add]    var tempPath = req.file.path;
[tuture-add]    var imgUrl = req.file.filename;
[tuture-add]    var ext = path.extname(req.file.originalname).toLowerCase();
[tuture-add]    var targetPath = path.resolve('./public/upload/' + imgUrl + ext);
[tuture-add]
[tuture-add]    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif') {
[tuture-add]      fs.rename(tempPath, targetPath, function(err) {
[tuture-add]        if (err) throw err;
[tuture-add]        res.redirect('/images/' + imgUrl);
[tuture-add]      });
[tuture-add]    } else {
[tuture-add]      fs.unlink(tempPath, function(err) {
[tuture-add]        if (err) throw err;
[tuture-add]        res.json(500, { error: '只允许上传图片文件.' });
[tuture-add]      });
[tuture-add]    }
  },
  like: function(req, res) {
    res.send('The image:like POST controller');
```

`req.file` 是一个 Multer 文件对象，包括 `path`（上传到服务器的路径）、`filename`（服务器存储的文件名）和 `originalname`（文件初始名，即保存在客户端的文件名）等有用的属性。我截取了一张输出 `req.file` 所有字段的图片如下：

![](https://raw.githubusercontent.com/mRcfps/Instagrammy/master/tuture-assets/figure-4.png)

这里我们通过简单的后缀匹配来判断用户上传的是否为图片，如果是，则从临时目录 `tempPath` 存放到上传目录 `targetPath` 中，否则直接删除。上传成功后，通过 `res.redirect` 将页面重定向到刚刚上传的图片的详情页面。

## 接入 MongoDB 数据库

在上一步中，我们实现了文件上传，但是有一个很糟糕的问题：我们没有去记录上传了哪些图片，还有相应的信息（例如上传时间）。当我们关闭服务器再打开时，整个网站仿佛一下子“失忆”了。解决数据持久化存储最流行的方案无疑是数据库，而 MongoDB 凭借其优异的性能、可扩展性和灵活的数据模式，从众多数据库产品中脱颖而出。并且，MongoDB 的核心功能是基于 BSON（Binary JSON）实现的，甚至提供了 JavaScript Shell，因此在 Node 社区更是深受欢迎。所以，我们也将利用 MongoDB 实现 Instagrammy 的数据持久化存储。MongoDB 可以从其[官网](https://www.mongodb.com/download-center/community)上下载。下载并安装好之后，新打开一个终端（命令控制台），运行以下命令打开数据库（Windows 用户可以搜索 mongo.exe 并打开）：

```bash
$ mongod
```

然后我们安装 Mongoose 这个 npm 包：

```bash
$ npm install mongoose
```

Mongoose 是 MongoDB 最流行的 ODM（Object Document Mapping，对象文档映射），使用起来要比底层的 MongoDB Node 驱动更方便。

我们首先实现图片有关的数据模型。创建 models 目录，在其中添加 image.js 模块，并添加实现 `ImageSchema` 的代码：

```js models/image.js
const mongoose = require('mongoose');
const path = require('path');

const Schema = mongoose.Schema;

const ImageSchema = new Schema({
  title: { type: String },
  description: { type: String },
  filename: { type: String },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
});

ImageSchema.virtual('uniqueId').get(function() {
  return this.filename.replace(path.extname(this.filename), '');
});

module.exports = mongoose.model('Image', ImageSchema);
```

我们在第 6 行到第 13 行定义了一个 `Schema`，即数据对象的模式，描述了这个模型的所有字段及相应的属性。这里我们为 `ImageSchema` 定义了六个字段，每个字段都有其类型（必须），`views`、`likes` 和 `timestamp` 还有相应的默认值（可选）。除了普通字段外，我们还定义了***虚字段***`uniqueId`。虚字段（virtuals）和普通字段的最大区别是不会保存到数据库中，而是在每次查询时临时计算，通常用于对普通字段进行格式调整或组合。在 `Schema` 定义完成后，我们将其编译为名为 `Image` 的模型并导出，方便在控制器中进行使用。

接着我们在 home 控制器中调用 `ImageModel` 来从数据库中获取全部图片：

```js controllers/home.js
[tuture-add]const ImageModel = require('../models/image');
[tuture-add]
module.exports = {
  index: function(req, res) {
[tuture-del]    const viewModel = {
[tuture-del]      images: [
[tuture-del]        {
[tuture-del]          uniqueId: 1,
[tuture-del]          title: '示例图片1',
[tuture-del]          description: '',
[tuture-del]          filename: 'sample1.jpg',
[tuture-del]          views: 0,
[tuture-del]          likes: 0,
[tuture-del]          timestamp: Date.now(),
[tuture-del]        },
[tuture-del]        {
[tuture-del]          uniqueId: 2,
[tuture-del]          title: '示例图片2',
[tuture-del]          description: '',
[tuture-del]          filename: 'sample2.jpg',
[tuture-del]          views: 0,
[tuture-del]          likes: 0,
[tuture-del]          timestamp: Date.now(),
[tuture-del]        },
[tuture-del]        {
[tuture-del]          uniqueId: 3,
[tuture-del]          title: '示例图片3',
[tuture-del]          description: '',
[tuture-del]          filename: 'sample3.jpg',
[tuture-del]          views: 0,
[tuture-del]          likes: 0,
[tuture-del]          timestamp: Date.now(),
[tuture-del]        },
[tuture-del]      ],
[tuture-del]    };
[tuture-del]    res.render('index', viewModel);
[tuture-add]    const viewModel = { images: [] };
[tuture-add]
[tuture-add]    ImageModel.find({}, {}, { sort: { timestamp: -1 } }, function(err, images) {
[tuture-add]      if (err) throw err;
[tuture-add]      viewModel.images = images;
[tuture-add]      res.render('index', viewModel);
[tuture-add]    });
  },
};
```

在第 39 行中，我们用 `find` 方法查询图片，所有的查询方法可参考 [Mongoose 中文文档](https://cn.mongoosedoc.top/docs/queries.html)。`find` 是查询多条数据记录的通用方法，其四个参数如下：

- `filter`：过滤器，是一个 JavaScript 对象，例如 `{% raw %}{ name: 'john' }{% endraw %}` 则限定返回所有名字为 john 的记录，这里我们用 `{% raw %}{}{% endraw %}` 表示查询所有记录；
- `projection`（可选）：查询所返回的字段，可以是对象或字符串，我们用 `{% raw %}{}{% endraw %}` 表示返回所有字段；
- `options`（可选）：查询操作的选项，用来指定查询操作的一些参数，比如我们用 `sort` 选项对返回结果进行排序（这里按照发布时间 `timestamp` 进行倒序排列，即把最新发布的放在最前面）；
- `callback`：回调函数，用于添加在查询完毕时的业务逻辑。

MongoDB 的查询灵活而强大，但这也意味着一定的学习成本。

进一步，我们在 image 控制器中添加数据库操作的代码：

```js controllers/image.js
const fs = require('fs');
const path = require('path');
[tuture-add]const ImageModel = require('../models/image');

module.exports = {
  index: function(req, res) {
[tuture-del]    const viewModel = {
[tuture-del]      image: {
[tuture-del]        uniqueId: 1,
[tuture-del]        title: '示例图片1',
[tuture-del]        description: '这是张测试图片',
[tuture-del]        filename: 'sample1.jpg',
[tuture-del]        views: 0,
[tuture-del]        likes: 0,
[tuture-del]        timestamp: Date.now(),
[tuture-del]      },
[tuture-del]      comments: [
[tuture-del]        {
[tuture-del]          image_id: 1,
[tuture-del]          email: 'test@testing.com',
[tuture-del]          name: 'Test Tester',
[tuture-del]          comment: 'Test 1',
[tuture-del]          timestamp: Date.now(),
[tuture-del]        },
[tuture-del]        {
[tuture-del]          image_id: 1,
[tuture-del]          email: 'test@testing.com',
[tuture-del]          name: 'Test Tester',
[tuture-del]          comment: 'Test 2',
[tuture-del]          timestamp: Date.now(),
[tuture-del]        },
[tuture-del]      ],
[tuture-del]    };
[tuture-del]    res.render('image', viewModel);
[tuture-add]    const viewModel = { image: {}, comments: [] };
[tuture-add]
[tuture-add]    ImageModel.findOne({ filename: { $regex: req.params.image_id } }, function(
[tuture-add]      err,
[tuture-add]      image,
[tuture-add]    ) {
[tuture-add]      if (err) throw err;
[tuture-add]      if (image) {
[tuture-add]        // 增加该图片的访问量
[tuture-add]        image.views += 1;
[tuture-add]        viewModel.image = image;
[tuture-add]        image.save();
[tuture-add]        res.render('image', viewModel);
[tuture-add]      } else {
[tuture-add]        res.redirect('/');
[tuture-add]      }
[tuture-add]    });
  },
  create: function(req, res) {
    var tempPath = req.file.path;
[tuture-omit]
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif') {
      fs.rename(tempPath, targetPath, function(err) {
        if (err) throw err;
[tuture-del]        res.redirect('/images/' + imgUrl);
[tuture-add]        const newImg = new ImageModel({
[tuture-add]          title: req.body.title,
[tuture-add]          description: req.body.description,
[tuture-add]          filename: imgUrl + ext,
[tuture-add]        });
[tuture-add]        newImg.save(function(err, image) {
[tuture-add]          if (err) throw err;
[tuture-add]          res.redirect('/images/' + image.uniqueId);
[tuture-add]        });
      });
    } else {
      fs.unlink(tempPath, function(err) {
```

在 `image.index` 和 `image.create` 两个控制器中，我们分别进行了单条数据记录的查询和插入。`findOne` 与之前的 `find` 参数格式完全一致，只不过仅返回一条数据。在插入新数据时，先创建一个 `ImageModel` 实例，然后再调用 `save` 方法进行保存即可。

最后，我们需要在服务器刚刚运行时就连接好数据库，因此在 server.js 中添加如下代码：

```js server.js
const express = require('express');
[tuture-add]const mongoose = require('mongoose');
const configure = require('./server/configure');

app = express();
app = configure(app);
[tuture-add]
[tuture-add]// 建立数据库连接
[tuture-add]mongoose.connect('mongodb://localhost/instagrammy');
[tuture-add]mongoose.connection.on('open', function() {
[tuture-add]  console.log('Mongoose connected.');
[tuture-add]});
[tuture-add]
app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), function() {
```

到了这一步，我们运行 `node server.js` 运行服务器（确保 MongoDB 数据库已经在运行！），尝试上传图片，可以发现不仅能上传成功，还可以在首页看到新添加的图片了！

## 实现评论功能

类似地，我们进一步实现网站的评论功能。按照 MVC 模式，我们将依次实现评论的模型（M）、视图（V）和控制器（C）。

首先，仿照 models/image.js，我们实现评论的数据模型：

```js models/comment.js
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const CommentSchema = new Schema({
  image_id: { type: ObjectId },
  email: { type: String },
  name: { type: String },
  gravatar: { type: String },
  comment: { type: String },
  timestamp: { type: Date, default: Date.now },
});

CommentSchema.virtual('image')
  .set(function(image) {
    this._image = image;
  })
  .get(function() {
    return this._image;
  });

module.exports = mongoose.model('Comment', CommentSchema);
```

`CommentSchema` 有两个字段需要补充说明一下：

- `image_id`：由于图片和评论是一对多的关系（即一张图片包括多个评论），因此我们需要在记录每个评论所属的图片，即通过 `image_id` 字段进行记录；
- `gravatar`：用 MD5 对电子邮箱加密后得到的字符串，用于访问 [Gravatar](https://gravatar.com) 服务。Gravatar 提供了跨网站的头像服务，如果你在集成了 Gravatar 服务的网站通过邮箱注册并上传了头像，那么别的网站也可以通过 Gravatar 访问你的头像。这里请通过 `npm install md5` 安装 MD5 加密的包。

我们对评论有关的界面代码进行细微的调整，将提交按钮的 `type` 从 `button` 改为 `submit`：

```handlebars views/image.handlebars
          </div>
          <div class="form-group col-sm-12">
            <div class="col-sm-12 text-right">
[tuture-del]              <button class="btn btn-success" id="comment-btn" type="button">
[tuture-add]              <button class="btn btn-success" id="comment-btn" type="submit">
                <i class="fa fa-comment"></i> 发表
              </button>
            </div>
```

最后是评论有关的 controller 代码。包括在 `image.comment` 中实现创建评论，以及在 `image.index` 中实现对单张图片所有评论的查询：

```js controllers/image.js
const fs = require('fs');
const path = require('path');
[tuture-add]const md5 = require('md5');
const ImageModel = require('../models/image');
[tuture-add]const CommentModel = require('../models/comment');

module.exports = {
  index: function(req, res) {
[tuture-omit]
        image.views += 1;
        viewModel.image = image;
        image.save();
[tuture-del]        res.render('image', viewModel);
[tuture-add]
[tuture-add]        CommentModel.find(
[tuture-add]          { image_id: image._id },
[tuture-add]          {},
[tuture-add]          { sort: { timestamp: 1 } },
[tuture-add]          function(err, comments) {
[tuture-add]            if (err) throw err;
[tuture-add]            viewModel.comments = comments;
[tuture-add]            res.render('image', viewModel);
[tuture-add]          },
[tuture-add]        );
      } else {
        res.redirect('/');
      }
[tuture-omit]
    res.send('The image:like POST controller');
  },
  comment: function(req, res) {
[tuture-del]    res.send('The image:comment POST controller');
[tuture-add]    ImageModel.findOne({ filename: { $regex: req.params.image_id } }, function(
[tuture-add]      err,
[tuture-add]      image,
[tuture-add]    ) {
[tuture-add]      if (!err && image) {
[tuture-add]        const newComment = new CommentModel(req.body);
[tuture-add]        newComment.gravatar = md5(newComment.email);
[tuture-add]        newComment.image_id = image._id;
[tuture-add]        newComment.save(function(err, comment) {
[tuture-add]          if (err) throw err;
[tuture-add]          res.redirect('/images/' + image.uniqueId + '#' + comment._id);
[tuture-add]        });
[tuture-add]      } else {
[tuture-add]        res.redirect('/');
[tuture-add]      }
[tuture-add]    });
  },
};
```

查询与创建评论的代码和之前操作图片的代码大部分都是一致的，最大的差别在于查询时需要根据所属的图片 ID，创建时需要记录图片的 ID。这里我们约定使用 MongoDB 为每一条数据默认创建的 `_id` 字段。

## 实现图片的点赞和删除

这一步中，我们将实现图片的点赞和删除。

首先在控制器中添加点赞和删除的代码：

```js controllers/image.js
    }
  },
  like: function(req, res) {
[tuture-del]    res.send('The image:like POST controller');
[tuture-add]    ImageModel.findOne({ filename: { $regex: req.params.image_id } }, function(
[tuture-add]      err,
[tuture-add]      image,
[tuture-add]    ) {
[tuture-add]      if (!err && image) {
[tuture-add]        image.likes += 1;
[tuture-add]        image.save(function(err) {
[tuture-add]          if (err) res.json(err);
[tuture-add]          else res.json({ likes: image.likes });
[tuture-add]        });
[tuture-add]      }
[tuture-add]    });
[tuture-add]  },
[tuture-add]  remove: function(req, res) {
[tuture-add]    ImageModel.findOne({ filename: { $regex: req.params.image_id } }, function(
[tuture-add]      err,
[tuture-add]      image,
[tuture-add]    ) {
[tuture-add]      if (err) throw err;
[tuture-add]      fs.unlink(path.resolve('./public/upload/' + image.filename), function(
[tuture-add]        err,
[tuture-add]      ) {
[tuture-add]        if (err) throw err;
[tuture-add]        CommentModel.remove({ image_id: image._id }, function(err) {
[tuture-add]          image.remove(function(err) {
[tuture-add]            if (!err) {
[tuture-add]              res.json(true);
[tuture-add]            } else {
[tuture-add]              res.json(false);
[tuture-add]            }
[tuture-add]          });
[tuture-add]        });
[tuture-add]      });
[tuture-add]    });
  },
  comment: function(req, res) {
    ImageModel.findOne({ filename: { $regex: req.params.image_id } }, function(
```

在两个控制器中，我们都按照***查询->修改->保存***的流程进行操作。不过在删除图片中，我们不仅先删除上传图片，再删除了此图片所有的评论模型，最后再删除数据库中的图片模型，这一切通过 `Model.remove` 方法都可以轻松实现。`remove` 的使用方法与之前的 `find` 几乎一模一样，只不过 `find` 会返回符合条件的结果，而 `remove` 则会直接将符合条件的记录从数据库中删除。

我们在路由模块 server/routes.js 中添加刚刚写好的 `image.remove` 控制器：

```js server/routes.js
  router.post('/images', upload.single('file'), image.create);
  router.post('/images/:image_id/like', image.like);
  router.post('/images/:image_id/comment', image.comment);
[tuture-add]  router.delete('/images/:image_id', image.remove);
  app.use(router);
};
```

如果你尝试运行网站，你会发现点击点赞和删除按钮并没有什么用。因此，我们选用 jQuery 来实现前端界面向服务器发起点赞和删除的请求。在布局文件中添加 jQuery 的静态链接，以及相应的 jQuery 代码（如果不熟悉 jQuery 也不必过于纠结，直接复制粘贴就行了）：

```handlebars views/layouts/main.handlebars
  </div>
</body>

[tuture-add]<script src="https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js"></script>
[tuture-add]<script>
[tuture-add]  $(function () {
[tuture-add]    // to do...
[tuture-add]  });
[tuture-add]
[tuture-add]  $('#btn-like').on('click', function (event) {
[tuture-add]    event.preventDefault();
[tuture-add]    var imgId = $(this).data('id');
[tuture-add]    $.post('/images/' + imgId + '/like').done(function (data) {
[tuture-add]      $('.likes-count').text(data.likes);
[tuture-add]    });
[tuture-add]  });
[tuture-add]
[tuture-add]  $('#btn-delete').on('click', function (event) {
[tuture-add]    event.preventDefault();
[tuture-add]    var $this = $(this);
[tuture-add]
[tuture-add]    var remove = confirm('确定要删除这张图片吗?');
[tuture-add]    if (remove) {
[tuture-add]      var imgId = $(this).data('id');
[tuture-add]      $
[tuture-add]        .ajax({
[tuture-add]          url: '/images/' + imgId,
[tuture-add]          type: 'DELETE'
[tuture-add]        })
[tuture-add]        .done(function (result) {
[tuture-add]          if (result) {
[tuture-add]            $this.removeClass('btn-danger').addClass('btn-success');
[tuture-add]            $this.find('i').removeClass('fa-times').addClass('fa-check');
[tuture-add]            $this.append('<span> 已删除!</span>');
[tuture-add]          }
[tuture-add]        });
[tuture-add]    }
[tuture-add]  });
[tuture-add]</script>
[tuture-add]
</html>
```

再尝试运行网站，可以看到点赞和删除功能都已经实现了！只不过侧边栏的所有数据都没有同步更新，我们将在下一步中进行完善。

## 完善用户界面

终于来到教程的最后一步！我们将实现侧边栏中所有容器（统计数据、最受欢迎图片和最新评论）的数据同步。先创建 helpers 目录，用于存放侧边栏数据获取的相关代码。然后分析一下数据同步逻辑（例如统计数据），我们发现要进行的查询非常多：图片总数、评论总数、图片所有的访问量、图片所有的点赞数。如果按照普通的写法，我们也许会这样写：

```javascript
queryA(function(err, resultsA) {
  queryB(function(err, resultsB) {
    queryC(function(err, resultsC) {
      queryD(function(err, resultsD) {
        // some code ...
      }
    }
  }
}
```

这样的代码不仅十分丑陋，难以维护（即大家常说的“回调地狱”），而且性能也十分糟糕——所有查询都是链式执行。但其实所有的查询都是相互独立的，完全可以并发进行，那我们应该怎么写呢？

答案就是 [async](http://caolan.github.io/async/) 库。async 是在 ECMAScript 6 的 Promise 体系出现之前最流行的异步组件库，凭借其强大的性能、丰富且设计良好的接口成为 Node 和前端开发中解决异步的最佳选择之一。这里我们也用 async 来解决并发获取数据的问题。安装 async 包：

```bash
$ npm install async
```

然后创建 helpers/stats.js，用于获取网站统计数据：

```js helpers/stats.js
const async = require('async');
const ImageModel = require('../models/image');
const CommentModel = require('../models/comment');

module.exports = function(callback) {
  async.parallel(
    [
      function(next) {
        // 统计图片总数
        ImageModel.count({}, next);
      },
      function(next) {
        // 统计评论总数
        CommentModel.count({}, next);
      },
      function(next) {
        // 对图片所有访问量求和
        ImageModel.aggregate(
          [
            {
              $group: {
                _id: '1',
                viewsTotal: { $sum: '$views' },
              },
            },
          ],
          function(err, result) {
            if (err) {
              return next(err);
            }
            var viewsTotal = 0;
            if (result.length > 0) {
              viewsTotal += result[0].viewsTotal;
            }
            next(null, viewsTotal);
          },
        );
      },
      function(next) {
        // 对所有点赞数求和
        ImageModel.aggregate(
          [
            {
              $group: {
                _id: '1',
                likesTotal: { $sum: '$likes' },
              },
            },
          ],
          function(err, result) {
            if (err) {
              return next(err);
            }
            var likesTotal = 0;
            if (result.length > 0) {
              likesTotal += result[0].likesTotal;
            }
            next(null, likesTotal);
          },
        );
      },
    ],
    function(err, results) {
      callback(null, {
        images: results[0],
        comments: results[1],
        views: results[2],
        likes: results[3],
      });
    },
  );
};
```

这里我们用到了 `async.parallel` 接口，它接受两个参数：

- `tasks`：一个函数数组，每个函数对应一个异步任务（所有任务将并发执行），并且接受一个回调函数用于返回任务执行的结果；
- `callback`：整个任务组的回调函数，可以获取所有异步任务执行完成后的所有结果。

我们将四个数据查询任务包装成四个函数作为 `async.parallel` 的第一个参数，在最后的 `callback` 中返回所有查询结果。非常简洁、优雅。

接下来实现侧边栏中的最新图片模块，一个简单的数据库查询即可：

```js helpers/images.js
const ImageModel = require('../models/image');

module.exports = {
  popular: function(callback) {
    ImageModel.find({}, {}, { limit: 9, sort: { likes: -1 } }, function(
      err,
      images,
    ) {
      if (err) return callback(err);
      callback(null, images);
    });
  },
};
```

然后是创建获取最新评论的代码。不过简单地查询评论模型是不够的，我们还需要获取到每个评论对应的图片，这时候用 `async.each` 函数对一个数组中所有对象进行异步操作最为合适不过。整个模块的代码如下：

```js helpers/comments.js
const async = require('async');
const ImageModel = require('../models/image');
const CommentModel = require('../models/comment');

module.exports = {
  newest: function(callback) {
    CommentModel.find({}, {}, { limit: 5, sort: { timestamp: -1 } }, function(
      err,
      comments,
    ) {
      if (err) return callback(err);
      var attachImage = function(comment, next) {
        ImageModel.findOne({ _id: comment.image_id }, function(err, image) {
          if (err) throw err;
          comment.image = image;
          next(err);
        });
      };
      async.each(comments, attachImage, function(err) {
        if (err) throw err;
        callback(err, comments);
      });
    });
  },
};
```

`async.each` 函数接受的三个参数如下：

- `collection`：用于接收异步操作的集合，这里是评论集；
- `iteratee`：异步操作函数，这里是 `attachImage` 函数；
- `callback`：全部操作执行完成的回调函数。

我们将前面三个 helper 函数放到一起，创建一个 sidebar 模块，并发获取三个模块的数据。这里我们还是用 `async.parallel` 函数，因为三个模块本质上也是异步查询：

```js helpers/sidebar.js
const async = require('async');
const Stats = require('./stats');
const Images = require('./images');
const Comments = require('./comments');

module.exports = function(viewModel, callback) {
  async.parallel(
    [
      function(next) {
        Stats(next);
      },
      function(next) {
        Images.popular(next);
      },
      function(next) {
        Comments.newest(next);
      },
    ],
    function(err, results) {
      viewModel.sidebar = {
        stats: results[0],
        popular: results[1],
        comments: results[2],
      };
      callback(viewModel);
    },
  );
};
```

并发的异步操作层层嵌套，是不是很炫酷呢？

最后将我们炫酷的 sidebar 模块用到 home 和 image 控制器中：

```js controllers/home.js
[tuture-add]const sidebar = require('../helpers/sidebar');
const ImageModel = require('../models/image');

module.exports = {
[tuture-omit]
    ImageModel.find({}, {}, { sort: { timestamp: -1 } }, function(err, images) {
      if (err) throw err;
      viewModel.images = images;
[tuture-del]      res.render('index', viewModel);
[tuture-add]      sidebar(viewModel, function(viewModel) {
[tuture-add]        res.render('index', viewModel);
[tuture-add]      });
    });
  },
};
```

```js controllers/image.js
const fs = require('fs');
const path = require('path');
const md5 = require('md5');
[tuture-add]const sidebar = require('../helpers/sidebar');
const ImageModel = require('../models/image');
const CommentModel = require('../models/comment');

[tuture-omit]
          function(err, comments) {
            if (err) throw err;
            viewModel.comments = comments;
[tuture-del]            res.render('image', viewModel);
[tuture-add]            sidebar(viewModel, function(viewModel) {
[tuture-add]              res.render('image', viewModel);
[tuture-add]            });
          },
        );
      } else {
```

侧边栏的所有数据都能够同步更新，我们的网站也基本完成了！