---
title: 'Nest.js 从零到壹系列（五）：使用管道、DTO 验证入参，摆脱 if-else 的恐惧'
description: '上一篇介绍了如何使用中间件、拦截器、过滤器打造日志系统，接下来将介绍后端永远绕不过去的痛：参数验证。'
tags: ['Nest.js']
categories: ['后端', 'Node.js', '进阶']
date: 2020-05-12T00:04:00.509Z
photos:
  - https://static.tuture.co/c/%40sQN91Mviv/5.jpg
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

上一篇介绍了如何使用中间件、拦截器、过滤器打造日志系统，接下来将介绍后端永远绕不过去的痛：参数验证。
你是否曾经为了验证参数，写了一大堆 if - else ？然后还要判断各种参数类型？相似的结构在不同的方法里判断，却又要复制一遍代码？
使用 DTO 可以清晰的了解对象的结构，使用 Pipes（管道）配合 `class-validator` 还可以对参数类型进行判断，还可以在验证失败的时候抛出错误信息。
前两天发现 NestJS 更新到了 7.0.3（之前是 6.0.0），为了让教程更贴合实际，故果断升级。升级后没发现什么大问题，之前的代码照常运行，若各位读者发现什么其他 Bug ，可以在 GitHub 上 issues。
[GitHub 项目地址](https://github.com/SephirothKid/nest-zero-to-one)，欢迎各位大佬 Star。

## 一、什么是 DTO？

> 数据传输对象（DTO)(Data Transfer Object)，是一种设计模式之间传输数据的软件应用系统。数据传输目标往往是数据访问对象从数据库中检索数据。数据传输对象与数据交互对象或数据访问对象之间的差异是一个以不具有任何行为除了存储和检索的数据（访问和存取器）。
> 根据定义，我们需要在代码中约定一下 DTO，还是以注册接口为例，先创建 `user.dto.ts` 简单定义一下：

```ts
// src/logical/user
export class RegisterInfoDTO {
  readonly accountName: string | number;
  readonly realName: string;
  readonly password: string;
  readonly repassword: string;
  readonly mobile: number;
}
```

其实就是输出了一个类似于声明接口的 class，表明了参数名和类型，并且是只读的。
当然，Nest 支持使用 Interface（接口） 来定义 DTO，具体语法可以浏览 TypeScript 官方文档，不过 Nest 建议使用 Class 来做 DTO（就踩坑经验而言， Class 确实比 Interface 方便多了），所以 Interface 在这里就不多介绍了。
定义好 DTO 后，接下来将演示怎么和管道配合来验证参数。

## 二、管道

### 1. 概念

管道和拦截器有点像，都是在数据传输过程中的“关卡”，只不过各司其职。
管道有两个类型:

- 转换：管道将输入数据转换为所需的数据输出；
- 验证：对输入数据进行验证，如果验证成功继续传递，验证失败则抛出异常；

`ValidationPipe` 是 Nest.js 自带的三个开箱即用的管道之一（另外两个是 `ParseIntPipe` 和 `ParseUUIDPipe`，现在还用不到）。

`ValidationPipe` 只接受一个值并立即返回相同的值，其行为类似于一个标识函数，标准代码如下：

```ts
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return value;
  }
}
```

每个管道必须提供 `transform()` 方法。 这个方法有两个参数：

- value
- metadata

`value` 是当前处理的参数，而 `metadata` 是其元数据。

### 2. 创建管道

简单介绍完一些概念后，开始实战，先创建 pipe 文件：

```bash
$ nest g pipe validation pipe

```

这里我们还需要安装两个依赖包：

```bash
$ yarn add class-validator class-transformer -S

```

然后在 `validation.pipe.ts` 中编写验证逻辑：

