---
title: "使用原生开发高仿瑞幸小程序（四）：编写云函数并连接云数据库"
description: "通过云函数，我们将拥有编写服务端代码的能力。我们可以在服务端执行一些逻辑，可以上传图片，可以调用其他网络服务的api，可以对数据库进行操作。重要的是，云函数的编写相当简洁，便利。在这一节，我们将通过云函数获取“为你推荐”的产品数据，实现数据动态化。"
tags: ["微信小程序"]
categories: ["小程序", "原生微信小程序", "入门"]
date: 2020-06-08T00:00:04.509Z
photos:
  - https://imgkr.cn-bj.ufileos.com/1061d864-ead2-4f77-8ac6-73b3d6b0baca.png
---

<div class="profileBox">
  <div class="avatarBox">
    <a href="https://github.com/gogoswift"><img src="/images/avatars/zw.png" alt="" class="avatar"></a>
  </div>
  <div class="rightBox">
    <div class="infoBox">
    <a href="https://www.infoq.cn/profile/1076117/publish"><p class="nickName">喵先森</p></a>
  </div>
  <div class="codeBox">
    <a href="https://github.com/gogoswift/luckin"><span class="codeText">查看代码</span></a>
  </div>
  </div>
</div>

## 编写第一个云函数

通过云函数，我们将拥有编写服务端代码的能力。我们可以在服务端执行一些逻辑，可以上传图片，可以调用其他网络服务的api，可以对数据库进行操作。重要的是，云函数的编写相当简洁，便利。
在这一节，我们将通过云函数获取“为你推荐”的产品数据，实现数据动态化。实现这一功能，我们需要学习以下三块内容：

{% note warning %}
因 Hexo 中双大括号是模板引擎语法，所以本系列中遇到的所有双大括号均修改成了 `{}}` 左单括号，右双大括号的形式，读者在实际写代码的时候需要写出左右都是双大括号。
{% endnote %}

> 1 创建第一个云函数
> 2 调用云函数
> 3 学会绑定点击事件

