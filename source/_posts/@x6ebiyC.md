---
title: "使用原生开发高仿瑞幸小程序（一）：使用 Vant 组件库和配置多页面"
description: "原生开发也具有强大的力量，这一次我们用原生开发来高仿一个瑞幸咖啡小程序"
tags: ["Weapp 原生"]
categories: ["小程序", "Weapp 原生", "入门"]
date: 2020-05-14T00:00:00.509Z
photos:
  - https://imgkr.cn-bj.ufileos.com/d08d2b89-5231-44cb-b9f3-dc7737305a0f.jpeg
---

<div class="profileBox">
  <div class="avatarBox">
    <a href="https://github.com/gogoswift/luckin"><img src="/images/avatars/zw.png" alt="" class="avatar"></a>
  </div>
  <div class="rightBox">
    <div class="infoBox">
    <a href="https://github.com/gogoswift/luckin"><p class="nickName">喵先森</p></a>
  </div>
  <div class="codeBox">
    <a href="https://github.com/gogoswift/luckin"><span class="codeText">查看代码</span></a>
  </div>
  </div>
</div>

## 源起


为什么要跨平台，自然是为了节约成本。尤其是创业初期，需要快速迭代，快速试错。此时用原生技术，开发起来未免太过拖沓。我所想的是，如何能够快速的，最大化的覆盖屏幕数。首先，我们按照old school来分，我们可以分为移动端，web端和pc端。移动端的跨平台技术可以采用目前大热的flutter，这是由google推出的技术。而web端和pc端在Electron出现后，也变得简单了。我们可以用js来写pc端的应用。这就意味着，我们只需要两门技术就能覆盖所有端。

但，我们一定漏掉了什么。对，就是微信的小程序。相比上面的端的覆盖，我更在意的是屏幕数量的覆盖。但作为一个初创公司，拿着自己开发的app去做推广获客成本太高，地推？补贴？别忘了我们定位的是初创公司，这样下去，不是烧钱烧死，就是被羊毛党薅死。所以我们的思路就该是从流量大的地方薅用户。如今移动互联网的流量已经集中在几个大的平台上，例如微信，例如抖音。所以微信小程序是我的不二之选（这不是广告软文哈）。我之所以有这样的认知，也是由于这次疫情给了我极大的启发。由于人们避免在线下集会，造成了很多线下活动无法展开，纷纷转向了从线上寻求出路。所谓大危机中必然有大机会。我相信，很大一部分需求会搬到微信上来。所以微信将在未来的一两年会爆发出一大波需求，不容忽视。

那么再回到技术上来，微信小程序的开发，本质上还是js的开发。所以从技术栈角度来讲，并没有新添什么负担。现在前端的技术栈是js和dart（flutter）。那么服务端呢？为了不增加负担，我们能不能从js和dart中选一个呢？当然可以，在dart方面，闲鱼已经跑了很远了。可我想选js。为什么？别忘了，我们的定位是初创公司。要避免在陌生领域开疆拓土。我们可以选择非常成熟的nodejs。而和小程序联系非常紧密的云开发正是使用了nodejs。云开发不仅可以给小程序提供支持，还能给flutter，web端提供支持。这是似乎是一个很完美的方案。虽然没有收到腾讯云开发一分钱的广告费，但我仍然想为他们打call，这确实是一个伟大的产品。以我在腾讯云上的开发经验，开发效率那是杆杆的。

最后我想实践一下我的想法，所以在接下来的日子里，我会高仿一个小程序。例如某幸咖啡。同时写一系列的笔记或者教程。等小程序开发的差不多了，再用flutter开发 app端。那个时候，flutter的web开发应该也成熟了吧。我会再用Electron将web端打包成桌面端。对，所有的活都有我一个人完成。大家看，这里面也没有多少技术，一个人是可以挑战一下的。

当然，所有的代码都将会开源。

## 准备工作


在这一篇中，我们一起来做两件事
> 1 创建小程序
> 2 下载微信开发者工具