```ts
// src/pipe/validation.pipe.ts
import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { Logger } from '../utils/log4js';
@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    console.log(`value:`, value, 'metatype: ', metatype);
    if (!metatype || !this.toValidate(metatype)) {
      // 如果没有传入验证规则，则不验证，直接返回数据
      return value;
    }
    // 将对象转换为 Class 来验证
    const object = plainToClass(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      const msg = Object.values(errors[0].constraints)[0]; // 只需要取第一个错误信息并返回即可
      Logger.error(`Validation failed: ${msg}`);
      throw new BadRequestException(`Validation failed: ${msg}`);
    }
    return value;
  }
  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

### 3. 绑定管道

绑定管道非常简单，就和之前使用 Guards 那样，直接用修饰符绑定在 Controller 上，然后将 body 的类型指定 DTO 即可：

```ts
// src/logical/user/user.controller.ts
import { Controller, Post, Body, UseGuards, UsePipes } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth/auth.service';
import { UserService } from './user.service';
import { ValidationPipe } from '../../pipe/validation.pipe';
import { RegisterInfoDTO } from './user.dto'; // 引入 DTO
@Controller('user')
export class UserController {
 constructor(private readonly authService: AuthService, private readonly usersService: UserService) {}
 // JWT验证 - Step 1: 用户请求登录
 @Post('login')
 async login(@Body() loginParmas: any) {
   ...
 }
 @UseGuards(AuthGuard('jwt'))
 @UsePipes(new ValidationPipe()) // 使用管道验证
 @Post('register')
 async register(@Body() body: RegisterInfoDTO) { // 指定 DTO类型
   return await this.usersService.register(body);
 }
}

```

### 4. 完善错误提示

光有这些还不行，我们应该增加错误提示：

```ts
// src/logical/user/user.dto.ts
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
export class RegisterInfoDTO {
  @IsNotEmpty({ message: '用户名不能为空' })
  readonly accountName: string | number;
  @IsNotEmpty({ message: '真实姓名不能为空' })
  @IsString({ message: '真实姓名必须是 String 类型' })
  readonly realName: string;
  @IsNotEmpty({ message: '密码不能为空' })
  readonly password: string;
  @IsNotEmpty({ message: '重复密码不能为空' })
  readonly repassword: string;
  @IsNotEmpty({ message: '手机号不能为空' })
  @IsNumber()
  readonly mobile: number;
  readonly role?: string | number;
}
```

上面简单编写了一些常用的验证手段，`class-validator` 里面有非常多的验证方法，有兴趣的读者可以访问官方文档去学习：[GitHub: class-validator](https://github.com/typestack/class-validator)
接下来我们测试一下，先测试为空的情况：
![](https://static.tuture.co/c/@sQN91Mviv/1589284859007-8318b693-a8f9-4f08-85e7-cb443a924a53.webp)
上图可以看到 `accountName` 的 `@IsNotEmpty()` 已经生效了

> 注意：class-validator 还提供了一个方法叫 @IsEmpty()，这是表示参数必须为空，不要搞混了。
> 再测试参数类型，因为 Postman 的 `Body \-> x-www-form-urlencoded` 默认传的都是字符串，所以我们需要稍微修改一下请求参数：
> ![](https://static.tuture.co/c/@sQN91Mviv/1589284859083-1d5dae75-95cf-4f31-9084-4fa19b9f20b1.webp)
> 上图可以看到 `realname` 的 `@IsString()` 已经生效了，再看一下日志：
> ![](https://static.tuture.co/c/@sQN91Mviv/1589284859038-9ea28f71-caa8-423b-adf0-87d72797f697.webp)
> 至此，入参验证功能已基本完成，有了这些，我们就可以摆脱各种 if - else 来验证入参了（当然，特殊的，逻辑比较复杂的还是需要的）。

## 总结

本篇介绍了如何定义 DTO，如何使用 Pipes 管道，以及如何配合 class-validator 进行入参验证。
定义 DTO 有人可能会觉得好麻烦，直接 any 一把梭不就好了，然后 TypeScript 就逐渐变成了 AnyScript 了。。。。
![](https://static.tuture.co/c/@sQN91Mviv/1710abf3c25dc456)
但如果不拥抱 TypeScript 的特性，那还不如直接用 JavaScript 来写，这样还更快（如 Koa、Egg 等），定义 DTO 还有一个好处，那就是可以配合 Swagger 自动生成文档，并且是可请求的，极大方便了前端阅读文档，以后的教程会说明如何操作。
下一篇，将介绍一下如何使用拦截器进行权限认证。

> 本篇收录于[NestJS 实战教程](https://juejin.im/collection/5e893a1b6fb9a04d65a15400)，更多文章敬请关注。
> `
