---
title: 'Nest.js 从零到壹系列（三）：使用 JWT 实现注册、登录'
description: '上一篇介绍了如何使用 Sequelize 连接 MySQL，接下来，在原来代码的基础上进行扩展，实现用户的注册和登录功能。'
tags: ['Nest.js']
categories: ['后端', 'Node.js', '进阶']
date: 2020-05-12T00:02:00.509Z
photos:
  - https://static.powerformer.com/c/%40sO4iOISav/3.jpg
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

上一篇介绍了如何使用 Sequelize 连接 MySQL，接下来，在原来代码的基础上进行扩展，实现用户的注册和登录功能。

这里简单提一下 JWT：

### JWT

> JWT（JSON Web Token）是为了在网络应用环境间传递声明而执行的一种基于 JSON 的开放标准（RFC 7519）。该 Token 被设计为紧凑且安全的，特别适用于分布式站点的单点登录（SSO）场景。JWT 的声明一般被用来在身份提供者和服务提供者间传递被认证的用户身份信息，以便于从资源服务器获取资源，也可以增加一些额外的其它业务逻辑所必须的声明信息，该 Token 也可直接被用于认证，也可被加密。

具体原理可以参考[《JSON Web Token 入门教程 - 阮一峰》](http://www.ruanyifeng.com/blog/2018/07/json_web_token-tutorial.html)

所以 JWT 实现【登录】的大致流程是：

1. 客户端用户进行登录请求；
1. 服务端拿到请求，根据参数查询用户表；
1. 若匹配到用户，将用户信息进行签证，并颁发 Token；
1. 客户端拿到 Token 后，存储至某一地方，在之后的请求中都带上 Token ；
1. 服务端接收到带 Token 的请求后，直接根据签证进行校验，无需再查询用户信息；

下面，就开始我们的实战：

[GitHub 项目地址](https://github.com/SephirothKid/nest-zero-to-one)，欢迎各位大佬 Star。

## 一、编写加密的工具函数

在 `src` 目录下，新建文件夹 `utils`，里面将存放各种工具函数，然后新建 `cryptogram.ts` 文件：

```ts
import * as crypto from 'crypto';

/**
 * Make salt
 */
export function makeSalt(): string {
  return crypto.randomBytes(3).toString('base64');
}

/**
 * Encrypt password
 * @param password 密码
 * @param salt 密码盐
 */
export function encryptPassword(password: string, salt: string): string {
  if (!password || !salt) {
    return '';
  }
  const tempSalt = Buffer.from(salt, 'base64');
  return (
    // 10000 代表迭代次数 16代表长度
    crypto.pbkdf2Sync(password, tempSalt, 10000, 16, 'sha1').toString('base64')
  );
}
```

上面写了两个方法，一个是制作一个随机盐（salt），另一个是根据盐来加密密码。

这两个函数将贯穿注册和登录的功能。

## 二、用户注册

在写注册逻辑之前，我们需要先修改一下上一篇写过的代码，即 `user.service.ts` 中的 `findeOne()` 方法：

```ts
// src/logical/user/user.service.ts
import { Injectable } from '@nestjs/common';
import * as Sequelize from 'sequelize'; // 引入 Sequelize 库
import sequelize from '../../database/sequelize'; // 引入 Sequelize 实例

@Injectable()
export class UserService {
  /**
   * 查询是否有该用户
   * @param username 用户名
   */
  async findOne(username: string): Promise<any | undefined> {
    const sql = `
      SELECT
        user_id userId, account_name username, real_name realName, passwd password,
        passwd_salt salt, mobile, role
      FROM
        admin_user
      WHERE
        account_name = '${username}'
    `; // 一段平淡无奇的 SQL 查询语句
    try {
      const user = (
        await sequelize.query(sql, {
          type: Sequelize.QueryTypes.SELECT, // 查询方式
          raw: true, // 是否使用数组组装的方式展示结果
          logging: true, // 是否将 SQL 语句打印到控制台
        })
      )[0];
      // 若查不到用户，则 user === undefined
      return user;
    } catch (error) {
      console.error(error);
      return void 0;
    }
  }
}
```

现在，`findOne()` 的功能更符合它的方法名了，查到了，就返回用户信息，查不到，就返回 `undefined`。

接下来，我们开始编写注册功能：

```ts
// src/logical/user/user.service.ts
import { Injectable } from '@nestjs/common';
import * as Sequelize from 'sequelize'; // 引入 Sequelize 库
import sequelize from '../../database/sequelize'; // 引入 Sequelize 实例

import { makeSalt, encryptPassword } from '../../utils/cryptogram'; // 引入加密函数

@Injectable()
export class UserService {
  /**
   * 查询是否有该用户
   * @param username 用户名
   */
  async findOne(username: string): Promise<any | undefined> {
    ...
  }

  /**
   * 注册
   * @param requestBody 请求体
   */
  async register(requestBody: any): Promise<any> {
    const { accountName, realName, password, repassword, mobile } = requestBody;
    if (password !== repassword) {
      return {
        code: 400,
        msg: '两次密码输入不一致',
      };
    }
    const user = await this.findOne(accountName);
    if (user) {
      return {
        code: 400,
        msg: '用户已存在',
      };
    }
    const salt = makeSalt(); // 制作密码盐
    const hashPwd = encryptPassword(password, salt);  // 加密密码
    const registerSQL = `
      INSERT INTO admin_user
        (account_name, real_name, passwd, passwd_salt, mobile, user_status, role, create_by)
      VALUES
        ('${accountName}', '${realName}', '${hashPwd}', '${salt}', '${mobile}', 1, 3, 0)
    `;
    try {
      await sequelize.query(registerSQL, { logging: false });
      return {
        code: 200,
        msg: 'Success',
      };
    } catch (error) {
      return {
        code: 503,
        msg: `Service error: ${error}`,
      };
    }
  }
}

```

编写好后，在 `user.controller.ts` 中添加路由

```ts
// src/logical/user/user.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  // @Post('find-one')
  // findOne(@Body() body: any) {
  //   return this.usersService.findOne(body.username);
  // }

  @Post('register')
  async register(@Body() body: any) {
    return await this.usersService.register(body);
  }
}
```

现在，我们使用 Postman 来测试一下，先故意输入不一样的密码和已存在的用户名：

![](https://static.powerformer.com/c/@sO4iOISav/1589285020495-26e6018c-e8f6-4903-83ae-1fb07bfef758.webp)

如图，密码不一致的校验触发了。

然后，我们把密码改成一致的：

![](https://static.powerformer.com/c/@sO4iOISav/1589285020427-04cba9a1-45ee-4a63-8fb0-6baed5782322.webp)

如图，已有用户的校验触发了。

然后，我们再输入正确的参数：

![](https://static.powerformer.com/c/@sO4iOISav/1589285020425-8bf8d6f4-b378-4664-a377-8bb4bf4f59e6.webp)

我们再去数据库看一下：

![](https://static.powerformer.com/c/@sO4iOISav/1589285020828-503db24b-785c-4f3b-9092-d2ec20ba939f.webp)

发现已经将信息插入表中了，而且密码也是加密后的，至此，注册功能已基本完成。

## 三、JWT 的配置与验证

为了更直观的感受处理顺序，我在代码中加入了步骤打印

### 1. 安装依赖包

```ts
$ yarn add passport passport-jwt passport-local @nestjs/passport @nestjs/jwt -S

```

### 2. 创建 Auth 模块

```ts
$ nest g service auth logical
$ nest g module auth logical

```

### 3. 新建一个存储常量的文件

在 `auth` 文件夹下新增一个 `constants.ts`，用于存储各种用到的常量：

```ts
// src/logical/auth/constats.ts
export const jwtConstants = {
  secret: 'shinobi7414', // 秘钥
};
```

### 4. 编写 JWT 策略

在 `auth` 文件夹下新增一个 `jwt.strategy.ts`，用于编写 JWT 的验证策略：

```ts
// src/logical/auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  // JWT验证 - Step 4: 被守卫调用
  async validate(payload: any) {
    console.log(`JWT验证 - Step 4: 被守卫调用`);
    return {
      userId: payload.sub,
      username: payload.username,
      realName: payload.realName,
      role: payload.role,
    };
  }
}
```

### 5. 编写 auth.service.ts 的验证逻辑

```ts
// src/logical/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { encryptPassword } from '../../utils/cryptogram';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  // JWT验证 - Step 2: 校验用户信息
  async validateUser(username: string, password: string): Promise<any> {
    console.log('JWT验证 - Step 2: 校验用户信息');
    const user = await this.usersService.findOne(username);
    if (user) {
      const hashedPassword = user.password;
      const salt = user.salt;
      // 通过密码盐，加密传参，再与数据库里的比较，判断是否相等
      const hashPassword = encryptPassword(password, salt);
      if (hashedPassword === hashPassword) {
        // 密码正确
        return {
          code: 1,
          user,
        };
      } else {
        // 密码错误
        return {
          code: 2,
          user: null,
        };
      }
    }
    // 查无此人
    return {
      code: 3,
      user: null,
    };
  }

  // JWT验证 - Step 3: 处理 jwt 签证
  async certificate(user: any) {
    const payload = {
      username: user.username,
      sub: user.userId,
      realName: user.realName,
      role: user.role,
    };
    console.log('JWT验证 - Step 3: 处理 jwt 签证');
    try {
      const token = this.jwtService.sign(payload);
      return {
        code: 200,
        data: {
          token,
        },
        msg: `登录成功`,
      };
    } catch (error) {
      return {
        code: 600,
        msg: `账号或密码错误`,
      };
    }
  }
}
```

此时保存文件，控制台会报错：

![](https://static.powerformer.com/c/@sO4iOISav/1589285020424-b23efdd8-60bf-45cf-af7c-4828c0231b3f.webp)

可以先不管，这是因为还没有把 JwtService 和 UserService 关联到 auth.module.ts 中。

### 5. 编写本地策略

这一步非必须，根据项目的需求来决定是否需要本地策略

```ts
// src/logical/auth/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

### 6. 关联 Module

```ts
// src/logical/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '8h' }, // token 过期时效
    }),
    UserModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

此时保存文件，若还有上文的报错，则需要去 `app.module.ts`，将 `AuthService` 从 `providers` 数组中移除，并在 `imports` 数组中添加 `AuthModule` 即可：

```ts
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './logical/user/user.module';
// import { AuthService } from './logical/auth/auth.service';
import { AuthModule } from './logical/auth/auth.module';

@Module({
  imports: [UserModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 7. 编写 login 路由

此时，回归到 `user.controller.ts`，我们将组装好的 JWT 相关文件引入，并根据验证码来判断用户状态：

```ts
// src/logical/user/user.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UserService,
  ) {}

  // JWT验证 - Step 1: 用户请求登录
  @Post('login')
  async login(@Body() loginParmas: any) {
    console.log('JWT验证 - Step 1: 用户请求登录');
    const authResult = await this.authService.validateUser(
      loginParmas.username,
      loginParmas.password,
    );
    switch (authResult.code) {
      case 1:
        return this.authService.certificate(authResult.user);
      case 2:
        return {
          code: 600,
          msg: `账号或密码不正确`,
        };
      default:
        return {
          code: 600,
          msg: `查无此人`,
        };
    }
  }

  @Post('register')
  async register(@Body() body: any) {
    return await this.usersService.register(body);
  }
}
```

此时保存文件，同样的报错又出现了：

![](https://static.powerformer.com/c/@sO4iOISav/1589285020405-c16215e4-9b52-42c2-815c-9a5f7b5c898d.webp)

这次我们先去 `user.module.ts` 将 `controllers` 注释掉：

![](https://static.powerformer.com/c/@sO4iOISav/1589285020412-fdbb72bd-15cb-441b-bf12-05af43c05c5c.webp)

此时看控制台，没有 User 相关的路由，我们需要去 `app.module.ts` 将 Controller 添加回去：

![](https://static.powerformer.com/c/@sO4iOISav/1589285020471-874995cf-a15a-4715-b9ef-78a0ea0d2328.webp)

这么做是因为如果在 `user.module.ts` 中引入 `AuthService` 的话，就还要将其他的策略又引入一次，个人觉得很麻烦，就干脆直接用 app 来统一管理了。

## 四、登录验证

前面列了一大堆代码，是时候检验效果了，我们就按照原来注册的信息，进行登录请求：

![](https://static.powerformer.com/c/@sO4iOISav/1589285020419-4639eed7-8a53-4f0f-ab3e-8a43e05d80eb.webp)

![](https://static.powerformer.com/c/@sO4iOISav/1589285020435-c6ce0683-7c17-4f6b-a512-ac60c4a40b89.webp)

图中可以看到，已经返回了一长串 token 了，而且控制台也打印了登录的步骤和用户信息。前端拿到这个 token，就可以请求其他有守卫的接口了。

接下来我们试试输错账号或密码的情况：

![](https://static.powerformer.com/c/@sO4iOISav/1589285020438-96347679-4810-4ae6-bf4d-8514da969223.webp)

![](https://static.powerformer.com/c/@sO4iOISav/1589285020463-bd779597-4077-4d1f-97a4-44e8a6197d34.webp)

## 五、守卫

既然发放了 Token，就要能验证 Token，因此就要用到 Guard（守卫）了。

我们拿之前的注册接口测试一下，修改 `user.controller.ts` 的代码，引入 `UseGuards` 和 `AuthGuard`，并在路由上添加 `@UseGuards(AuthGuard('jwt'))`：

```ts
// src/logical/user/user.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth/auth.service';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly authService: AuthService, private readonly usersService: UserService) {}

  @Post('login')
  async login(@Body() loginParmas: any) {
    ...
  }

  @UseGuards(AuthGuard('jwt')) // 使用 'JWT' 进行验证
  @Post('register')
  async register(@Body() body: any) {
    return await this.usersService.register(body);
  }
}

```

然后，我们先来试试请求头没有带 token 的情况：

![](https://static.powerformer.com/c/@sO4iOISav/1589285020438-ea800021-d536-4778-8b5d-244b24fb0334.webp)

可以看到，返回 401 状态码，Unauthorized 表示未授权，也就是判断你没有登录。

现在，我们试试带 Token 的情况，把登录拿到的 Token 复制到 Postman 的 Authorzation 里（选择 Bearer Token）：

![](https://static.powerformer.com/c/@sO4iOISav/1589285020458-fe6b7c1a-8389-4f42-92c8-1eb2927fea18.webp)

然后再请求接口：

![](https://static.powerformer.com/c/@sO4iOISav/1589285020435-1d0c3fc8-1900-42a5-a0b2-570007bb952d.webp)

此时，已经可以正常访问了，再看看控制台打印的信息，步骤也正如代码中注释的那样：

![](https://static.powerformer.com/c/@sO4iOISav/1589285020490-5ed72be7-9f01-43de-896c-d81583c9dee6.webp)

至此，登录功能已基本完成。

## 总结

本篇介绍了如何使用 JWT 对用户登录进行 Token 签发，并在接受到含 Token 请求的时候，如何验证用户信息，从而实现了登录验证。

当然，实现登录验证并不局限于 JWT，还有很多方法，有兴趣的读者可以自己查阅。

这里也说一下 JWT 的缺点，主要是无法在使用同一账号登录的情况下，后登录的，挤掉先登录的，也就是让先前的 Token 失效，从而保证信息安全（至少我是没查到相关解决方法，如果有大神解决过该问题，还请指点），只能使用一些其他黑科技挤掉 Token（如 Redis）。

现在，注册、登录功能都有了，接下来应该完善一个服务端应有的其他公共功能。

下一篇将介绍拦截器、异常处理以及日志的收集。

> 本篇收录于[NestJS 实战教程](https://juejin.im/collection/5e893a1b6fb9a04d65a15400)，更多文章敬请关注。

`