我们首先要登录微信公众平台，去注册一个小程序
[https://mp.weixin.qq.com/wxopen/waregister?action=step1&token=&lang=zh_CN](https://mp.weixin.qq.com/wxopen/waregister?action=step1&token=&lang=zh_CN)
这个页面会要求我们填写注册邮箱，当我们填写完注册邮箱，设置好密码之后，邮箱会收到一封激活邮件。账号激活后，我们就可以进入小程序的后台，去填写小程序的信息了。内容嘛，大家看着填，这里就没有统一标准了。
![](https://imgkr.cn-bj.ufileos.com/de47f095-302c-407b-870b-68cabb5c4ebe.png)
当我们填写完信息后，我们再点“查看详情”。 
![](https://imgkr.cn-bj.ufileos.com/fbfe225d-1460-4745-9132-03683a097be5.png)
此时我们就进入了小程序的基本设置，将网页一拖到底，可以看到AppID(小程序ID)，这个非常重要，我们复制一下，待用。
![](https://imgkr.cn-bj.ufileos.com/8b873895-dfad-469c-946f-8d7dd959efbe.png)
至此，我们的准备工作就完成了一半。
接下来我们要去以下网址下载“微信开发者工具”
[https://developers.weixin.qq.com/miniprogram/dev/devtools/stable.html](https://developers.weixin.qq.com/miniprogram/dev/devtools/stable.html "https://developers.weixin.qq.com/miniprogram/dev/devtools/stable.html")
安装好以后，然我们打开微信开发者工具，点这个大大的加号创建新的小程序。 
![](https://imgkr.cn-bj.ufileos.com/d1bb10ab-3dc2-4eb2-801a-36141c5f33b4.png)
在左侧，我们选择“小程序”，右侧，填一些必要的信息。注意第三行AppID，就是刚才我们复制的内容。
![](https://imgkr.cn-bj.ufileos.com/68b31c24-43ab-4ca5-97b2-3c39e806ea31.png)
注意要勾选“小程序 云开发”。
一切准备妥当，点“新建”按钮。然后我们会进入工作界面。在详情中，我们能看到我们在小程序网站上填写的一些信息。
![](https://imgkr.cn-bj.ufileos.com/661a4026-0f11-4b96-bbf6-775ad982ad88.png)
至此，我们就完成了小程序项目的创建。再下面的章节中，我们就要开始具体的编码工作了。其中，我们会用到来自有赞团的小程序UI组件库Vant Weapp。这是一个非常棒的UI组件库，很大程度上提高了开发效率。必须要粉它。
![](https://imgkr.cn-bj.ufileos.com/fcc47ccf-1930-4e6f-8f7f-98c4a3a86c82.png)
## 引入 Vant Weapp 组件库
我觉得小程序的精髓在于小，需精准定位，解决用户痛点。不做大而全，做好小而精，让用户为了解决某个问题能想到我们的小程序就是成功了。例如，想喝咖啡就打开我们的小程序。
在这一篇教程中，我们要完成以下几件事。
> 1 整理项目文件
> 2 引入有赞UI库vant weapp

在上一篇教程中，我们创建了小程序。小程序默认的项目有太多demo，是我们不需要的。所以我们要把项目整理一下，删掉不要用的东西。
首先，我们可以把这三个目录下的内容都删掉
“components”，“images”，“pages”。
接下来我们打开app.json，注意“pages”这个字段的值，这里面引用的是一些demo路径。现在我们要把这些路径都删掉。然后写下自己的第一个界面路径。
```javascript
"pages": [
    "pages/home/home"
  ],
```
在这里，我们写了一个路径，而相应的微信开发着工具，就会在这个路径下生成一个默认的页面：home。 
![](https://imgkr.cn-bj.ufileos.com/54b3cf86-cc5a-4041-a4db-4acb90a10a51.png)
在网站的概念中，这就是网站的首页。我们可以看到，在home文件夹下，有四个文件。这四个文件都负责什么作用呢？让我们一一细说。
home.js 这个文件看后缀名就知道，我们它负责程序的业务逻辑，例如获取数据，设定数据，界面跳转等。
home.json 这是页面的配置文件，引入一些第三方的库和模块都可以在这里设置。
home.wxml 我们可以把这个后缀名分为w和xml，所以它本质是个xml文件，起的作用是定义页面的界面。我们可以把整个页面上有什么视觉内容都在这个文件中定义好。
home.wxss 这其实是一个css样式文件。
所以由上面四个文件组成了如下的视觉效果
![](https://imgkr.cn-bj.ufileos.com/e1846175-4c75-4c65-b13d-a45f2f6ed891.png)
这是开发者工具创建的默认界面，
```javascript
<text>pages/home.home.wxml</text>
```
至此，我们完成了今日的第一部分内容，整理项目文件。
接下来，我们要引入一个非常牛逼的UI组件库，来自有赞团队的Vant Weapp。让我们打开他们的首页。
[https://youzan.github.io/vant-weapp/#/intro](https://youzan.github.io/vant-weapp/#/intro "https://youzan.github.io/vant-weapp/#/intro")
大家可以去上面的网址看看他们提供的UI组件和强大的自定义能力，别玩了再跳回来继续看我的文章哟。如果你看完了，我们就来看看如何引入这个牛逼的库。我们在项目网站的“快速上手”中可以找到安装教程。在这里我简单的说一下：
1 右键单击miniprogram文件夹，选择“在终端打开”
![](https://imgkr.cn-bj.ufileos.com/d35e86b3-8d3f-4be4-9e7e-86d820db4cd8.png)
2 通过# 通过 yarn 安装
`yarn add @vant/weapp  —production`
3 我们打开微信开发者工具右边的“详情”按钮，在本地设置中，勾选上“使用npm” 
![](https://imgkr.cn-bj.ufileos.com/584b85d9-7e0f-414c-bb69-2454d6b59598.png)
4 构建 npm 包
让我们打开微信开发者工具，点击 工具 -> 构建 npm，并勾选 使用 npm 模块 选项，构建完成后，即可引入组件 
![](https://imgkr.cn-bj.ufileos.com/1f40264f-c08e-46bc-b6d8-424f3f0a0e89.png)
至此，我们就完成了vant weapp组件库的导入。在我们的项目文件中，会出现 “miniprogram_npm”和“node_modules”两个目录，还有package.json和yarn.lock这两个文件。 
![](https://imgkr.cn-bj.ufileos.com/3e6e697b-971b-420b-bf4a-ca81d76415af.png)
至此，我们就完成了Vant Weapp UI组件库的导入。最后有一个大坑别忘记了，我们要在app.json 中把"style": “v2”给删掉。官方给出的理由是“程序的新版基础组件强行加上了许多样式，难以去除，不关闭将造成部分组件样式混乱。”
希望有赞团队以后能改进，要不然总觉得不完美。

## 创建 TabBar


小程序是工具，服务于社群。公众号是自媒体，两者结合才能发挥最大作用。幸运的是，现在它们已经打通了的。
在这一篇教程中，我们要完成以下几件事。

> 1 学会使用Tabbar组件
> 2 学会创建components

#### 一 学习Tabbar组件的使用
导入了Vant组件库后，让我们马上来应用一下。我们可以在home页面下引入Tabbar组件。Tabbar起到底部导航的作用，一般来讲，有几个大的模块，就会有几个Tabbar标签。效果如下 
![](https://imgkr.cn-bj.ufileos.com/9c70e1e3-be8b-4e21-b735-e5f27f23b204.png)
在小程序中，引用第三方组件其实很简单。大概分为两步。

> 1 在页面的json文件中配置第三方组件的引用
> 2 在wxml中调用。



有时我们也可以直接在,js文件中import，然后直接用它。

好了，下面的环节是我们今天的这篇文章的最后一部分，如何使用Tabbar。通过观察可得，底部会有5个标签，分别是：”首页“，”菜单“，”订单“，”购物车“和”我的“
所以我们首先需要准备的是图标文件。由于瑞幸的小程序底部的Icon是由线框和实底两种风格组成。所以我们需要准备十张图片。当然，我们也可以使用Iconfront，但不在本次的教学范围之内。
我们将准备好的图片放入images文件夹中。带select后缀的标示为选中后显示的图标。 

![](https://imgkr.cn-bj.ufileos.com/fab3fd4c-48ec-4f48-a32c-bc166c61a01d.png)

这些图片我将会放到github上，以供大家使用。

接着我们打开home.json文件进行组件的引用。

```javascript
"usingComponents": {
    "van-tabbar": "@vant/weapp/tabbar/index",
    "van-tabbar-item": "@vant/weapp/tabbar-item/index"
  }
```

做好组件引用之后，我们就要在home.wxml中进行调用了。先来看一下完整的代码（其实我建议直接跳过去看分析，一般来讲，大段贴代码都是为了混字数）：

![](https://imgkr.cn-bj.ufileos.com/66bc2484-dd5a-4483-beb2-eddd30c922d8.jpeg)

我们可以很明了的看到，整个Tabbar由“van-tabbar”和“van-tabbar-item”组成。我们先来看“van-tabbar-item”我们这里使用到了vant强大的自定义的能力。在默认情况下，tabbar-item的是酱紫使用的

```javascript
<van-tabbar-item icon=“home-o">标签</van-tabbar-item>
```

由于我们是自定义图标，所以我们要在van-tabbar-item把icon属性去掉。同时加入image组件用slot这个关键字来描述我们要自定义的部位。例如在我们的项目中，我们用slot=“icon"定义了未选中的图标，用 slot=“icon-active”定义了选中的图标。还有一点需要注意的是，我们image标签下src的属性。这里使用的是当前文件（home.wxml）的相对路径大家想一下../../images/home.png是不是指向当前文件（home.wxml）的，上一级，再上一级的images目录下的home.png文件？这个概念很重要，在我们的组件引入也会用到。大家要用心体会。
当我们完成页面的搭建后，我们就要来做一些交互了。比如选中van-tabbar-item的时候，图标会进行切换，同时展示不同的界面。这一切，就要跟home.js 文件进行交互了。在小程序的框架中，wxml和js文件的绑定是默认的，只要是同名文件就好。
那么如何进行选中图标的切换呢？我们要使用van-tabbar 中 active属性进行指定。那么如何做呢？我们注意到tabbar-item中有个name属性，例如“首页”的name属性是“home”，所以当我们把home做为值赋予active属性是，界面上就显示了被选中的图标。
我们可以active=“home”和active=“menu”体验一下。当然，这不能满足我们的需求。我们的需求是，active的值要根据我们点选的item而进行改变。所以，我们要把active绑定到一个变量上。如下

```javascript
active=“{{ active }}”
```

在wxml绑定js中的变量，我们需要使用双大括号而变量名，则写在js文件的data对象中。如下：

```javascript
data: {
    active:"home"
},
```

完成这步，我们要做的就是动态的改变active的值了。所以我们这里要用到事件和js文件中的函数进行绑定。

```js
bind:change=“onChange"
```

看语法，每次item的点击，都会触发change事件，所以我们只要跟onChange函数绑定即可。在这里我们只需写上函数名，然后在js文件中进行实现。
而在onChange函数中，我们要做什么呢？我们只需要把item的name赋值给变量active。怎么做到这点呢？很巧的事，change事件携带的参数e，有一个属性detail正好对应上name属性。于是我们的代码可以这么写

```javascript
onChange:function(e){
    console.log(e.detail)
    this.setData({
      active:e.detail
    })
},
```
注意最后一个大括号后面的逗号”,”，如果函数插在js文件中间的话，这个必不可少。好了，至此，我们就完成了Tabbar标签图标的切换。
我们今天要做的最后一块内容是，做5个界面组件，随着item的切换进行切换。

#### 二 学会创建组件

也很简单，分三步：

> 1 创建组件
> 2 引入组件
> 3 代码其控制显示

我们在pages/home路径下创建components文件夹，用来存放不同的组件。我们先在components下创建home文件夹，再右键点击home文件夹，选择“新建Component” 

![](https://imgkr.cn-bj.ufileos.com/70c176e5-b9c6-4ff3-9322-370da8051c8c.png)

命名为home，这时候就会在home文件夹下生成四个文件，这四个文件和我们之前在pages创建的页面意义是一样的。至此，我们就完成了home组件的创建，接着我们再依次创建menu，my，order，cart四个组件。具体界面暂时先不用写。我们先完成界面切换的互动。
还记得我们是怎么引入组件的吗？对咯，在json文件中。所以我们打开pages/home目录下的home.json文件。这里要注意，有两个home，不要打开components目录下的home。
引入我们创建的组件

```javascript
"usingComponents": {
    "van-tabbar": "@vant/weapp/tabbar/index",
    "van-tabbar-item": "@vant/weapp/tabbar-item/index",
    "tabbar_home":"./components/home/home",
    "tabbar_menu":"./components/menu/menu",
    "tabbar_order":"./components/order/order",
    "tabbar_cart":"./components/cart/cart",
    "tabbar_my":"./components/my/my"
  }
```
tabbar_home等key是我们自定义的标签名，它的value则是组件存放的相对路径。”./”标示从当前目录开始算起。大家要注意，这是相对路径。当我们依次设定好tabbar_menu，tabbar_order，tabbar_cart，tabbar_my之后 ，我们就要回到wxml中构建界面了。
由于标签化后，我们可以直接在home.wxml中使用组件标签。

```javascript
<tabbar_home />
<tabbar_menu  />
<tabbar_order  />
<tabbar_cart  />
<tabbar_my />
```
但此时，我们创建的五个组件都显示在界面上。我们希望的是，当我们点击不同的item的时候，会切换到不同组件。那么我们该如何控制呢？其实也不复杂，我们依然要利用变量active进行控制。在小程序中，我们可以使用wx:if来做简单的逻辑控制。所以，当active的值为home时，我们要显示tabbar_home该怎么做呢？代码为

```javascript
wx:if="{{active == 'home'}}"
```
这就表示了，除非active的值为home，否则tabbar_home标签就不会显示。这里有个简单的逻辑转换，这种颠过来倒过去的逻辑造成了很多人觉得程序猿很难沟通，而程序猿早就习以为常。好了，当我们完成以下代码时，我们就完成了不同组件的切换。

```javascript
<tabbar_home wx:if="{{active == 'home'}}" />
<tabbar_menu wx:if="{{active == 'menu'}}" />
<tabbar_order wx:if="{{active == 'order'}}" />
<tabbar_cart wx:if="{{active == 'cart'}}" />
<tabbar_my wx:if="{{active == 'my'}}" />
```
![](https://imgkr.cn-bj.ufileos.com/aa04bfc9-0389-4dca-a43e-8dacbebf11ea.png)
于是乎，我们今天的内容就结束了。下一章节，我们来搭建一下“首页”的内容。
![](https://imgkr.cn-bj.ufileos.com/83ea8d26-912e-4914-b189-63841b42ca92.png)




