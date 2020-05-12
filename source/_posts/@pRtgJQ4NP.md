---
title: 'Nest.js 从零到壹系列（一）：项目创建&amp;路由设置&amp;模块'
description: '本系列将以前端的视角进行书写，分享自己的踩坑经历。教程主要面向前端或者毫无后端经验，但是又想尝试 Node.js 的读者，当然，也欢迎后端大佬斧正。'
tags: ['Nest.js']
categories: ['后端', 'Node.js', '进阶']
date: 2020-05-12T00:00:00.509Z
photos:
  - https://imgkr.cn-bj.ufileos.com/02ab4e26-c62a-4098-a9bd-bc015e73ebb1.png
---

<div class="profileBox">
  <div class="avatarBox">
    <a href="https://github.com/SephirothKid/nest-zero-to-one"><img src="/images/avatars/bldtp.png" alt="" class="avatar"></a>
  </div>
  <div class="rightBox">
    <div class="infoBox">
    <a href="https://juejin.im/user/5a5ff3e16fb9a01c9526215f"><p class="nickName">布拉德特皮</p></a>
  </div>
  </div>
</div>

## 前言

本系列将以前端的视角进行书写，分享自己的踩坑经历。教程主要面向前端或者毫无后端经验，但是又想尝试 Node.js 的读者，当然，也欢迎后端大佬斧正。

> Nest 是一个用于构建高效，可扩展的 Node.js 服务器端应用程序的框架。它使用渐进式 JavaScript，内置并完全支持 TypeScript（但仍然允许开发人员使用纯 JavaScript 编写代码）并结合了 OOP（面向对象编程），FP（函数式编程）和 FRP（函数式响应编程）的元素。
> 在底层，Nest 使用强大的 HTTP Server 框架，如 Express（默认）和 Fastify。Nest 在这些框架之上提供了一定程度的抽象，同时也将其 API 直接暴露给开发人员。这样可以轻松使用每个平台的无数第三方模块。

Nest 是我近半年接触的一款后端框架，之前接触的是 Koa2，但因为老项目被“资深”前端写的乱七八糟，所以我就选择了这款以 TypeScript 为主的、最近在国内兴起的框架重构了。截止目前，Github 上的 nestjs 拥有 25.2k 个 Star，主要用户在国外，所以侧面可以证明其一定的稳定性。

Nest 采用 MVC 的设计模式，如果有 Angular 项目经验的读者，应该会觉得熟悉。我没写过 Angular，所以当初学的时候，走了一些弯路，主要是接受这种类 Spring 的设计理念。

