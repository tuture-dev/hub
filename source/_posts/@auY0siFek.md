---
title: 'Nest.js 从零到壹系列（四）：使用中间件、拦截器、过滤器打造日志系统'
description: '上一篇介绍了如何使用 JWT 进行单点登录，接下来，要完善一下后端项目的一些基础功能。'
tags: ['Nest.js']
categories: ['后端', 'Node.js', '进阶']
date: 2020-05-12T00:03:00.509Z
photos:
  - https://static.powerformer.com/c/%40auY0siFek/4.jpg
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

上一篇介绍了如何使用 JWT 进行单点登录，接下来，要完善一下后端项目的一些基础功能。

首先，一个良好的服务端，应该有较完善的日志收集功能，这样才能在生产环境发生异常时，能够从日志中复盘，找出 Bug 所在。

其次，要针对项目中抛出的异常进行归类，并将信息反映在接口或日志中。

最后，请求接口的参数也应该被记录，以便统计分析（主要用于大数据和恶意攻击分析）。

[GitHub 项目地址](https://github.com/SephirothKid/nest-zero-to-one)，欢迎各位大佬 Star。

## 一、日志系统

这里使用的是 `log4js`，前身是 `log4j`，如果有写过 Java 的大佬应该不会陌生。

已经有大佬总结了 log4js 的用法，就不在赘述了：

[《Node.js 之 log4js 完全讲解》](https://juejin.im/post/57b962af7db2a200542a0fb3)

### 1. 配置

先安装依赖包

```ts
$ yarn add log4js stacktrace-js -S

```

在 config 目录下新建一个文件 `log4js.ts`，用于编写配置文件：

```ts
// config/log4js.ts

import * as path from 'path';
const baseLogPath = path.resolve(__dirname, '../../logs'); // 日志要写入哪个目录

const log4jsConfig = {
  appenders: {
    console: {
      type: 'console', // 会打印到控制台
    },
    access: {
      type: 'dateFile', // 会写入文件，并按照日期分类
      filename: `${baseLogPath}/access/access.log`, // 日志文件名，会命名为：access.20200320.log
      alwaysIncludePattern: true,
      pattern: 'yyyyMMdd',
      daysToKeep: 60,
      numBackups: 3,
      category: 'http',
      keepFileExt: true, // 是否保留文件后缀
    },
    app: {
      type: 'dateFile',
      filename: `${baseLogPath}/app-out/app.log`,
      alwaysIncludePattern: true,
      layout: {
        type: 'pattern',
        pattern:
          '{"date":"%d","level":"%p","category":"%c","host":"%h","pid":"%z","data":\'%m\'}',
      },
      // 日志文件按日期（天）切割
      pattern: 'yyyyMMdd',
      daysToKeep: 60,
      // maxLogSize: 10485760,
      numBackups: 3,
      keepFileExt: true,
    },
    errorFile: {
      type: 'dateFile',
      filename: `${baseLogPath}/errors/error.log`,
      alwaysIncludePattern: true,
      layout: {
        type: 'pattern',
        pattern:
          '{"date":"%d","level":"%p","category":"%c","host":"%h","pid":"%z","data":\'%m\'}',
      },
      // 日志文件按日期（天）切割
      pattern: 'yyyyMMdd',
      daysToKeep: 60,
      // maxLogSize: 10485760,
      numBackups: 3,
      keepFileExt: true,
    },
    errors: {
      type: 'logLevelFilter',
      level: 'ERROR',
      appender: 'errorFile',
    },
  },
  categories: {
    default: {
      appenders: ['console', 'app', 'errors'],
      level: 'DEBUG',
    },
    info: { appenders: ['console', 'app', 'errors'], level: 'info' },
    access: { appenders: ['console', 'app', 'errors'], level: 'info' },
    http: { appenders: ['access'], level: 'DEBUG' },
  },
  pm2: true, // 使用 pm2 来管理项目时，打开
  pm2InstanceVar: 'INSTANCE_ID', // 会根据 pm2 分配的 id 进行区分，以免各进程在写日志时造成冲突
};

export default log4jsConfig;
```

上面贴出了我的配置，并标注了一些简单的注释，请配合 [《Node.js 之 log4js 完全讲解》](https://juejin.im/post/57b962af7db2a200542a0fb3) 一起食用。

### 2. 实例化

有了配置，就可以着手写 log4js 的实例以及一些工具函数了。

在 `src/utils` 下新建 `log4js.ts`:

```ts
// src/utils/log4js.ts
import * as Path from 'path';
import * as Log4js from 'log4js';
import * as Util from 'util';
import * as Moment from 'moment'; // 处理时间的工具
import * as StackTrace from 'stacktrace-js';
import Chalk from 'chalk';
import config from '../../config/log4js';

// 日志级别
export enum LoggerLevel {
  ALL = 'ALL',
  MARK = 'MARK',
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
  OFF = 'OFF',
}

// 内容跟踪类
export class ContextTrace {
  constructor(
    public readonly context: string,
    public readonly path?: string,
    public readonly lineNumber?: number,
    public readonly columnNumber?: number,
  ) {}
}

Log4js.addLayout('Awesome-nest', (logConfig: any) => {
  return (logEvent: Log4js.LoggingEvent): string => {
    let moduleName: string = '';
    let position: string = '';

    // 日志组装
    const messageList: string[] = [];
    logEvent.data.forEach((value: any) => {
      if (value instanceof ContextTrace) {
        moduleName = value.context;
        // 显示触发日志的坐标（行，列）
        if (value.lineNumber && value.columnNumber) {
          position = `${value.lineNumber}, ${value.columnNumber}`;
        }
        return;
      }

      if (typeof value !== 'string') {
        value = Util.inspect(value, false, 3, true);
      }

      messageList.push(value);
    });

    // 日志组成部分
    const messageOutput: string = messageList.join(' ');
    const positionOutput: string = position ? ` [${position}]` : '';
    const typeOutput: string = `[${
      logConfig.type
    }] ${logEvent.pid.toString()}   - `;
    const dateOutput: string = `${Moment(logEvent.startTime).format(
      'YYYY-MM-DD HH:mm:ss',
    )}`;
    const moduleOutput: string = moduleName
      ? `[${moduleName}] `
      : '[LoggerService] ';
    let levelOutput: string = `[${logEvent.level}] ${messageOutput}`;

    // 根据日志级别，用不同颜色区分
    switch (logEvent.level.toString()) {
      case LoggerLevel.DEBUG:
        levelOutput = Chalk.green(levelOutput);
        break;
      case LoggerLevel.INFO:
        levelOutput = Chalk.cyan(levelOutput);
        break;
      case LoggerLevel.WARN:
        levelOutput = Chalk.yellow(levelOutput);
        break;
      case LoggerLevel.ERROR:
        levelOutput = Chalk.red(levelOutput);
        break;
      case LoggerLevel.FATAL:
        levelOutput = Chalk.hex('#DD4C35')(levelOutput);
        break;
      default:
        levelOutput = Chalk.grey(levelOutput);
        break;
    }

    return `${Chalk.green(typeOutput)}${dateOutput}  ${Chalk.yellow(
      moduleOutput,
    )}${levelOutput}${positionOutput}`;
  };
});

// 注入配置
Log4js.configure(config);

// 实例化
const logger = Log4js.getLogger();
logger.level = LoggerLevel.TRACE;

export class Logger {
  static trace(...args) {
    logger.trace(Logger.getStackTrace(), ...args);
  }

  static debug(...args) {
    logger.debug(Logger.getStackTrace(), ...args);
  }

  static log(...args) {
    logger.info(Logger.getStackTrace(), ...args);
  }

  static info(...args) {
    logger.info(Logger.getStackTrace(), ...args);
  }

  static warn(...args) {
    logger.warn(Logger.getStackTrace(), ...args);
  }

  static warning(...args) {
    logger.warn(Logger.getStackTrace(), ...args);
  }

  static error(...args) {
    logger.error(Logger.getStackTrace(), ...args);
  }

  static fatal(...args) {
    logger.fatal(Logger.getStackTrace(), ...args);
  }

  static access(...args) {
    const loggerCustom = Log4js.getLogger('http');
    loggerCustom.info(Logger.getStackTrace(), ...args);
  }

  // 日志追踪，可以追溯到哪个文件、第几行第几列
  static getStackTrace(deep: number = 2): string {
    const stackList: StackTrace.StackFrame[] = StackTrace.getSync();
    const stackInfo: StackTrace.StackFrame = stackList[deep];

    const lineNumber: number = stackInfo.lineNumber;
    const columnNumber: number = stackInfo.columnNumber;
    const fileName: string = stackInfo.fileName;
    const basename: string = Path.basename(fileName);
    return `${basename}(line: ${lineNumber}, column: ${columnNumber}): \n`;
  }
}
```

上面贴出了我实例化 log4js 的过程，主要是处理日志的组成部分（包含了时间、类型，调用文件以及调用的坐标），还可以根据日志的不同级别，在控制台中用不同的颜色显示。

这个文件，不但可以单独调用，也可以做成中间件使用。

### 3. 制作中间件

我们希望每次用户请求接口的时候，自动记录请求的路由、IP、参数等信息，如果每个路由都写，那就太傻了，所以需要借助中间件来实现。

Nest 中间件实际上等价于 express 中间件。

中间件函数可以执行以下任务:

- 执行任何代码；
- 对请求和响应对象进行更改；
- 结束请求-响应周期；
- 调用堆栈中的下一个中间件函数；
- 如果当前的中间件函数没有【结束请求】或【响应周期】, 它必须调用 `next()` 将控制传递给下一个中间件函数。否则，请求将被挂起；

执行下列命令，创建中间件文件：

```ts
$ nest g middleware logger middleware

```

然后，`src` 目录下，就多出了一个 `middleware` 的文件夹，里面的 `logger.middleware.ts` 就是接下来的主角，Nest 预设的中间件模板长这样：

```ts
// src/middleware/logger.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    next();
  }
}
```

这里只是实现了 `NestMiddleware` 接口，它接收 3 个参数：

- req：即 Request，请求信息；
- res：即 Response ，响应信息；
- next：将控制传递到下一个中间件，写过 Vue、Koa 的应该不会陌生；

接下来，我们将日志功能写入中间件：

```ts
// src/middleware/logger.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '../utils/log4js';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {
    const code = res.statusCode; // 响应状态码
    next();
    // 组装日志信息
    const logFormat = `Method: ${req.method} \n Request original url: ${req.originalUrl} \n IP: ${req.ip} \n Status code: ${code} \n`;
    // 根据状态码，进行日志类型区分
    if (code >= 500) {
      Logger.error(logFormat);
    } else if (code >= 400) {
      Logger.warn(logFormat);
    } else {
      Logger.access(logFormat);
      Logger.log(logFormat);
    }
  }
}
```

同时，Nest 也支持【函数式中间件】，我们将上面的功能用函数式实现一下：

```ts
// src/middleware/logger.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '../utils/log4js';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  ...
}

// 函数式中间件
export function logger(req: Request, res: Response, next: () => any) {
  const code = res.statusCode; // 响应状态码
  next();
  // 组装日志信息
  const logFormat = ` >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    Request original url: ${req.originalUrl}
    Method: ${req.method}
    IP: ${req.ip}
    Status code: ${code}
    Parmas: ${JSON.stringify(req.params)}
    Query: ${JSON.stringify(req.query)}
    Body: ${JSON.stringify(req.body)} \n  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  `;
  // 根据状态码，进行日志类型区分
  if (code >= 500) {
    Logger.error(logFormat);
  } else if (code >= 400) {
    Logger.warn(logFormat);
  } else {
    Logger.access(logFormat);
    Logger.log(logFormat);
  }
}

```

上面的日志格式进行了一些改动，主要是为了方便查看。

至于使用 Nest 提供的还是函数式中间件，可以视需求决定。当然，Nest 原生的中间件高级玩法会更多一些。

### 4. 应用中间件

做好中间件后，我们只需要将中间件引入 main.ts 中就好了：

```ts
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { logger } from './middleware/logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 监听所有的请求路由，并打印日志
  app.use(logger);
  app.setGlobalPrefix('nest-zero-to-one');
  await app.listen(3000);
}
bootstrap();
```

保存代码后，就会发现，项目目录下就多了几个文件：

![](https://static.powerformer.com/c/@auY0siFek/1589285157042-afbc04e0-11ba-4c3d-a086-641b3c32c9c3.webp)

这就是之前 `config/log4js.ts` 中配置的成果

接下来，我们试着请求一下登录接口：

![](https://static.powerformer.com/c/@auY0siFek/1589285157040-5257b5aa-05cd-4ce6-8de7-c6aea6e7386b.webp)

发现虽然是打印了，但是没有请求参数信息。

于是，我们还要做一部操作，将请求参数处理一下：

```ts
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { logger } from './middleware/logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(express.json()); // For parsing application/json
  app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
  // 监听所有的请求路由，并打印日志
  app.use(logger);
  app.setGlobalPrefix('nest-zero-to-one');
  await app.listen(3000);
}
bootstrap();
```

再请求一次，发现参数已经出来了：

![](https://static.powerformer.com/c/@auY0siFek/1589285157080-63d37742-b656-4bbb-be82-ea304a65c1f5.webp)

> 上面的打印信息，IP 为 `::1` 是因为我所有的东西都跑在本地，正常情况下，会打印对方的 IP 的。

再去看看 `logs/` 文件夹下：

![](https://static.powerformer.com/c/@auY0siFek/1589285157137-e9ee0369-e782-4da3-b800-fc8930976125.webp)

上图可以看到日志已经写入文件了。

### 5. 初探拦截器

前面已经示范了怎么打印入参，但是光有入参信息，没有出参信息肯定不行的，不然怎么定位 Bug 呢。

Nest 提供了一种叫做 `Interceptors`（拦截器） 的东东，你可以理解为关卡，除非遇到关羽这样的可以过五关斩六将，否则所有的参数都会经过这里进行处理，正所谓雁过拔毛。

详细的使用方法会在后面的教程进行讲解，这里只是先大致介绍一下怎么使用：

执行下列指令，创建 `transform`文件

```bash
$ nest g interceptor transform interceptor

```

然后编写出参打印逻辑，intercept 接受两个参数，当前的上下文和传递函数，这里还使用了 `pipe`（管道），用于传递响应数据：

```ts
// src/interceptor/transform.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Logger } from '../utils/log4js';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.getArgByIndex(1).req;
    return next.handle().pipe(
      map((data) => {
        const logFormat = ` <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    Request original url: ${req.originalUrl}
    Method: ${req.method}
    IP: ${req.ip}
    User: ${JSON.stringify(req.user)}
    Response data:\n ${JSON.stringify(data.data)}
    <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`;
        Logger.info(logFormat);
        Logger.access(logFormat);
        return data;
      }),
    );
  }
}
```

保存文件，然后在 `main.ts` 中引入，使用 `useGlobalInterceptors` 调用全局拦截器：

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { logger } from './middleware/logger.middleware';
import { TransformInterceptor } from './interceptor/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(express.json()); // For parsing application/json
  app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
  // 监听所有的请求路由，并打印日志
  app.use(logger);
  // 使用全局拦截器打印出参
  app.useGlobalInterceptors(new TransformInterceptor());
  app.setGlobalPrefix('nest-zero-to-one');
  await app.listen(3000);
}
bootstrap();
```

我们再试一次登录接口：

![](https://static.powerformer.com/c/@auY0siFek/1589285157093-2bf794c8-e2e0-495f-9006-b6d169f82cd3.webp)

可以看到，出参的日志已经出来了，User 为 `undefiend` 是因为登录接口没有使用 JWT 守卫，若路由加了 `@UseGuards(AuthGuard('jwt'))`，则会把用户信息绑定在 req 上，具体操作可回顾上一篇教程。

## 二、异常处理

在开发的过程中，难免会写出各式各样的“八阿哥”，不然程序员就要失业了。一个富有爱心的程序员应该在输出代码的同时创造出 3 个岗位（手动狗头）。

![](https://static.powerformer.com/c/@auY0siFek/1589285157088-01a8d786-4349-4d17-98d4-e695137597da.webp)

回归正题，光有入参出参日志还不够，异常的捕获和抛出也需要记录。

接下来，我们先故意写错语法，看看控制台打印什么：

![](https://static.powerformer.com/c/@auY0siFek/1589285157104-9c9abf15-a920-4902-ad19-ad4e0542fba3.webp)

如图，只会记录入参以及控制台默认的报错信息，而默认的报错信息，是不会写入日志文件的。

再看看请求的返回数据：

![](https://static.powerformer.com/c/@auY0siFek/1589285157143-6ed21a70-a6c1-4b64-b5f0-617b7967c38a.webp)

如图，这里只会看到 "Internal server error"，其他什么信息都没有。

这样就会有隐患了，用户在使用过程中报错了，但是日志没有记录报错的原因，就无法统计影响范围，如果是简单的报错还好，如果涉及数据库各种事务或者并发问题，就很难追踪定位了，总不能一直看着控制台吧。

因此，我们需要捕获代码中未捕获的异常，并记录日志到 `logs/errors` 里，方便登录线上服务器，对错误日志进行筛选、排查。

### 1. 初探过滤器

Nest 不光提供了拦截器，也提供了过滤器，就代码结构而言，和拦截器很相似。

内置的异常层负责处理整个应用程序中的所有抛出的异常。当捕获到未处理的异常时，最终用户将收到友好的响应。

我们先新建一个 `http-exception.filter` 试试：

```bash
$ nest g filter http-exception filter

```

打开文件，默认代码长这样：

```ts
// src/filter/http-exception.filter.ts
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {}
}
```

可以看到，和拦截器的结构大同小异，也是接收 2 个参数，只不过用了 `@Catch()` 来修饰。

### 2. HTTP 错误的捕获

Nest 提供了一个内置的 HttpException 类，它从 @nestjs/common 包中导入。对于典型的基于 HTTP REST/GraphQL API 的应用程序，最佳实践是在发生某些错误情况时发送标准 HTTP 响应对象。

HttpException 构造函数有两个必要的参数来决定响应:

- response 参数定义 JSON 响应体。它可以是 string 或 object，如下所述。
- status 参数定义 HTTP 状态代码。

默认情况下，JSON 响应主体包含两个属性：

- statusCode：默认为 status 参数中提供的 HTTP 状态代码
- message:基于状态的 HTTP 错误的简短描述

我们先来编写捕获打印的逻辑：

```ts
// src/filter/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '../utils/log4js';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const logFormat = ` <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    Request original url: ${request.originalUrl}
    Method: ${request.method}
    IP: ${request.ip}
    Status code: ${status}
    Response: ${exception.toString()} \n  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    `;
    Logger.info(logFormat);
    response.status(status).json({
      statusCode: status,
      error: exception.message,
      msg: `${status >= 500 ? 'Service Error' : 'Client Error'}`,
    });
  }
}
```

上面代码表示如何捕获 HTTP 异常，并组装成更友好的信息返回给用户。

我们测试一下，先把注册接口的 Token 去掉，请求：

![](https://static.powerformer.com/c/@auY0siFek/1589285157219-f0d860ec-1079-4cec-b21e-9312997d6321.webp)

上图是还没有加过滤器的请求结果。

我们在 main.ts 中引入 `http-exception`：

```ts
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { logger } from './middleware/logger.middleware';
import { TransformInterceptor } from './interceptor/transform.interceptor';
import { HttpExceptionFilter } from './filter/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(express.json()); // For parsing application/json
  app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
  // 监听所有的请求路由，并打印日志
  app.use(logger);
  // 使用拦截器打印出参
  app.useGlobalInterceptors(new TransformInterceptor());
  app.setGlobalPrefix('nest-zero-to-one');
  // 过滤处理 HTTP 异常
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3000);
}
bootstrap();
```

使用全局过滤器 `useGlobalFilters` 调用 `http-exception`，再请求：

![](https://static.powerformer.com/c/@auY0siFek/1589285157167-02c5c42b-fdbc-4f0b-95f2-122eed2286d6.webp)

再看控制台打印：

![](https://static.powerformer.com/c/@auY0siFek/1589285157354-7846170b-6604-4d74-926c-4a3432116fef.webp)

![](https://static.powerformer.com/c/@auY0siFek/1589285157307-0acccad1-c883-4333-a9da-ff1ccd9068e4.webp)

如此一来，就可以看到未带 Token 请求的结果了，具体信息的组装，可以根据个人喜好进行修改。

### 3. 内置 HTTP 异常

为了减少样板代码，Nest 提供了一系列继承自核心异常 HttpException 的可用异常。所有这些都可以在 @nestjs/common 包中找到：

- BadRequestException
- UnauthorizedException
- NotFoundException
- ForbiddenException
- NotAcceptableException
- RequestTimeoutException
- ConflictException
- GoneException
- PayloadTooLargeException
- UnsupportedMediaTypeException
- UnprocessableException
- InternalServerErrorException
- NotImplementedException
- BadGatewayException
- ServiceUnavailableException
- GatewayTimeoutException

结合这些，可以自定义抛出的异常类型，比如后面的教程说到权限管理的时候，就可以抛出 `ForbiddenException` 异常了。

### 4. 其他错误的捕获

除了 HTTP 相关的异常，还可以捕获项目中出现的所有异常，我们新建 `any-exception.filter`：

```bash
$ nest g filter any-exception filter

```

一样的套路：

```ts
// src/filter/any-exception.filter.ts
/**
 * 捕获所有异常
 */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Logger } from '../utils/log4js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const logFormat = ` <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    Request original url: ${request.originalUrl}
    Method: ${request.method}
    IP: ${request.ip}
    Status code: ${status}
    Response: ${exception} \n  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    `;
    Logger.error(logFormat);
    response.status(status).json({
      statusCode: status,
      msg: `Service Error: ${exception}`,
    });
  }
}
```

和 `http-exception` 的唯一区别就是 `exception` 的类型是 `unknown`

我们将 any-exception 引入 main.ts：

```ts
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { logger } from './middleware/logger.middleware';
import { TransformInterceptor } from './interceptor/transform.interceptor';
import { HttpExceptionFilter } from './filter/http-exception.filter';
import { AllExceptionsFilter } from './filter/any-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(express.json()); // For parsing application/json
  app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
  // 监听所有的请求路由，并打印日志
  app.use(logger);
  // 使用拦截器打印出参
  app.useGlobalInterceptors(new TransformInterceptor());
  app.setGlobalPrefix('nest-zero-to-one');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3000);
}
bootstrap();
```

> 注意：AllExceptionsFilter 要在 HttpExceptionFilter 的上面，否则 HttpExceptionFilter 就不生效了，全被 AllExceptionsFilter 捕获了。

然后，我们带上 Token （为了跳过 401 报错）再请求一次：

![](https://static.powerformer.com/c/@auY0siFek/1589285157134-5556c85e-5a1f-4b60-87b6-656b2be6371c.webp)

再看看控制台：

![](https://static.powerformer.com/c/@auY0siFek/1589285157181-888f31ac-5d17-4eed-a9ab-7a738827dddf.webp)

已经有了明显的区别，再看看 errors.log，也写进了日志中：

![](https://static.powerformer.com/c/@auY0siFek/1589285157193-23864e82-2367-4c69-b442-875f37c3f696.webp)

如此一来，代码中未捕获的错误也能从日志中查到了。

## 总结

本篇介绍了如何使用 log4js 来管理日志，制作中间件和拦截器对入参出参进行记录，以及使用过滤器对异常进行处理。

文中日志的打印格式可以按照自己喜好进行排版，不一定局限于此。

良好的日志管理能帮我们快速排查 Bug，减少加班，不做资本家的奴隶，把有限的精力投入到无限的可能上。

![](https://static.powerformer.com/c/@auY0siFek/1589285157185-3dfd97b5-3d03-420a-bade-5600424f1981.webp)

下一篇将介绍如何使用 DTO 对参数进行验证，解脱各种 if - else。

> 本篇收录于[NestJS 实战教程](https://juejin.im/collection/5e893a1b6fb9a04d65a15400)，更多文章敬请关注。

参考资料：

[Nest.js 官方文档](https://docs.nestjs.com/)

[Nest.js 中文文档](https://docs.nestjs.cn/)

[《Node.js 之 log4js 完全讲解》](https://juejin.im/post/57b962af7db2a200542a0fb3)

`