#### 一 创建第一个云函数
如何创建云函数呢？我们这里通过“微信开发者工具”来完成云函数的创建和代码编写。
首先，我们右键单击“cloudfunctions”，选择“新建Node.js云函数” 
![](https://imgkr.cn-bj.ufileos.com/101867f9-3418-438e-a37b-823b6667e3e1.png)
写上我们的函数名“client_home_get_best”，这时候，工具会为我们创建一个同名文件夹，文件夹下面有一些文件，如下图： 
![](https://imgkr.cn-bj.ufileos.com/0eae8b34-3451-428f-878b-594080a27d3b.png)
接下来我们要做的是安装wx-server-sdk依赖，怎么做呢？右键点击新建的云函数文件夹，选择“在终端打开”。
![](https://imgkr.cn-bj.ufileos.com/484101f8-9175-44e0-8c27-9716ed5e4f2d.jpeg)
在打开的终端中输入“npm install --save wx-server-sdk@latest” 敲下回车并等待依赖下载完成。如下图：
![](https://imgkr.cn-bj.ufileos.com/1cb37ded-be92-45a0-b857-cfc78ab8f2f7.png)
当安装完依赖后，我们的云函数文件夹也起了变化。多了node_modules文件夹和package-lock.json文件。
![](https://imgkr.cn-bj.ufileos.com/503cd877-7455-41a7-9ff8-a14f58ae3d5b.png)
对于目前的我们来讲，只有index.js文件是最重要的，之后我们会在这个js文件中编写我们的代码。先来看看工具默认都生成了什么代码：

```javascript
// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}
```
从上往下解读代码，先是引入了wx-server-sdk，接着进行了初始化了。
诚如注释所述，我们的主要工作就是在“云函数入口函数”内编写代码。我们要写什么代码呢？我们要在这里返回“为你推荐”模块的数据，在这一节，我们只返回4个产品。在下一节，我们会结合数据库，从产品数据库中随机抽取4个返回。
Ok，在具体编码之前，我想先对返回的数据做一个约定。
我需要status字段来告诉客户端，获取数据是成功了（success）还是失败了（fail）。
我需要一个msg字段来返回一些信息，虽然，这次用不着，但是我还是想先做好约定。
我还需要一个data字段来返回推荐产品的数据。所以返回数据的格式应该像下面这个样子。

```javascript
return {
    status: status,
    msg: msg,
    data: data,
}
```
我们还需要做的是，把推荐的产品数据赋值给data。
那么，云函数入口函数的完整代码就该是这样：

```javascript
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const status = "success"
  const msg = ""
  const data = [{
      name: "拿铁",
      oPrice: 24,
      nPrice: 12,
      thum: "cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/menu/thum/88F34543128D-1.jpeg"
    },
    {
      name: "提拉米苏爱摩卡",
      oPrice: 19,
      nPrice: 28,
      thum: "cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/menu/thum/7B69340506EC-1.jpeg"
    },
    {
      name: "陨石拿铁",
      oPrice: 28,
      nPrice: 16.8,
      thum: "cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/menu/thum/82B1B9FDDB21-1.jpeg"
    },
    {
      name: "榛果拿铁",
      oPrice: 28,
      nPrice: 16.8,
      thum: "cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/menu/thum/FBD8B7AADBD9-1.jpeg"
    }
  ]
  return {
    status: status,
    msg: msg,
    data: data,
  }
}
```
当我们写完云函数之后，我们需要把云函数上传到云开发的服务器上。怎么做呢？其实也很简单，我们只需要右键单击云函数的文件夹，选择“上传并部署：云端安装依赖（不上传node_modules）”
![](https://imgkr.cn-bj.ufileos.com/e2d1f569-2b98-43ad-b581-77b3d116a3ed.png)
至此我们就完成了云函数的编写，接下来我们需要对云函数进行调用。
#### 二 调用云函数
在小程序中，调用云函数是一件非常简单的事。我们只需要用过wx.cloud.callFunction即可。同时，小程序对云函数的调用是支持Promise风格的。什么是Promise？这对于js来说是个神器啊。我们有没有必要讲一下Promise，是有必要呢？还是有必要呢？
我们还是简单说一下Promise吧。简单的说，就是用来处理异步回调的神器。像获取网络数据就是一个典型的异步操作。对于我们来讲，只需要熟练使用.then()和.catch()就好。
现在，让我们回到云函数的回调上来。我们回想一下，什么时候会去调用云函数？1是界面初始化的时候，还有就是“换一批”和“刷新”图标被点击的时候。所以我们需要把调用云函数的代码写成一个函数：

```javascript
onGetBest
```
这个函数我们写在methods块内。

```javascript
/**
* 组件的方法列表
*/
methods: {
onGetBest:function(){
  wx.cloud.callFunction({
    name:"client_home_get_best"
  }).then(res=>{
    if (res.result.status == "success" &&res.result.data){
      this.setData({
        products:res.result.data
      })
    }
  }).catch(err=>{
    console.log(err)
  })
}
},
```
我们需要注意，在什么地方传入name的属性，也就是我们云函数的函数名“client_home_get_best”。
我们在then中接收云函数返回的数据。我们在云函数中返回的数据，都保存在res.result中。想想我们都返回了什么？status，msg和data。在这里，我们将以status是否为“success”和data是否存在为依据，来判断是否要更新“为你推荐”的数据。
调用云函数的函数就写完了，如果我有什么没讲清楚的，可以留言给我。
因为我们在界面初始化的时候，会调用一次云函数。所以我们要把onGetBest函数在attached中调用一次。接下来，我们要绑定点击事件。
#### 三 绑定点击事件
在小程序的组件中，我们可以通过bindtap来绑定点击事件

```javascript
bindtap=“onGetBest"
```
在这个界面中，我们要在两个组件上绑定点击事件，1是“换一批”文字，2是刷新图标，代码如下：

```javascript
<view class="change" bindtap="onGetBest">换一批</view>
<van-icon color="gray" size="28rpx" name="replay" bindtap=“onGetBest"/>
```
是不是很简单？
我们再来做一个简单的处理是用户体验更好一些。是什么处理呢？就是当我们接受到数据后，我们再来显示“为你推荐”模块。怎么做到呢？我们可以通过wx:if来实现。怎么实现呢？通过判断绑定的数据products数组来判断，只有当products数组元素大于0时，才显示“为你推荐”模块。代码如下：

```javascript
<view class="mid_menu" wx:if=“{products.length>0}}">
```
## 云数据库初体验


在上一节，我们创建了第一个云函数，在这一节，我们来一起学习一下云数据库的使用。当我们学会了小程序界面的绘制，逻辑的编码，云函数的编写，云数据库的使用，我们会变成什么？变成一个什么都会做的全栈工程师，由于我们什么都会做。所以我们什么都要做，于是时间就不够啦，就要开始996，然后007，这是福报，马爸爸说的。
开个玩笑啦，我们先成为全栈工程师，然后目标是成为一个10x程序猿。随着能力的提高，升职加薪是必然的。小程序的流行势不可挡，它还没有停止进化，当我们一个人就可以快速的完成一个小程序的开发时，我们就可以依靠个人力量去做一些产品，万一这个产品火爆了呢？没准就实现财务自由了。这是一个很美好的梦想对不对？马爸爸也说过，人总是要有梦想的，万一实现了呢？如果马爸爸没说过，那就算作我说的。
好了，废话不多说，今天我们一起来学习以下三块内容：
> 1 创建集合
> 2 添加记录
> 3 云函数读取云数据库

#### 一 创建集合
集合的概念，顾名思义，就是同类数据的集合。例如我们有个产品的集合里面放的都是产品的数据。我们的“为你推荐”模块就是从产品集合里面随机读取4条数据。
我们先来看看在开发者工具中如何创建集合。首先，点击“云开发” 
![](https://imgkr.cn-bj.ufileos.com/1e3e2f97-9e4d-4687-9235-f4d2382d900f.png)
然后点击“数据库”，并通过点击“+”号，创建集合。 
![](https://imgkr.cn-bj.ufileos.com/d8e56d16-f3b9-4926-9121-442dd19ca3f6.png)
在弹出的窗口中输入集合的名称，这里我们输入products： 
![](https://imgkr.cn-bj.ufileos.com/744e9901-a000-4009-93c7-243caa2f14b4.png)
点击“确定”，我们就能在左侧看到我们创建的集合了。
#### 二 添加记录
接下里我们来添加记录，先点击我们的集合“products”，再点击“添加记录按钮”。
![](https://imgkr.cn-bj.ufileos.com/725e9ff9-71c2-4357-ab45-23ead5ec1a09.png)
在弹出窗口，我们可以通过加号按钮添加该条记录的属性及值。 
![](https://imgkr.cn-bj.ufileos.com/0cc49518-8c53-4958-ae70-efc969db1431.png)
我们以添加产品名为例。字段名输入“name”，类型选择string，值输入“陨石拿铁”。
![](https://imgkr.cn-bj.ufileos.com/7a32d06f-3a40-4cb9-9793-b17dd272f307.png)
对于我们来讲，一条产品的记录光有name是不够的。一共有以下这几个字段：

```javascript
name：产品名
nPrice：折后价格
oPrice：原始价格
thum：产品缩略图
image：产品大图
categoryId：产品分类id
```
其中image和categoryId暂时用不着，但我们预留着。
除了手动一条一条的添加记录之外，我们还可以批量导入数据。在我们点击集合名称“products”之后，我们选择“导入”按钮 
![](https://imgkr.cn-bj.ufileos.com/6ee8162d-cfff-4693-87c1-68fd34e7cbb7.png)
在打开的窗口中点击“选择文件”， 
![](https://imgkr.cn-bj.ufileos.com/27140d92-95d1-4fca-bff4-14334c0c9514.png)
找到我们的json文件（该文件我会在源代码中提供）：
完成导入后我们就能看到我们导入的数据了： 
![](https://imgkr.cn-bj.ufileos.com/8e1e2cc2-0f87-45c4-a85d-d52b770d073e.png)
我们来简单分析一下导入的数据。也就是我们的products.json文件。它虽然是以json结尾，但是又和我们平时接触的json不太一样。那我们就来做一个对比。普通的json文件如下

```javascript
[
  {name:”拿铁”},
  {name:”陨石拿铁”}
]
```
我们可以看到中括号清晰的表示这是一个数组，数组内的每条记录之间还有逗号“,”相隔。
而云数据库中的集合用的是jsonline格式如下：

```javascript
{name:”拿铁”}
{name:”陨石拿铁”}
```
数据外面没有中括号，记录之间也没有逗号“,”相隔。接下来，我们就要进入编码环节了。
#### 三 云函数读取云数据库
接下来，我们要改造之前的云函数，将里面写死的数据，改成随机从数据库中读取。
我们打开“cloudfunctions/client_home_get_best/index.js”文件。在第四行添加两行代码：

```javascript
const db = cloud.database()
const products = db.collection("products")
```
这两行代码什么意思呢？第一行，是用一个常量db表示我们对数据库的引用。接着再声明一个常量product表示我们对创建的集合“products”的引用。这样，我们就能通过products对产品数据进行操作了。
接下来，我们要实现的是，随机读取4条记录。

```javascript
const data = await products
    .aggregate()
    .sample({
      size: 4
    })
    .end()
```
我们一行一行的解释，第一行，我们要注意到一个关键字“await”，这表示我们的数据读取是同步的，为什么要这么做呢？因为数据库的操作默认是异步的。如果我们不改成同步的，那么我们在获取数据之前，云函数就直接返回结果了，那我们就什么数据都拿不到了。所以，关键字await是必须的。
第二行 aggregate()，这表示我们要对集合进行聚合操作。 聚合操作能对记录进行一些复杂的处理，例如随机挑选数据。它通常end()做结束。
而第三行sample就是我们这次的关键了，它接收的参数size就表示是随机取出记录的数量。
data是我们拿到的数据，但是data里面的list才是我们所要的，所以返回的时候要这么写：

```javascript
return {
    ……
    data: data.list,
  }
```
最后来看看完整的代码：

```javascript
// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const products = db.collection("products")
// 云函数入口函数
exports.main = async (event, context) => {
const wxContext = cloud.getWXContext()
const status = "success"
const msg = ""
const data = await products
    .aggregate()
    .sample({
size: 4
    })
    .end()
console.log(data)
return {
status: status,
msg: msg,
data: data.list,
  }
}
```
当我们写完index.js的代码，记得要将云函数的代码上传到云服务器上。怎么做呢？如下：
![](https://imgkr.cn-bj.ufileos.com/13f84685-127d-4723-8734-e0fb59e774b2.png)


完整代码我放在了github上，地址是：
[https://github.com/gogoswift/luckin](https://github.com/gogoswift/luckin)