![](https://imgkr.cn-bj.ufileos.com/c79e4fe7-4e9e-4c9b-bb3c-2ce5ca1a3752.webp)

[GitHub 项目地址](https://github.com/SephirothKid/nest-zero-to-one)，欢迎各位大佬 Star。

好了，碎碎念到此为止，开始吧：

## 一、项目创建

项目环境：

- node.js: 11.13.0+
- npm: 6.13.4+
- nestjs: 7.0.3
- typescript: 3.8.3

先确操作系统上安装了 Node.js（>= 10.13.0），然后安装 Nest.js，然后新建项目，输入如下指令：

```bash
$ npm i -g @nestjs/cli
$ nest new project-name

```

输入完后，会初始化，此时，会问你使用哪一种方式来管理依赖包：

![](https://imgkr.cn-bj.ufileos.com/b11b0ee9-45d1-4ff3-81a7-d98ac5f92506.webp)

我选择的是 `yarn`，主要是国内的 `npm` 下载得比较慢。如果没有 `yarn` 的，可以下载一个，也可以使用 `npm`，不过本系列教程都使用 `yarn`。

等鸡啄完了米，等狗舔完了面，等火烧断了锁，就会得到下列信息：

![](https://imgkr.cn-bj.ufileos.com/d4db57c7-226b-46e7-b778-58a57294bc84.webp)

按照提示，进入项目，不出意外，目录应该是这个样子的：

![](https://imgkr.cn-bj.ufileos.com/ea85c51d-4d3e-468d-b36f-b8f654ea6da8.webp)

运行 `yarn run start` 或 `yarn start`，会看到控制台输出如下信息，表示服务已启动：

![](https://imgkr.cn-bj.ufileos.com/517421aa-6fe6-4e47-83e2-1fa9ef24d281.webp)

## 二、Hello World!

### 1. 路由指向

打开 `src` 下的 `main.ts`，不出意外，应该会看到下列代码：

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

`await NestFactory.create(AppModule);` 表示使用 Nest 的工厂函数创建了 AppModule，关于 Module 稍后会介绍。

`await app.listen(3000)` 表示监听的是 3000 端口，这个可以自定义。若 3000 端口被占用导致项目启动失败，可以修改成其他端口。

然后我们通过 Postman 访问本地的 3000 端口，会发现出现如下信息：

![](https://imgkr.cn-bj.ufileos.com/c1660a39-834e-41e7-9087-427e6110b1f0.webp)

然后我们需要做的就是，找到为什么会出现 `Hello World!` 的原因。

![](https://imgkr.cn-bj.ufileos.com/eb8af702-ea36-41ac-89eb-21d67fb8b594.webp)

打开 `src` 下的 `app.service.ts`，会看到如下代码：

```ts
// src/app.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```

发现这里有个方法 `getHello()`，返回了 `Hello World!` 字符串，那么它在哪里被调用呢？

打开 `src` 下的 `app.controller.ts`：

```ts
// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
```

喔，原来如此，这里引入了 `app.service.ts` 中的 `AppService` 类，并实例化，然后通过 `@Get()` 修饰 `AppController` 里的 `getHello()` 方法，表示这个方法会被 `GET` 请求调用。

我们修改一下路由，就是在 `@Get()` 括号里面写上字符串：

```ts
// src/app.controller.ts
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello-world')
  getHello(): string {
    return this.appService.getHello();
  }
}
```

然后**重启项目**（在控制台按下 Ctrl + C 终止项目，然后再输入 `yarn start`），此时我们再访问 `localhost:3000/`，就会发现 `404` 了：

![](https://imgkr.cn-bj.ufileos.com/8bedc7a0-00ef-4335-81a6-1b590bdcdd12.webp)

此时，我们输入 `localhost:3000/hello-world`，熟悉的字符出现了：

![](https://imgkr.cn-bj.ufileos.com/c2d2905f-72ed-4b9e-abf7-455261da0ace.webp)

这就是 Nest 的路由，是不是很简单？

### 2. 局部路由前缀

路由还可以设置局部和全局的前缀，使用前缀可以避免在所有路由共享通用前缀时出现冲突的情况。

还是 `app.controller.ts`，在 `@Controller()`写入 `lesson-1`，这样的话就表示**当前文件**中，所有的路由都有了前缀 `lesson-1`：

```ts
// src/app.controller.ts
@Controller('lesson-1')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello-world')
  getHello(): string {
    return this.appService.getHello();
  }
}
```

重启项目，此时我们访问 `localhost:3000/lesson-1/hello-world`，就会指向 `getHello()` 方法了：

![](https://imgkr.cn-bj.ufileos.com/849d9bcc-04cd-45ce-b5a5-99401ea073f3.webp)

### 3. 全局路由前缀

这个更简单了，只需要在 `main.ts` 中加上`app.setGlobalPrefix()`：

```ts
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('nest-zero-to-one'); // 全局路由前缀
  await app.listen(3000);
}
bootstrap();
```

之后只要请求服务，所有的路由都要加上 `nest-zero-to-one` 前缀：

![](https://imgkr.cn-bj.ufileos.com/1fed9468-67b6-4dc4-8b34-75c31585e4a3.webp)

### 4. 使用 nodemon 模式启动项目

如果不想频繁重启，可以使用 `yarn start:dev` 启动项目，它会使用 nodemon 监听文件的变化，并自动重启服务。

如果出现下列信息：

![](https://imgkr.cn-bj.ufileos.com/5643502c-734d-4801-9dd7-510325940836.webp)

原因是可能之前装过 `typescript` 或者 `nestjs` 脚手架，然后新建项目的时候，`typescript` 版本比较旧，只需在项目中更新到 `3.7.0` 以上：

```bash
$ yarn add typescript -D

```

出现这个截图，但是没有路由信息，表示 nodemon 的配置需要更改：

![](https://imgkr.cn-bj.ufileos.com/ff293aa5-f4eb-43b6-ab06-b5d07cc7d673.webp)

```json
package.json:
❌ "start:dev": "concurrently --handle-input \"wait-on dist/main.js && nodemon\" \"tsc -w -p tsconfig.build.json\" ",
✅ "start:dev": "concurrently --handle-input \"wait-on dist/src/main.js && nodemon\" \"tsc -w -p tsconfig.build.json\" ",

nodemon.json:
❌ "exec": "node dist/main"
✅ "exec": "node dist/src/main"

```

然后再运行 `yarn start:dev` 就可以了：

![](https://imgkr.cn-bj.ufileos.com/4b1ec18f-48f1-4147-b583-72e7c39382f6.webp)

或者干脆直接把 `main.ts` 扔到根目录去（和 src 同级）

这样再改动什么文件，都会自动重启服务了。

## 三、新增模块

通过上文，应该熟悉了 NestJS 的设计模式，主要就是 `Controller`、`Service`、`Module` 共同努力，形成了一个模块。

- `Controller`：传统意义上的控制器，提供 api 接口，负责处理路由、中转、验证等一些简洁的业务；
- `Service`：又称为 `Provider`， 是一系列服务、repo、工厂方法、helper 的总称，主要负责处理具体的业务，如数据库的增删改查、事务、并发等逻辑代码；
- `Module`：负责将 `Controller` 和 `Service` 连接起来，类似于 `namespace` 的概念；

很直观的传统 MVC 结构，有 Spring 开发经验的后端应该不会陌生。

下面我们通过新增一个 User 模块来进行实战：

### 1. Service

个人习惯先创建 Service，最后再创建 Module，因为 Controller 和 Module 都需要引入 Service，这样引入的时候就可以有提示了（当然，也可以事先写 import 语句，但 ESLint 的检查会冒红点，强迫症患者表示不接受）。

使用 nest-cli 提供的指令可以快速创建文件，语法如下：

```bash
$ nest g [文件类型] [文件名] [文件目录（src目录下）]

```

我们输入：

```bash
$ nest g service user logical

```

就会发现 src 目录下多了 logical/user/ 文件夹（个人喜欢将业务逻辑相关的文件放入 logical）

![](https://imgkr.cn-bj.ufileos.com/5df26266-7ffc-4827-b370-dac7595da593.webp)

上图中的 user.service.spec.ts 可以不用管……至少我写了大半年，也没动过这种文件。

然后我们看一下 `user.service.ts`，用指令创建的文件，基本都长这样:

```ts
// src/logical/user/user.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {}
```

于是，我们可以仿照 app.service.ts 来写一个简单的业务了：

```ts
// src/logical/user/user.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  findOne(username: string): string {
    if (username === 'Kid') {
      return 'Kid is here';
    }
    return 'No one here';
  }
}
```

### 2. Controller

现在，我们来写控制器，输入下列命令：

```bash
$ nest g controller user logical

```

初始化的 Controller 基本都长这个样：

```ts
// src/logical/user/user.controller.ts
import { Controller } from '@nestjs/common';

@Controller('user')
export class UserController {}
```

接下来，我们把 Service 的业务逻辑引入进来：

```ts
import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Post('find-one')
  findOne(@Body() body: any) {
    return this.usersService.findOne(body.username);
  }
}
```

需要先用构造器实例化，然后才能调用方法，这里使用的是 `POST` 来接收请求，通过 `@Body()` 来获取请求体（request.body）的参数。

我们用 Postman 来测试一下，先随意传入一个 username：

![](https://imgkr.cn-bj.ufileos.com/db337120-4ff3-4cef-87dd-52b08c8835c7.webp)

再传入 'Kid'：

![](https://imgkr.cn-bj.ufileos.com/c9a3669c-b1cb-4ce5-b6e0-368df222a88c.webp)

由此可知，我们成功匹配到了路由，并且编写的业务生效了。

至此 70% 的流程已经走完，以后开发业务（搬砖），基本都是在 Service 和 Controller 里面折腾了。。。

> 注意：千万不要往 Controller 里面添加乱七八糟的东西，尤其不要在里面写业务逻辑，Controller 就应该保持简洁、干净。很多前端刚写 Node 的时候，都喜欢在这里面写逻辑，只为了省事，殊不知这对后期的维护是个灾难。

### 3. Module

这个是连接 Service 和 Controller 的东东，很多人会奇怪，上文只是创建了 Service 和 Controller，怎么就可以访问了呢？

打开 app.module.ts：

```ts
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserService } from './logical/user/user.service';
import { UserController } from './logical/user/user.controller';

@Module({
  imports: [],
  controllers: [AppController, UserController],
  providers: [AppService, UserService],
})
export class AppModule {}
```

发现使用指令创建文件的时候，已经自动帮我们引入 User 相关文件了，而 main.ts 文件里，又已经引入了 `AppModule`，并使用 `NestFactory` 创建了实例。

因此，如果是新建无关痛痒的子模块，即使不新建 Module 文件，也能通过路由访问。

但是作为教程，还是大致说一下吧，先创建文件：

```bash
$ nest g module user logical

```

初始化的 Module 基本都长这个样：

```ts
import { Module } from '@nestjs/common';

@Module({})
export class UserModule {}
```

我们把 Service 和 Controller 组装起来：

```ts
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

这样做有什么好处呢，就是其他 Module 想引入 User 的时候，就不用同时引入 Service 和 Controller 了，我们修改一下 `app.module.ts`：

```ts
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { UserService } from './logical/user/user.service';
// import { UserController } from './logical/user/user.controller';
import { UserModule } from './logical/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

保存运行，发现路由依然生效：

![](https://imgkr.cn-bj.ufileos.com/6557967f-b73e-46e9-bc43-28d7b343d759.webp)

当然，Module 还有其他高级玩法，这个就不在这里展开了。

## 总结

本篇介绍了 Nest.js 项目的创建，路由的访问，以及如何新增模块。

每个模块又可分为 Service、Controller、Module。在本篇中：Service 负责处理逻辑、Controller 负责路由、Module 负责整合。

通过实战可以看出，Nest 还是相对简单的，唯一的障碍可能就是 TypeScript 了。

写惯了 JavaScript 的人，可能不是很能适应这种类型检查，尤其是热衷于使用各种骚操作的，不过既然涉及到了后端领域，还是严谨一点比较好，前期可以避免各种不规范导致的坑。

![](https://imgkr.cn-bj.ufileos.com/638d3b87-faac-4e7f-98f6-ac66017398be.webp)

下一篇将介绍如何连接 MySQL 数据库。

> 本篇收录于[NestJS 实战教程](https://juejin.im/collection/5e893a1b6fb9a04d65a15400)，更多文章敬请关注。

`
