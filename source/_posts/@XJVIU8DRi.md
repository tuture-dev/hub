---
title: "使用原生开发高仿瑞幸小程序（一）：使用 Vant 组件库和配置多页面"
description: "使用 Vant 结合小程序云开发高仿瑞幸小程序，你值得拥有"
tags: ["微信小程序"]
categories: ["小程序", "原生微信小程序", "入门"]
date: 2020-06-08T00:00:00.509Z
photos:
  - https://imgkr.cn-bj.ufileos.com/43d10d19-9f8e-44e5-ab7b-44a982d9e768.png
---

<div class="profileBox">
  <div class="avatarBox">
    <a href="https://github.com/gogoswift"><img src="/images/avatars/zwmxs.png" alt="" class="avatar"></a>
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

为什么要跨平台，自然是为了节约成本。尤其是创业初期，需要快速迭代，快速试错。此时用原生技术，开发起来未免太过拖沓。我所想的是，如何能够快速的，最大化的覆盖屏幕数。首先，我们按照old school来分，我们可以分为移动端，web端和pc端。移动端的跨平台技术可以采用目前大热的flutter，这是由google推出的技术。而web端和pc端在Electron出现后，也变得简单了。我们可以用js来写pc端的应用。这就意味着，我们只需要两门技术就能覆盖所有端。

但，我们一定漏掉了什么。对，就是微信的小程序。相比上面的端的覆盖，我更在意的是屏幕数量的覆盖。但作为一个初创公司，拿着自己开发的app去做推广获客成本太高，地推？补贴？别忘了我们定位的是初创公司，这样下去，不是烧钱烧死，就是被羊毛党薅死。所以我们的思路就该是从流量大的地方薅用户。如今移动互联网的流量已经集中在几个大的平台上，例如微信，例如抖音。所以微信小程序是我的不二之选（这不是广告软文哈）。我之所以有这样的认知，也是由于这次疫情给了我极大的启发。由于人们避免在线下集会，造成了很多线下活动无法展开，纷纷转向了从线上寻求出路。所谓大危机中必然有大机会。我相信，很大一部分需求会搬到微信上来。所以微信将在未来的一两年会爆发出一大波需求，不容忽视。

那么再回到技术上来，微信小程序的开发，本质上还是js的开发。所以从技术栈角度来讲，并没有新添什么负担。现在前端的技术栈是js和dart（flutter）。那么服务端呢？为了不增加负担，我们能不能从js和dart中选一个呢？当然可以，在dart方面，闲鱼已经跑了很远了。可我想选js。为什么？别忘了，我们的定位是初创公司。要避免在陌生领域开疆拓土。我们可以选择非常成熟的nodejs。而和小程序联系非常紧密的云开发正是使用了nodejs。云开发不仅可以给小程序提供支持，还能给flutter，web端提供支持。这是似乎是一个很完美的方案。虽然没有收到腾讯云开发一分钱的广告费，但我仍然想为他们打call，这确实是一个伟大的产品。以我在腾讯云上的开发经验，开发效率那是杆杆的。

最后我想实践一下我的想法，所以在接下来的日子里，我会高仿一个小程序。例如某幸咖啡。同时写一系列的笔记或者教程。等小程序开发的差不多了，再用flutter开发 app端。那个时候，flutter的web开发应该也成熟了吧。我会再用Electron将web端打包成桌面端。对，所有的活都有我一个人完成。大家看，这里面也没有多少技术，一个人是可以挑战一下的。

当然，所有的代码都将会开源。

{% note warning %}
因 Hexo 中双大括号是模板引擎语法，所以本系列中遇到的所有双大括号均修改成了 `{}}` 左单括号，右双大括号的形式，读者在实际写代码的时候需要写出左右都是双大括号。
{% endnote %}

## 准备工作


在这一篇中，我们一起来做两件事
> 1 创建小程序
> 2 下载微信开发者工具

