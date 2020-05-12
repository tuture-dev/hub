---
title: 'Nest.js 从零到壹系列（二）：使用 Sequelize 操作数据库'
description: '上一篇介绍了如何创建项目、路由的访问以及如何创建模块，这篇来讲讲数据库的连接与使用。'
tags: ['Nest.js']
categories: ['后端', 'Node.js', '进阶']
date: 2020-05-12T00:01:00.509Z
photos:
  - https://imgkr.cn-bj.ufileos.com/a064f372-1fc4-4fa1-8a5c-61e2e9048fa5.png
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

上一篇介绍了如何创建项目、路由的访问以及如何创建模块，这篇来讲讲数据库的连接与使用。

既然是后端项目，当然要能连上数据库，否则还不如直接写静态页面。

本教程使用的是 MySQL，有人可能会问为啥不用 MongoDB。。。呃，因为公司使用 MySQL，我也是结合项目经历写的教程，MongoDB 还没踩过坑，所以就不在这误人子弟了。

[GitHub 项目地址](https://github.com/SephirothKid/nest-zero-to-one)，欢迎各位大佬 Star。

## 一、MySQL 准备

首先要确保你有数据库可以连接，如果没有，可以在 MySQL 官网下载一个，本地跑起来。安装教程这里就不叙述了，“百度一下，你就知道”。

推荐使用 Navicat Premium 可视化工具来管理数据库。

用 Navicat 连接上数据库后，新建一个库：

![](https://imgkr.cn-bj.ufileos.com/a4cde240-c244-44dc-9570-bd4c84bd275c.webp)

![](https://imgkr.cn-bj.ufileos.com/f3fccc3a-5e47-44fa-afe8-870c603e3520.webp)

点开我们刚创建的库 `nest_zero_to_one`，点开 Tables，发现里面空空如也，接下来我们创建一张新表，点开上面工具栏的 Query，并新增查询：

![](https://imgkr.cn-bj.ufileos.com/856ba5e6-c84f-4c2b-a8ff-00a918aced6c.webp)

将下列代码复制到框内，点击上面的运行，即可完成表的创建：

```ts
CREATE TABLE `admin_user` (
  `user_id` smallint(6) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `account_name` varchar(24) NOT NULL COMMENT '用户账号',
  `real_name` varchar(20) NOT NULL COMMENT '真实姓名',
  `passwd` char(32) NOT NULL COMMENT '密码',
  `passwd_salt` char(6) NOT NULL COMMENT '密码盐',
  `mobile` varchar(15) NOT NULL DEFAULT '0' COMMENT '手机号码',
  `role` tinyint(4) NOT NULL DEFAULT '3' COMMENT '用户角色：0-超级管理员|1-管理员|2-开发&测试&运营|3-普通用户（只能查看）',
  `user_status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '状态：0-失效|1-有效|2-删除',
  `create_by` smallint(6) NOT NULL COMMENT '创建人ID',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` smallint(6) NOT NULL DEFAULT '0' COMMENT '修改人ID',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
  PRIMARY KEY (`user_id`),
  KEY `idx_m` (`mobile`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='后台用户表';

```

![](https://imgkr.cn-bj.ufileos.com/579870eb-5b09-4b5a-9de4-a98f3c575716.webp)

然后我们可以看到，左边的 `Tables` 下多出了 `admin_user` 表，点开就可以看到字段信息了：

![](https://imgkr.cn-bj.ufileos.com/8c409742-84d9-4148-ab18-78067c46f06b.webp)

我们先随便插入 2 条数据，方便后面的查询：

![](https://imgkr.cn-bj.ufileos.com/1c6c09f4-adf6-41f0-8c70-be38499fdf09.webp)

## 二、项目的数据库配置

先在项目根目录创建一个文件夹 `config`（与 `src` 同级），专门放置各种配置。

然后新建一个文件 `db.ts`:

```ts
// config/db.ts
const productConfig = {
  mysql: {
    port: '数据库端口',
    host: '数据库地址',
    user: '用户名',
    password: '密码',
    database: 'nest_zero_to_one', // 库名
    connectionLimit: 10, // 连接限制
  },
};

const localConfig = {
  mysql: {
    port: '数据库端口',
    host: '数据库地址',
    user: '用户名',
    password: '密码',
    database: 'nest_zero_to_one', // 库名
    connectionLimit: 10, // 连接限制
  },
};

// 本地运行是没有 process.env.NODE_ENV 的，借此来区分[开发环境]和[生产环境]
const config = process.env.NODE_ENV ? productConfig : localConfig;

export default config;
```

> Ps：这个文件是不同步到 github 的，需要各位读者结合实际情况配置

市面上有很多连接数据库的工具，笔者这里使用的是 `Sequelize`，先安装依赖包：

```ts
$ npm i sequelize sequelize-typescript mysql2 -S
或
$ yarn add sequelize sequelize-typescript mysql2 -S

```

然后在 `src` 目录下创建文件夹 `database`，然后再创建 `sequelize.ts`：

```ts
// src/database/sequelize.ts
import { Sequelize } from 'sequelize-typescript';
import db from '../../config/db';

const sequelize = new Sequelize(
  db.mysql.database,
  db.mysql.user,
  db.mysql.password || null,
  {
    // 自定义主机; 默认值: localhost
    host: db.mysql.host, // 数据库地址
    // 自定义端口; 默认值: 3306
    port: db.mysql.port,
    dialect: 'mysql',
    pool: {
      max: db.mysql.connectionLimit, // 连接池中最大连接数量
      min: 0, // 连接池中最小连接数量
      acquire: 30000,
      idle: 10000, // 如果一个线程 10 秒钟内没有被使用过的话，那么就释放线程
    },
    timezone: '+08:00', // 东八时区
  },
);

// 测试数据库链接
sequelize
  .authenticate()
  .then(() => {
    console.log('数据库连接成功');
  })
  .catch((err: any) => {
    // 数据库连接失败时打印输出
    console.error(err);
    throw err;
  });

export default sequelize;
```

## 三、数据库连接测试

好了，接下来我们来测试一下数据库的连接情况。

我们重写 `user.service.ts` 的逻辑：

```ts
// src/logical/user/user.service.ts
import { Injectable } from '@nestjs/common';
import * as Sequelize from 'sequelize'; // 引入 Sequelize 库
import sequelize from '../../database/sequelize'; // 引入 Sequelize 实例

@Injectable()
export class UserService {
  async findOne(username: string): Promise<any | undefined> {
    const sql = `
      SELECT
        user_id id, real_name realName, role
      FROM
        admin_user
      WHERE
        account_name = '${username}'
    `; // 一段平淡无奇的 SQL 查询语句
    try {
      const res = await sequelize.query(sql, {
        type: Sequelize.QueryTypes.SELECT, // 查询方式
        raw: true, // 是否使用数组组装的方式展示结果
        logging: true, // 是否将 SQL 语句打印到控制台，默认为 true
      });
      const user = res[0]; // 查出来的结果是一个数组，我们只取第一个。
      if (user) {
        return {
          code: 200, // 返回状态码，可自定义
          data: {
            user,
          },
          msg: 'Success',
        };
      } else {
        return {
          code: 600,
          msg: '查无此人',
        };
      }
    } catch (error) {
      return {
        code: 503,
        msg: `Service error: ${error}`,
      };
    }
  }
}
```

保存文件，就会看到控制台刷新了（前提是使用 `yarn start:dev` 启动的），并打印下列语句：

![](https://imgkr.cn-bj.ufileos.com/0f38e42e-e98d-4a7a-8d0e-9082a85ec18e.webp)

这说明之前的配置生效了，我们试着用之前的参数请求一下接口：

![](https://imgkr.cn-bj.ufileos.com/7117cf66-1257-4bc2-8809-fe62e5a1135c.webp)

返回“查无此人”，说明数据库没有叫“Kid”的用户。

我们改成正确的已存在的用户名再试试：

![](https://imgkr.cn-bj.ufileos.com/be1bba7d-d722-4328-b6ed-1cb24f8e67af.webp)

然后观察一下控制台，我们的查询语句已经打印出来了，通过 `logging: true`，可以在调试 Bug 的时候，更清晰的查找 SQL 语句的错误，不过建议测试稳定后，上线前关闭，不然记录的日志会很繁杂：

![](https://imgkr.cn-bj.ufileos.com/6b1e8a04-fb52-49af-90c0-2f47714a6729.webp)

再对照一下数据库里的表，发现查出来的数据和数据库里的一致，至此，MySQL 连接测试完成，以后就可以愉快的在 Service 里面搬砖了。

## 总结

这篇介绍了 MySQL 的数据准备、Sequelize 的配置、Nest 怎么通过 Sequelize 连接上 MySQL，以及用一条简单的查询语句去验证连接情况。

在这里，**强烈建议使用写原生 SQL 语句去操作数据库**。

虽然 Sequelize 提供了很多便捷的方法，具体可去 [Sequelize v5 官方文档](https://sequelize.org/v5/) 浏览学习。但笔者通过观察 `logging` 打印出来的语句发现，其实多了很多无谓的操作，在高并发的情况下，太影响性能了。

而且如果不使用原生查询，那么就要建立对象映射到数据库表，然后每次工具更新，还要花时间成本去学习，如果数据库改了字段，那么映射关系就会出错，然后项目就会疯狂报错以致宕机（亲身经历）。

而使用原生 SQL，只需要学一种语言就够了，换个工具，也能用，而且就算改了字段，也只会在请求接口的时候报错，到时候再针对那个语句修改就好了，而且现在查找替换功能这么强大，批量修改也不是难事。

最重要的是，如果你是从前端转后端，或者根本就是 0 基础到后端，还是建议先把 SQL 的基础打牢，不然连 `JOIN`、`LEFT JOIN` 和 `RIGHT JOIN` 的区别都分不清（我们公司就有个三年经验的后端，乱用 `LEFT JOIN`，然后被 DB 主管一顿痛骂。。。真事儿）。

多写、多分析、多看控制台报错、多从性能上考虑，才是最快入门的途径。

> 注意：在写 UPDATE 更新语句的时候，一定要加上 WHERE 条件，一定要加上 WHERE 条件，一定要加上 WHERE 条件，重要的事情说 3 遍，血与泪的教训！！！

![](https://imgkr.cn-bj.ufileos.com/f0eb0921-bf49-47e1-8af0-9a65f72e3d79.webp)

下一篇，将介绍如何使用 JWT（Json Web Token）进行单点登录。

> 本篇收录于[NestJS 实战教程](https://juejin.im/collection/5e893a1b6fb9a04d65a15400)，更多文章敬请关注。

`
