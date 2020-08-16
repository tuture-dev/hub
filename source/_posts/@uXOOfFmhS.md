---
title: 'Nest.js 从零到壹系列（六）：用 15 行代码实现 RBAC 0'
description: '上一篇介绍了如何使用 DTO 和管道对入参进行验证，接下来介绍一下如何用拦截器，实现后台管理系统中最复杂、也最令人头疼的 RBAC。'
tags: ['Nest.js']
categories: ['后端', 'Node.js', '进阶']
date: 2020-05-12T00:05:00.509Z
photos:
  - https://static.tuture.co/c/%40uXOOfFmhS/6.jpg
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

上一篇介绍了如何使用 DTO 和管道对入参进行验证，接下来介绍一下如何用拦截器，实现后台管理系统中最复杂、也最令人头疼的 RBAC。
[GitHub 项目地址](https://github.com/SephirothKid/nest-zero-to-one)，欢迎各位大佬 Star。

## RBAC

### 1. 什么是 RBAC ？

RBAC：基于角色的权限访问控制（Role-Based Access Control），是商业系统中最常见的权限管理技术之一。在 RBAC 中，权限与角色相关联，用户通过成为适当角色的成员而得到这些角色的权限。这就极大地简化了权限的管理。

### 2. RBAC 模型的分类

RBAC 模型可以分为：RBAC 0、RBAC 1、RBAC 2、RBAC 3 四种。
其中 RBAC 0 是基础，也是最简单的，相当于底层逻辑。RBAC 1、RBAC 2、RBAC 3 都是以 RBAC 0 为基础的升级。

#### 2.1 RBAC 0

最简单的用户、角色、权限模型。这里面又包含了 2 种：

- 用户和角色是多对一关系，即：一个用户只充当一种角色，一种角色可以有多个用户担当。
- 用户和角色是多对多关系，即：一个用户可同时充当多种角色，一种角色可以有多个用户担当。

一般情况下，使用 RBAC 0 模型就可以满足常规的权限管理系统设计了。

![](https://static.tuture.co/c/@uXOOfFmhS/1589284795143-9d5f6ad5-475f-4330-93d7-663b0d7be51a.webp)

#### 2.2 RBAC 1

相对于 RBAC0 模型，增加了子角色，引入了继承概念，即子角色可以继承父角色的所有权限。

#### 2.3 RBAC 2

基于 RBAC0 模型，增加了对角色的一些限制：角色互斥、基数约束、先决条件角色等。

- 【角色互斥】：同一用户不能分配到一组互斥角色集合中的多个角色，互斥角色是指权限互相制约的两个角色。案例：财务系统中一个用户不能同时被指派给会计角色和审计员角色。
- 【基数约束】：一个角色被分配的用户数量受限，它指的是有多少用户能拥有这个角色。例如：一个角色专门为公司 CEO 创建的，那这个角色的数量是有限的。
- 【先决条件角色】：指要想获得较高的权限，要首先拥有低一级的权限。例如：先有副总经理权限，才能有总经理权限。
- 【运行时互斥】：例如，允许一个用户具有两个角色的成员资格，但在运行中不可同时激活这两个角色。

#### 2.4 RBAC 3

称为统一模型，它包含了 RBAC 1 和 RBAC 2，利用传递性，也把 RBAC 0 包括在内，综合了 RBAC 0、RBAC 1 和 RBAC 2 的所有特点，这里就不在多描述了。

## 具体实现

由于是入门教程，这里只演示 RBAC 0 模型的实现，即一个用户只能有一种角色，不存在交叉关系。
正所谓：道生一，一生二，二生三，三生万物。学会 RBAC 0 之后，相信读者们一定能结合概念，继续扩展权限系统的。
其实 RBAC 0 实现起来非常简单，简单到核心代码都不超过 15 行。
![](https://static.tuture.co/c/@uXOOfFmhS/1589284795133-4ae9f836-e204-453e-9fb5-88cf932cfe80.webp)

### 1. 拦截器逻辑编写

还记得第三篇签发 Token 的时候，有个 role 字段么？那个就是用户角色，下面我们针对 Token 的 role 字段进行展开。先新建文件：

```ts
$ nest g interceptor rbac interceptor

```

```ts
// src/interceptor/rbac.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
@Injectable()
export class RbacInterceptor implements NestInterceptor {
  // role[用户角色]: 0-超级管理员 | 1-管理员 | 2-开发&测试&运营 | 3-普通用户（只能查看）
  constructor(private readonly role: number) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.getArgByIndex(1).req;
    if (req.user.role > this.role) {
      throw new ForbiddenException('对不起，您无权操作');
    }
    return next.handle();
  }
}
```

上面就是验证的核心代码，抛开注释，总共才 15 行，
构造器里的 `role: number` 是通过路由传入的可配置参数，表示必须小于等于这个数字的角色才能访问。通过获取用户角色的数字，和传入的角色数字进行比较即可。

### 2. 测试准备

和第二篇一样，直接复制下列 SQL 语句 到 navicat 查询模块，运行，创建新表：

```ts
CREATE TABLE `commodity` (
 `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '商品ID',
 `ccolumn_id` smallint(6) NOT NULL COMMENT '商品_栏目ID',
 `commodity_name` varchar(10) NOT NULL COMMENT '商品_名称',
 `commodity_desc` varchar(20) NOT NULL COMMENT '商品_介绍',
 `market_price` decimal(7,2) NOT NULL DEFAULT '0.00' COMMENT '市场价',
 `sale_money` decimal(7,2) NOT NULL DEFAULT '0.00' COMMENT '销售价',
 `c_by` varchar(24) NOT NULL COMMENT '创建人',
 `c_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
 `u_by` varchar(24) NOT NULL DEFAULT '0' COMMENT '修改人',
 `u_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
 PRIMARY KEY (`id`),
 KEY `idx_ccid` (`ccolumn_id`),
 KEY `idx_cn` (`commodity_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='商品表';

```

![](https://static.tuture.co/c/@uXOOfFmhS/1589284795169-1ed96e98-f807-458f-a324-dd8a29143ac6.webp)

### 3. 编写业务逻辑

创建 commodity 模块，之前的教程已经教过，这里不再赘述，直接切入正题，先编写 Service：

```ts
// src/logical/commodity/commodity.service.js
import { Injectable } from '@nestjs/common';
import * as Sequelize from 'sequelize'; // 引入 Sequelize 库
import sequelize from '../../database/sequelize'; // 引入 Sequelize 实例
@Injectable()
export class CommodityService {
  /**
   * 查询商品列表
   * @param {*} body
   * @param {string} username
   * @returns {Promise<any>}
   * @memberof CommodityService
   */
  async queryCommodityList(body: any): Promise<any> {
    const { pageIndex = 1, pageSize = 10, keywords = '' } = body;
    // 分页查询条件
    const currentIndex =
      (pageIndex - 1) * pageSize < 0 ? 0 : (pageIndex - 1) * pageSize;
    const queryCommodityListSQL = `
     SELECT
       id, ccolumn_id columnId, commodity_name name, commodity_desc description,
       sale_money saleMoney, market_price marketPrice,
       c_by createBy, DATE_FORMAT(c_time, '%Y-%m-%d %H:%i:%s') createTime,
       u_by updateBy, DATE_FORMAT(u_time, '%Y-%m-%d %H:%i:%s') updateTime
     FROM
       commodity
     WHERE
       commodity_name LIKE '%${keywords}%'
     ORDER BY
       id DESC
     LIMIT ${currentIndex}, ${pageSize}
   `;
    const commodityList: any[] = await sequelize.query(queryCommodityListSQL, {
      type: Sequelize.QueryTypes.SELECT,
      raw: true,
      logging: false,
    });

    // 统计数据条数
    const countCommodityListSQL = `
     SELECT
       COUNT(*) AS total
     FROM
       commodity
     WHERE
       commodity_name LIKE '%${keywords}%'
   `;
    const count: any = (
      await sequelize.query(countCommodityListSQL, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true,
        logging: false,
      })
    )[0];
    return {
      code: 200,
      data: {
        commodityList,
        total: count.total,
      },
    };
  }
  /**
   * 创建商品
   *
   * @param {*} body
   * @param {string} username
   * @returns {Promise<any>}
   * @memberof CommodityService
   */
  async createCommodity(body: any, username: string): Promise<any> {
    const {
      columnId = 0,
      name,
      description = '',
      marketPrice = 0,
      saleMoney = 0,
    } = body;
    const createCommoditySQL = `
     INSERT INTO commodity
       (ccolumn_id, commodity_name, commodity_desc, market_price, sale_money, c_by)
     VALUES
       ('${columnId}', '${name}', '${description}', ${marketPrice}, ${saleMoney}, '${username}');
   `;
    await sequelize.query(createCommoditySQL, { logging: false });
    return {
      code: 200,
      msg: 'Success',
    };
  }
  /**
   * 修改商品
   *
   * @param {*} body
   * @param {string} username
   * @returns
   * @memberof CommodityService
   */
  async updateCommodity(body: any, username: string) {
    const { id, columnId, name, description, saleMoney, marketPrice } = body;
    const updateCommoditySQL = `
     UPDATE
       commodity
     SET
       ccolumn_id = ${columnId},
       commodity_name = '${name}',
       commodity_desc = '${description}',
       market_price = ${marketPrice},
       sale_money = ${saleMoney},
       u_by = '${username}'
     WHERE
       id = ${id}
   `;
    const transaction = await sequelize.transaction();
    await sequelize.query(updateCommoditySQL, { transaction, logging: false });
    return {
      code: 200,
      msg: 'Success',
    };
  }
  /**
   * 删除商品
   *
   * @param {*} body
   * @returns
   * @memberof CommodityService
   */
  async deleteCommodity(body: any) {
    const { id } = body;
    const deleteCommoditySQL = `
     DELETE FROM
       commodity
     WHERE
       id = ${id}
   `;
    await sequelize.query(deleteCommoditySQL, { logging: false });
    return {
      code: 200,
      msg: 'Success',
    };
  }
}
```

上面的代码就包含了增、删、改、查，基本就涵盖了平时 80% 的搬砖内容。为了快速验证效果，这里就没有使用 DTO 进行参数验证，平时大家还是要加上比较好。
接下来编写 Controller，并引入 RBAC 拦截器：

```ts
// src/logical/commodity/commodity.controller.js
import {
  Controller,
  Request,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommodityService } from './commodity.service';
import { RbacInterceptor } from '../../interceptor/rbac.interceptor';
@Controller('commodity')
export class CommodityController {
  constructor(private readonly commodityService: CommodityService) {}
  // 查询商品列表
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(new RbacInterceptor(3)) // 调用 RBAC 拦截器
  @Post('list')
  async queryColumnList(@Body() body: any) {
    return await this.commodityService.queryCommodityList(body);
  }
  // 新建商品
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(new RbacInterceptor(2))
  @Post('create')
  async createCommodity(@Body() body: any, @Request() req: any) {
    return await this.commodityService.createCommodity(body, req.user.username);
  }
  // 修改商品
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(new RbacInterceptor(2))
  @Post('update')
  async updateCommodity(@Body() body: any, @Request() req: any) {
    return await this.commodityService.updateCommodity(body, req.user.username);
  }
  // 删除商品
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(new RbacInterceptor(1))
  @Post('delete')
  async deleteCommodity(@Body() body: any) {
    return await this.commodityService.deleteCommodity(body);
  }
}
```

和平时的路由没什么区别，就是使用了 `@UseInterceptors(new RbacInterceptor())`，并把数字传入，这样就可以判断权限了。

### 4. 验证

这是之前注册的用户表，在没有修改权限的情况下，角色 `role` 都是 `3`：
![](https://static.tuture.co/c/@uXOOfFmhS/1589284795306-a9904eb2-e1f6-4aaa-84eb-919e2d98d4af.webp)
先往商品表插入一些数据：
![](https://static.tuture.co/c/@uXOOfFmhS/1589284795354-81463b00-2f2e-4282-97f6-a01f4ac42ff1.webp)
我将使用 `nodejs` 用户登录，并请求查询接口：
![](https://static.tuture.co/c/@uXOOfFmhS/1589284795322-4905b86b-8fe4-4ea8-84f2-23797ed90883.webp)
上图的查询结果，也符合预期，共有 2 条商品名称含有关键字 `德玛`。
接下来，我们新建商品（英雄）：
![](https://static.tuture.co/c/@uXOOfFmhS/1589284795553-f827336a-5c1a-45ea-813f-59867267bca8.webp)
上图可以看到，因为权限不足，所以被拦截了。
我们直接去数据库修改角色 role 字段，将 `3（普通用户）` 改为 `2（开发&测试&运营）`：
![](https://static.tuture.co/c/@uXOOfFmhS/1589284795347-49b68fd2-6fd4-44a8-8cba-5ad76de51dce.webp)
然后，**重新登录，重新登录，重新登录，重要的事情说 3 遍**，再请求：
![](https://static.tuture.co/c/@uXOOfFmhS/1589284795843-ac23ee51-d753-4937-8140-afd1706e56d2.webp)
返回成功信息，再看看数据库：
![](https://static.tuture.co/c/@uXOOfFmhS/1589284795401-68dcb551-cc5a-4e60-afcb-5993f8489148.webp)
如图，创建商品功能测试成功。
但是，“麦林炮手”的价格应该是 1350，我们修改一下价格：
![](https://static.tuture.co/c/@uXOOfFmhS/1589284795245-85277fbf-51b4-49e0-a338-e00d9324ddff.webp)
再看看数据库，通过 `u_by` 字段可以知道是通过接口修改的：
![](https://static.tuture.co/c/@uXOOfFmhS/1589284795170-e67298a7-8ae5-465f-9932-addd4887aa35.webp)
现在问题来了，因为麦林炮手的介绍不太“和谐”，所以需要删除，于是我们请求一下删除接口：
![](https://static.tuture.co/c/@uXOOfFmhS/1589284795351-8951a956-e246-4b19-9be0-8bea28ef183d.webp)
返回“无权操作”，只好提升角色，或者联系管理员帮忙删除啦，剩下的事情和之前的一样，不再赘述。

### 5. 优化

大家可能发现，因为传入的是数字，所以在 Controller 里写的也都是数字，如果是一个人维护的还好，但是多人协同时，就显得不够友好了。
于是，我们应该创建常量，将角色和数字对应上，这样再看 Controller 的时候，哪些接口有哪些角色可以访问就一目了然了。
我们修改 auth 目录下的 `constants.ts`

```ts
// src/logical/auth/constants.ts
export const jwtConstants = {
  secret: 'shinobi7414',
};
export const roleConstans = {
  SUPER_ADMIN: 0, // 超级管理员
  ADMIN: 1, // 管理员
  DEVELOPER: 2, // 开发者（测试、运营具有同一权限，若提升为 RBAC 1 以上，则可酌情分开）
  HUMAN: 3, // 普通用户
};
```

然后修改 Controller，用常量替换数字：

```ts
// src/logical/commodity/commodity.controller.js
import {
  Controller,
  Request,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommodityService } from './commodity.service';
import { RbacInterceptor } from '../../interceptor/rbac.interceptor';
import { roleConstans as role } from '../auth/constants'; // 引入角色常量
@Controller('commodity')
export class CommodityController {
  constructor(private readonly commodityService: CommodityService) {}
  // 查询商品列表
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(new RbacInterceptor(role.HUMAN))
  @Post('list')
  async queryColumnList(@Body() body: any) {
    return await this.commodityService.queryCommodityList(body);
  }
  // 新建商品
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(new RbacInterceptor(role.DEVELOPER))
  @Post('create')
  async createCommodity(@Body() body: any, @Request() req: any) {
    return await this.commodityService.createCommodity(body, req.user.username);
  }
  // 修改商品
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(new RbacInterceptor(role.DEVELOPER))
  @Post('update')
  async updateCommodity(@Body() body: any, @Request() req: any) {
    return await this.commodityService.updateCommodity(body, req.user.username);
  }
  // 删除商品
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(new RbacInterceptor(role.ADMIN))
  @Post('delete')
  async deleteCommodity(@Body() body: any) {
    return await this.commodityService.deleteCommodity(body);
  }
}
```

如此一来，什么角色才有权限操作就一目了然。

## 2020-3-31 更新：使用 Guard 守卫控制权限

评论区有大神指出，应该使用 Guard 来管理角色相关，因此，在这里补充一下 Guard 的实现。
新建 Guard 文件：

```ts
$ nest g guard rbac guards

```

编写守卫逻辑：

```ts
// src/guards/rbac.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
@Injectable()
export class RbacGuard implements CanActivate {
  // role[用户角色]: 0-超级管理员 | 1-管理员 | 2-开发&测试&运营 | 3-普通用户（只能查看）
  constructor(private readonly role: number) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (user.role > this.role) {
      throw new ForbiddenException('对不起，您无权操作');
    }
    return true;
  }
}
```

去掉注释和 TSLint 的换行，同样不超过 15 行，接下来，在 Controller 里引入：

```ts
// src/logical/commodity/commodity.controller.ts
import {
  Controller,
  Request,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommodityService } from './commodity.service';
import { RbacInterceptor } from '../../interceptor/rbac.interceptor';
import { RbacGuard } from '../../guards/rbac.guard';
import { roleConstans as role } from '../auth/constants';
@Controller('commodity')
export class CommodityController {
  constructor(private readonly commodityService: CommodityService) {}
  // 查询商品列表
  @UseGuards(new RbacGuard(role.HUMAN))
  @UseGuards(AuthGuard('jwt'))
  // @UseInterceptors(new RbacInterceptor(role.HUMAN))
  @Post('list')
  async queryColumnList(@Body() body: any) {
    return await this.commodityService.queryCommodityList(body);
  }
  // 新建商品
  @UseGuards(new RbacGuard(role.DEVELOPER))
  @UseGuards(AuthGuard('jwt'))
  // @UseInterceptors(new RbacInterceptor(role.DEVELOPER))
  @Post('create')
  async createCommodity(@Body() body: any, @Request() req: any) {
    return await this.commodityService.createCommodity(body, req.user.username);
  }
  // 修改商品
  @UseGuards(new RbacGuard(role.DEVELOPER))
  @UseGuards(AuthGuard('jwt'))
  // @UseInterceptors(new RbacInterceptor(role.DEVELOPER))
  @Post('update')
  async updateCommodity(@Body() body: any, @Request() req: any) {
    return await this.commodityService.updateCommodity(body, req.user.username);
  }
  // 删除商品
  @UseGuards(new RbacGuard(role.ADMIN))
  @UseGuards(AuthGuard('jwt'))
  // @UseInterceptors(new RbacInterceptor(role.ADMIN))
  @Post('delete')
  async deleteCommodity(@Body() body: any) {
    return await this.commodityService.deleteCommodity(body);
  }
}
```

> 注意：RbacGuard 要在 AuthGuard 的上面，不然获取不到用户信息。
> 请求一下只有管理员才有权限的删除操作：
> ![](https://static.tuture.co/c/@uXOOfFmhS/1589284795291-067c6b3f-2e0c-46ba-8622-9cc5237b24c2.webp)
> 涛声依旧。

## 总结

本篇介绍了 RBAC 的概念，以及如何使用拦截器和守卫实现 RBAC 0，原理简单到 15 行代码就搞定了。
然而这种设计，要求路由必须是一一对应的，遇到复杂的用户关系，还需要再建 3 张表，一张是 `权限` 表，一张是 `用户-权限` 对应表，还有一张是 `路由-权限` 对应表，这样基本能覆盖 RBAC 2 以上的需求了。
但万变不离其宗，基本就是在拦截器或守卫里做文章，用户登录后，将权限列表缓存起来（可以是 Redis），这样就不用每次都查表去判断有没有权限访问路由了。
下一篇，暂时还不知道要介绍什么，清明节前事有点多，可能是使用 Swagger 自动生成接口文档吧。
![](https://static.tuture.co/c/@uXOOfFmhS/1589284795242-b502bf8e-5650-41b3-97c7-1928e63efa09.gif)

> 本篇收录于[NestJS 实战教程](https://juejin.im/collection/5e893a1b6fb9a04d65a15400)，更多文章敬请关注。

## 参考资料

[RBAC 模型：基于用户 - 角色 - 权限控制的一些思考](http://www.woshipm.com/pd/1150093.html)
`