我们首先要登录微信公众平台，去注册一个小程序
[https://mp.weixin.qq.com/wxopen/waregister?action=step1&token=&lang=zh_CN](https://mp.weixin.qq.com/wxopen/waregister?action=step1&token=&lang=zh_CN)
这个页面会要求我们填写注册邮箱，当我们填写完注册邮箱，设置好密码之后，邮箱会收到一封激活邮件。账号激活后，我们就可以进入小程序的后台，去填写小程序的信息了。内容嘛，大家看着填，这里就没有统一标准了。
![](https://imgkr.cn-bj.ufileos.com/0f93a75d-f549-4c1e-a171-baacd03bf0c0.png)
当我们填写完信息后，我们再点“查看详情”。 
![](https://imgkr.cn-bj.ufileos.com/929f3b7a-c4ff-4f34-b351-abb68098846c.png)
此时我们就进入了小程序的基本设置，将网页一拖到底，可以看到AppID(小程序ID)，这个非常重要，我们复制一下，待用。
![](https://imgkr.cn-bj.ufileos.com/2552b6b9-8ccf-4da4-b86a-013c69cd4e23.png)
至此，我们的准备工作就完成了一半。
接下来我们要去以下网址下载“微信开发者工具”
[https://developers.weixin.qq.com/miniprogram/dev/devtools/stable.html](https://developers.weixin.qq.com/miniprogram/dev/devtools/stable.html)
安装好以后，然我们打开微信开发者工具，点这个大大的加号创建新的小程序。 
![](https://imgkr.cn-bj.ufileos.com/a43c3ba5-8ff6-4a0a-b76d-3f0eb7ce4ac5.png)
在左侧，我们选择“小程序”，右侧，填一些必要的信息。注意第三行AppID，就是刚才我们复制的内容。
![](https://imgkr.cn-bj.ufileos.com/7219cea1-06e8-460e-a80b-db396c9f0523.png)
注意要勾选“小程序 云开发”。
一切准备妥当，点“新建”按钮。然后我们会进入工作界面。在详情中，我们能看到我们在小程序网站上填写的一些信息。
![](https://imgkr.cn-bj.ufileos.com/fbe6ade7-5156-4428-9d9c-d114aa600028.png)
至此，我们就完成了小程序项目的创建。再下面的章节中，我们就要开始具体的编码工作了。其中，我们会用到来自有赞团的小程序UI组件库Vant Weapp。这是一个非常棒的UI组件库，很大程度上提高了开发效率。必须要粉它。
![](https://imgkr.cn-bj.ufileos.com/459888ef-d1ab-4528-a097-42ee0dfc2626.png)
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
![](https://imgkr.cn-bj.ufileos.com/ca527163-2a45-4b1f-beb6-5edeae7fda70.png)
在网站的概念中，这就是网站的首页。我们可以看到，在home文件夹下，有四个文件。这四个文件都负责什么作用呢？让我们一一细说。
home.js 这个文件看后缀名就知道，我们它负责程序的业务逻辑，例如获取数据，设定数据，界面跳转等。
home.json 这是页面的配置文件，引入一些第三方的库和模块都可以在这里设置。
home.wxml 我们可以把这个后缀名分为w和xml，所以它本质是个xml文件，起的作用是定义页面的界面。我们可以把整个页面上有什么视觉内容都在这个文件中定义好。
home.wxss 这其实是一个css样式文件。
所以由上面四个文件组成了如下的视觉效果
![](https://imgkr.cn-bj.ufileos.com/10e4d411-7db0-418e-af46-9a656fd63026.png)
这是开发者工具创建的默认界面，
```javascript
<text>pages/home.home.wxml</text>
```
至此，我们完成了今日的第一部分内容，整理项目文件。
接下来，我们要引入一个非常牛逼的UI组件库，来自有赞团队的Vant Weapp。让我们打开他们的首页。
[https://youzan.github.io/vant-weapp/#/intro](https://youzan.github.io/vant-weapp/#/intro)
大家可以去上面的网址看看他们提供的UI组件和强大的自定义能力，别玩了再跳回来继续看我的文章哟。如果你看完了，我们就来看看如何引入这个牛逼的库。我们在项目网站的“快速上手”中可以找到安装教程。在这里我简单的说一下：
1 右键单击miniprogram文件夹，选择“在终端打开”
![](https://imgkr.cn-bj.ufileos.com/c9976d78-bf5b-430c-b2e5-da19fa69c691.png)
2 通过# 通过 yarn 安装
`yarn add @vant/weapp  —production`
3 我们打开微信开发者工具右边的“详情”按钮，在本地设置中，勾选上“使用npm” 
![](https://imgkr.cn-bj.ufileos.com/76b158ea-3b97-4c5a-a4d1-3a2cf83a6364.png)
4 构建 npm 包
让我们打开微信开发者工具，点击 工具 -> 构建 npm，并勾选 使用 npm 模块 选项，构建完成后，即可引入组件 
![](https://imgkr.cn-bj.ufileos.com/45c99b50-33c2-4974-a902-06c55669ef7c.png)
至此，我们就完成了vant weapp组件库的导入。在我们的项目文件中，会出现 “miniprogram_npm”和“node_modules”两个目录，还有package.json和yarn.lock这两个文件。 
![](https://imgkr.cn-bj.ufileos.com/2d3bd11b-baec-4bd8-bf72-aac13110e6cb.png)
至此，我们就完成了Vant Weapp UI组件库的导入。最后有一个大坑别忘记了，我们要在app.json 中把"style": “v2”给删掉。官方给出的理由是“程序的新版基础组件强行加上了许多样式，难以去除，不关闭将造成部分组件样式混乱。”
希望有赞团队以后能改进，要不然总觉得不完美。

## 创建 TabBar


小程序是工具，服务于社群。公众号是自媒体，两者结合才能发挥最大作用。幸运的是，现在它们已经打通了的。
在这一篇教程中，我们要完成以下几件事。

> 1 学会使用Tabbar组件
> 2 学会创建components

#### 一 学习Tabbar组件的使用
导入了Vant组件库后，让我们马上来应用一下。我们可以在home页面下引入Tabbar组件。Tabbar起到底部导航的作用，一般来讲，有几个大的模块，就会有几个Tabbar标签。效果如下 
![](https://imgkr.cn-bj.ufileos.com/c3abb4b6-4144-4350-82bb-6d2983f8d1e6.png)
在小程序中，引用第三方组件其实很简单。大概分为两步。

> 1 在页面的json文件中配置第三方组件的引用
> 2 在wxml中调用。



有时我们也可以直接在,js文件中import，然后直接用它。
好了，下面的环节是我们今天的这篇文章的最后一部分，如何使用Tabbar。通过观察可得，底部会有5个标签，分别是：”首页“，”菜单“，”订单“，”购物车“和”我的“
所以我们首先需要准备的是图标文件。由于瑞幸的小程序底部的Icon是由线框和实底两种风格组成。所以我们需要准备十张图片。当然，我们也可以使用Iconfront，但不在本次的教学范围之内。
我们将准备好的图片放入images文件夹中。带select后缀的标示为选中后显示的图标。 
![](https://imgkr.cn-bj.ufileos.com/64c82f78-36e7-4c27-a691-596ec4305727.png)
这些图片我将会放到github上，以供大家使用。
接着我们打开home.json文件进行组件的引用。

```javascript
"usingComponents": {
    "van-tabbar": "@vant/weapp/tabbar/index",
    "van-tabbar-item": "@vant/weapp/tabbar-item/index"
  }
```
做好组件引用之后，我们就要在home.wxml中进行调用了。先来看一下完整的代码（其实我建议直接跳过去看分析，一般来讲，大段贴代码都是为了混字数）：

```javascript
<van-tabbar active="{ active }}" bind:change="onChange">
<van-tabbar-item name="home">
<image slot="icon" src="../../images/home.png" mode="aspectFit" style="width: 30px; height: 18px;" />
<image slot="icon-active" src="../../images/home_select.png" mode="aspectFit" style="width: 30px; height: 18px;" />
首页
</van-tabbar-item>
<van-tabbar-item name="menu">
<image slot="icon" src="../../images/menu.png" mode="aspectFit" style="width: 30px; height: 18px;" />
<image slot="icon-active" src="../../images/menu_select.png" mode="aspectFit" style="width: 30px; height: 18px;" />
菜单
</van-tabbar-item>
<van-tabbar-item name="order">
<image slot="icon" src="../../images/order.png" mode="aspectFit" style="width: 30px; height: 18px;" />
<image slot="icon-active" src="../../images/order_select.png" mode="aspectFit" style="width: 30px; height: 18px;" />
订单</van-tabbar-item>
<van-tabbar-item name="cart">
<image slot="icon" src="../../images/cart.png" mode="aspectFit" style="width: 30px; height: 18px;" />
<image slot="icon-active" src="../../images/cart_select.png" mode="aspectFit" style="width: 30px; height: 18px;" />
购物车</van-tabbar-item>
<van-tabbar-item name="my">
<image slot="icon" src="../../images/my.png" mode="aspectFit" style="width: 30px; height: 18px;" />
<image slot="icon-active" src="../../images/my_select.png" mode="aspectFit" style="width: 30px; height: 18px;" />
我的</van-tabbar-item>
</van-tabbar>
```
我们可以很明了的看到，整个Tabbar由“van-tabbar”和“van-tabbar-item”组成。我们先来看“van-tabbar-item”我们这里使用到了vant强大的自定义的能力。在默认情况下，tabbar-item的是酱紫使用的

```javascript
<van-tabbar-item icon=“home-o">标签</van-tabbar-item>
```
由于我们是自定义图标，所以我们要在van-tabbar-item把icon属性去掉。同时加入image组件用slot这个关键字来描述我们要自定义的部位。例如在我们的项目中，我们用slot=“icon"定义了未选中的图标，用 slot=“icon-active”定义了选中的图标。还有一点需要注意的是，我们image标签下src的属性。这里使用的是当前文件（home.wxml）的相对路径大家想一下../../images/home.png是不是指向当前文件（home.wxml）的，上一级，再上一级的images目录下的home.png文件？这个概念很重要，在我们的组件引入也会用到。大家要用心体会。
当我们完成页面的搭建后，我们就要来做一些交互了。比如选中van-tabbar-item的时候，图标会进行切换，同时展示不同的界面。这一切，就要跟home.js 文件进行交互了。在小程序的框架中，wxml和js文件的绑定是默认的，只要是同名文件就好。
那么如何进行选中图标的切换呢？我们要使用van-tabbar 中 active属性进行指定。那么如何做呢？我们注意到tabbar-item中有个name属性，例如“首页”的name属性是“home”，所以当我们把home做为值赋予active属性是，界面上就显示了被选中的图标。
我们可以active=“home”和active=“menu”体验一下。当然，这不能满足我们的需求。我们的需求是，active的值要根据我们点选的item而进行改变。所以，我们要把active绑定到一个变量上。如下
`active=“{ active }}”`
在wxml绑定js中的变量，我们需要使用双大括号{ }} 而变量名，则写在js文件的data对象中。如下：

```javascript
data: {
    active:"home"
},
```
完成这步，我们要做的就是动态的改变active的值了。所以我们这里要用到事件和js文件中的函数进行绑定。
`bind:change=“onChange"`
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
![](https://imgkr.cn-bj.ufileos.com/0f4f0077-e6de-4461-a93b-0a14260e2fda.png)
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
wx:if="{active == 'home'}}"
```
这就表示了，除非active的值为home，否则tabbar_home标签就不会显示。这里有个简单的逻辑转换，这种颠过来倒过去的逻辑造成了很多人觉得程序猿很难沟通，而程序猿早就习以为常。好了，当我们完成以下代码时，我们就完成了不同组件的切换。

```javascript
<tabbar_home wx:if="{active == 'home'}}" />
<tabbar_menu wx:if="{active == 'menu'}}" />
<tabbar_order wx:if="{active == 'order'}}" />
<tabbar_cart wx:if="{active == 'cart'}}" />
<tabbar_my wx:if="{active == 'my'}}" />
```
![](https://imgkr.cn-bj.ufileos.com/7ceb4435-927f-4a0b-9b23-98c0adb15b4c.png)
于是乎，我们今天的内容就结束了。下一章节，我们来搭建一下“首页”的内容。
![](https://imgkr.cn-bj.ufileos.com/804e2e3f-2907-4fd5-87d2-5a7d8dae8431.png)
## 创建轮播图


轮播图是我们常见的一种表现形式，通常，图片之间要做到无缝衔接循环需要花一些功夫，而小程序提供的组件就已经可以实现。可以说省去了开发者不少的时间。
所以，今天我们要一起来学习以下几件事：
> 1 学会使用云存储
> 2 学会使用image组件
> 3 简单自定义navigation
> 4 学会使用swiper组件来创建轮播图

#### 一 云存储的使用
让我们一步一步的来，首先我们需要给小程序的首页创建一个背景。如下图 
![](https://imgkr.cn-bj.ufileos.com/ab0bcf31-726a-45aa-9c6a-7ece3aae8931.png)
在这里，背景图片我放到了云存储上。要知道，当我们创建小程序后，我们有5G存储空间和5G的流量可以免费使用。这足够我们开发使用了。
那么，怎么把背景图图片放到云存储上呢？我们在微信开发者工具的顶部找到“云开发”按钮。
![](https://imgkr.cn-bj.ufileos.com/b2cd87dd-7dd2-497a-81e0-89caae59f93d.png)
这时候，我们会打开“云开发控制台”。我们再点击“存储”按钮，就来到了云存储的管理界面。如下图
![](https://imgkr.cn-bj.ufileos.com/560ce08d-3981-4e2e-8456-c3dabf51d78e.png)
我们可以通过“新建文件夹”来进行分类管理。想我，我就创建了“images”文件夹，同时在images文件夹下面根据Tabbar又创建了。“home”，“menu”，“cart”，“order”和“my”五个文件夹。
因为我们现在在创建首页嘛，所以我会把首页下的相关图片都放在home文件夹下。云存储不仅能存图片，还能存放其他文件，这里就不细讲了。
我们可以点击“上传文件”按钮，将今天所需的图片素材，传到云存储上。我将背景图和今天轮播图所需的图片都传到了“images/home”文件夹下。
我们的image组件能直接使用File ID，省却了地址转换的麻烦。File ID的地址如下图所示。 
![](https://imgkr.cn-bj.ufileos.com/1cb55d77-4c22-47f4-b56c-d1882f917d0c.png)
上图红框所标示的地址就是我们背景图片的地址，让我们复制一下，接下来马上就会用到。
#### 二 利用image组件创建背景
接下来，我们需要使用的是image组件，我们将通过改变它的z坐标将它放置在其他组件的“下面”，这样就变成了home页面的背景了。为什么不用css中的background-image呢？因为这个属性必须使用网络图片或者base64图片。而我们的云存储的File ID地址必须要转换一下才能获得真实地址，所以太麻烦，不如直接用image来的快。
好，接下来看看怎么使用image组件。
首先，我们用view给整个试图创建一个根容器，仿造html，我们给class起名为body

```javascript
<view class="body">
</view>
```
接着，我们在其中放入image组件，背景图片

```javascript
<view class="body">
<image class="bg" src="cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/homebg.png"></image>
</view>
```
我们给image 的class属性赋值为bg。接下我们到home.wxss中做一些工作。
首先，我们让body横向撑满整个屏幕

```javascript
.body{
  width: 100%;
}
```
接下来，我们要将改变image组件的z坐标了。

```javascript
.bg{
  /*fixed 固定位置 absolute 跟随屏幕滚动 */
  position: absolute; 
  top: 0;
  z-index: -100;
}
```
z-index就是我们所说的z坐标了。什么是z坐标呢，我们知道横轴是x坐标，竖轴是y坐标。xy组成了一个平面，也就是我们的手机屏幕。那么垂直与手机屏幕的就是z坐标。z坐标的值越小，就在越后面，也就会被挡住。那么当我们把z-index设为-100的时候，image就位于其他组件的下方了。
很好，如果一切正确，将会看到如下画面。
![](https://imgkr.cn-bj.ufileos.com/9302485a-9636-4b42-a948-b1e1824fd8be.png)
这和我们所期望的效果有些不一样？我们期待的效果是没有顶部的navigation的对不对？不要着急，接下来我们就来解决这个问题。
#### 三 简单自定义navigation
其实要让顶部的navigation消失非常简单，我们只需要打开“pages/home/home.json”，添加

```javascript
"navigationStyle": “custom",
```
即可，这行代码的意思就是，我们将使用自定义的navigation。我们只要什么都不做，就让将默认的navigarion消失了。如下图所示
![](https://imgkr.cn-bj.ufileos.com/cceffe99-259d-44e2-bfa8-0618940fe4ae.png)
至于如何自定义复杂的navigation，这就不是本节的内容了。
#### 四 创建轮播图
如何创建轮播图呢？答案是，使用小程序提供的swiper组件。使用swiper组件，一切都将变得非常的简单。
> 1 我们将在home.wxml中创建swiper
> 2 我们将在home.js中定义轮播图的数据
> 3 我们将在home.js中定义swiper所需要的定位数据

首先，让我们创建swiper

```javascript
<view class="swiper">
<swiper circular = "{true}}" indicator-active-color="#ffffff" bindanimationfinish="onFinish" indicator-dots="{indicatorDots}}" autoplay="{autoplay}}" interval="{interval}}" duration="{duration}}">
<block wx:for="{swiperData}}" wx:key="*this">
<swiper-item>
  <image src="{item}}" mode="widthFix"></image>
</swiper-item>
</block>
</swiper>
</view>
```
我在创建swiper之前，会在其外面套一层view，用来做定位以及样式相关控制。那么就来看看我都对view做了什么样的样式控制。

```javascript
.swiper{
  margin-left: 20rpx;
  margin-right: 20rpx;
  border-radius: 30rpx;
  /* 使内容同样获得圆角 */
  overflow: hidden;
  /* transform: translateY(0); */
}
```
在这里，我们通过margin-left设置了左边距离屏幕20rpx，margin-right右边距也是20rpx，border-radius设置了圆角矩形的半径为30rpx，最后，为了让view所包含的swiper也能有圆角效果，我们还需要将overflow设置为hidder。
知识点，我们知道px是像素的意思，那么rpx是什么样的尺寸呢？以往我们在开发手机app的时候，为了在不同尺寸的屏幕上显示一样的设计效果，我们需要根据尺寸的不同进行一定的换算。如果使用rpx则可以进行自适应了，省却了换算的麻烦。
至此，我们就完成了外层样式的设定，接下来，让我们回到home.wxml中，看看swiper的代码都是什么意思。
在swiper标签中，我们能看到属性circular 设为了true 

```javascript
circular = “{true}}"
```
这表示，我们开启了循环轮播，大家可以把这个属性去掉，看看有什么不同的效果。
bindanimationfinish=“onFinish”标示，我们在每个图片切换动画完成后，会执行onFinish函数。
indicator-dots=“{true}}" 表示轮播图将会显示指示小圆点
indicator-active-color=“#ffffff" 表示选中的小圆点的颜色，这里我设置为了白色。
interval=“{2000}}” 表示图片的切换相隔2000毫秒也就是2秒
duration=“{500}}" 表示切换动画持续时间为0.5秒
以上就是关于swiper的基本设置。
接下来，我们将会用block来设置swiper的数据源以及通过swiper-item来设置轮播的图片。在代码中，我们可以看到block标签。这是wxml的语法标签。在这个标签下，我们能够有限的使用一些流程控制语法。
例如在这一节中，我们使用的 wx:for，它可以绑定一个数组，将多个字节点渲染出来。
wx:for 我们绑定的是组件home.js中的一个数组swiperData，和页面的js一样，放在data对象中。

```javascript
data: {  
  swiperData: [
      "cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/DC240B320F4-1.jpeg",
      "cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/6C04DA13FC28-1.jpeg",
      "cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/DA98AD7CF153-1.jpeg",
      "cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/87542BE16ED7-1.jpeg"
    ],
}
```
而wx:key这是用来给for中的每一个子项一个唯一标识的，这样可以在数据源有改动时，原有的子对象能保留状态，例如文本框里输入的内容。
wx:key 的值以两种形式提供
> 1 字符串，代表在 for 循环的 array 中 item 的某个 property，该 property 的值需要是列表中唯一的字符串或数字，且不能动态改变。
> 2 保留关键字 *this 代表在 for 循环中的 item 本身，这种表示需要 item 本身是一个唯一的字符串或者数字。

我们的轮播图，用的是*this。
swiper-item 标签仅可放在swiper标签中，宽高自动设置为100%。我们在swiper-item中再放一个image组件。我们只需要把image的属性src赋值即可。那么我们怎么获得swiperData数组中的元素呢？很简单，在wx:for遍历数组的时候，item就代表着数组中的元素。即：
`<image src="{item}}" mode="widthFix"></image>`
此时，在我们的微信开发者工具的模拟器中，我们看到的是酱婶的：
![](https://imgkr.cn-bj.ufileos.com/9872ee40-cf87-4b97-a895-67da1278347a.png)
我们发现，轮播图的位置距离顶部太近了，我们至少要把状态栏和标题栏空出来。
状态栏和标题栏的高度，我们可以通过系统动态获取。所以我们组件home.js中，预留两个属性
`statusBarHeight: 0,`
`titleBarHeight: 0,`
这两个属性的值，我们会在组件进入页面时进行赋值。这样，在组件被渲染时就能拿来用了。
我们要做什么来着？为了让轮播组件下来一点。所以我们可以在承载swiper的view中这么写。

```javascript
style="margin-top:{(titleBarHeight + statusBarHeight)}}rpx;height {((wx.getSystemInfo().windowWidth - 40)*540/1065)}}rpx;”
```
这是一种编写样式的方式，为什么写在在wxml中，这是为了能够动态的使用statusBarHeight和titleBarHeight。
我们注意到，除了使用margin-top，这个用来设定定边距的属性之外，我们还设置了height的值，也就是轮播组件的高度。这里有一个小公式。用来根据屏幕宽度动态计算轮播组件的高度。
按比例拉升的公式是这样的：
根据 轮播组件高/轮播组件的宽 = 图片高/图片宽
可以推导出 轮播组件的高 = 轮播组件的宽 * 图片高/图片宽
图片的高宽，我们是可以知道的，分别为540和1065，自己搞得图片嘛，当然知道saize。那轮播组件的宽呢？等于屏幕的宽wx.getSystemInfo().windowWidth 减去 左右边距即40
所以轮播组件的高 = wx.getSystemInfo().windowWidth - 40)*540/1065
如果看到这里还没有头昏脑胀的话，我们继续往下看，如何获得statusBarHeight和titleBarHeight的值？我们可以通过微信提供的api：getSystemInfo获得。代码如下

```javascript
attached() {
    var statusBarHeight = 0
    var titleBarHeight = 0
    wx.getSystemInfo({
      success: (res) => {
        statusBarHeight = res.statusBarHeight
        titleBarHeight = wx.getMenuButtonBoundingClientRect().bottom + wx.getMenuButtonBoundingClientRect().top - (res.statusBarHeight * 2)
      },
      failure() {
        statusBarHeight = 0
        titleBarHeight = 0
      }
    })
    this.setData({
      statusBarHeight: statusBarHeight,
      titleBarHeight: titleBarHeight
    })
},
```
大家注意到，我们在计算titleBarHeight的时候，调用了wx.getMenuButtonBoundingClientRect这个api，这是什么呢？这个api能获取微信右上角胶囊按钮的布局信息。
好有一个新的知识点需要学习一下，就是在组件中，attached函数是干嘛的？这是组件生命周期的一个函数，当在组件实例进入页面节点树时就会执行，在我们的实例中，我们正是利用这个函数给我们的组件的顶边距赋值的。让我们看看最后的效果图吧
![](https://imgkr.cn-bj.ufileos.com/024e8726-8ecd-47e2-8d93-18a8ccdeb152.png)
好了，今天的内容就到这里，欢迎大家留言讨论。我们下一节将和大家一起探讨，小程序中的全局变量该怎么用


