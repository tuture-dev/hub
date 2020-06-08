---
title: "使用原生开发高仿瑞幸小程序（三）：完成 Layout 布局和为你推荐模块"
description: "使用 Vant 结合小程序云开发高仿瑞幸小程序，你值得拥有"
tags: ["微信小程序"]
categories: ["小程序", "原生微信小程序", "入门"]
date: 2020-06-08T00:00:02.509Z
photos:
  - https://imgkr.cn-bj.ufileos.com/2438aed7-64a8-41e6-af39-5a5c166e2d55.png
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

## 完成 Layout 布局


十年前，张小龙说过：“一个产品，要加多少功能，才能成为一个垃圾产品。”仅此一句话，道尽他做产品的理念。小程序就是其产品理念的最佳实践，少即是多，小即是大。
今天，我们来绘制如下的界面
![](https://imgkr.cn-bj.ufileos.com/9c9a6525-2c04-4262-87ce-d6aa0aad2689.png)
要实现以上布局，我们需要学习以下三块内容
> 1 通过图片的宽度计算出图片的高度
> 2 学会使用row组件
> 3 学会使用col组件 

#### 一 分析布局
看看我们要实现的布局，横平竖直，方方正正，比例匀称。其实这是非常容易实现的。我们将要用到vant组件库的layout布局系统。我们可以通过其中的row来实现横向布局。使用col实现竖向布局。row和col搭配起来，就能完成我们今天的布局了。
首先我们来分析一下布局，我们可以把整个布局分为上下两个row，如下：
![](https://imgkr.cn-bj.ufileos.com/41203992-1321-474f-ba6d-dc20fab3a466.jpeg)
ok，接下来，我们再用col填充row，如下图：
![](https://imgkr.cn-bj.ufileos.com/2b78d7ab-9404-40c9-8322-8fa0d0ab967f.jpeg)
 最后一步是什么呢？我们在每个col之中放入image组件即可。
![](https://imgkr.cn-bj.ufileos.com/2c7f27c7-dab2-4343-9083-d6cd44def9b9.jpeg)
至此，我们就完成了布局的分析。为什么要用row和col？因为它们有个非常厉害的属性span。利用这个属性，我们能实现按比例布局。怎么个按比例法呢？在vant的layout系统中，横向被分为24分。如果要在row中放两个一样大小的col，只需要将将col的span设为24 / 2 = 12。以此类推，如果要放三个一样宽的col，只需要将每个col的span设为24 / 3 = 8。这就实现了我们第二个row的布局。
现在我们来分析一下第一个row怎么布局。我们通过观察可知，第一个Row中有两个col，他们的比例是2:1，所以第一个col的span为 （24 / 3）* 2 = 16，第二个col的span为 24 / 3 = 8 。这样就实现了2:1的布局。
#### 二 通过图片的宽度计算出图片的高度
我们需要六张图片，把它们放在云存储中。图片资源我放在了github中，github的地址会在文章末尾放出。在这里，它们的地址是： 
![](https://imgkr.cn-bj.ufileos.com/e52ec4bf-e827-41f1-92ae-a7ee45ed66ac.png)
cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/01.png 
![](https://imgkr.cn-bj.ufileos.com/68119384-d842-477d-adc7-2ad8e3e3c0aa.png)
cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/02.png 
![](https://imgkr.cn-bj.ufileos.com/6490c7a6-324c-49b6-b2e8-5e16174c66d0.png)
cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/03.png 
![](https://imgkr.cn-bj.ufileos.com/3ddebe36-aefb-451a-81b2-3ba0f24fbfe9.png)
cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/04.png 
![](https://imgkr.cn-bj.ufileos.com/63deb1c4-79b6-44ed-80b5-3696286312f4.png)
cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/05.png 
![](https://imgkr.cn-bj.ufileos.com/f10d493d-6483-47ed-9927-47ffc5bb5a0a.png)
cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/06.png
让我们来想想，要完成布局我们需要知道什么？我们知道屏幕宽度，知道图片左右边距，知道图片之间的距离，知道图片之间的比例，那么我们就知道了图片的宽度。所以我们需要通过计算获得图片在屏幕上的高度。
为了让图片不变形，图片在屏幕上的高宽比要等于图片真实的高宽比，这就是我们计算的基础。
图片在屏幕的高/图片在屏幕上的宽=图片真实的高/图片真实的宽
图片在屏幕上的高 =  图片在屏幕上的宽 * 图片真实的高/图片真实的宽
拿第一个row中的第一张图片来说，它真实高是666，宽是330。
那么怎么得到它在屏幕上的宽呢？可通过以下的简单公式进行计算：
屏幕宽度-左右外边距(margin)-左右内边距(padding)-与右边图片的距离
即是

```javascript
750 - 40 - 40 - 6 = 664
```
所以它在屏幕上的高度就是 664 * 330 / 666
通过以上的方法，我们能算出每一张图片在屏幕上的高度
#### 三 row与col组件
我们该怎么理解row与col呢？其实就是表格中的“行”与“列”。它们除了有能设置占位比例的span属性，row还有能设置元素间间距的gutter属性。还有一些其他属性，例如布局方式type，对齐方式justify，align，偏移量offset。点击时触发的click事件。这里就不做详细介绍了，有兴趣的同学可以去官方查看，地址如下
[https://youzan.github.io/vant/#/zh-CN/col](https://youzan.github.io/vant/#/zh-CN/col)
让我们来看看，我们在这一节中是如何实际运用的。
首先，我们需要打开app.json，在“usingComponents”属性中引入我们今天要用到的三个组件，row，col和image

```javascript
"usingComponents": {
"van-image": "@vant/weapp/image/index",
"van-row": "@vant/weapp/row/index",
"van-col": "@vant/weapp/col/index"
}
```
接下来，我们来创建一个view用来存放我们的row

```javascript
<view class="mid_menu">
</view>
```
给它一个样式

```css
.mid_menu{
  margin-top: 50rpx;
  margin-left: 20rpx;
  margin-right: 20rpx;
  background-color: white;
  border-radius: 30rpx;
  padding: 20rpx;
}
```
margin-top设置了顶边距
margin-left 和 margin-right分别设置了左边距与右边距。
background-color:设置了背景色为白色
padding设置了内边距
border-radius:设置了圆角半径
对于第一个row来讲，我们需要放量个col进来，还记得它们的比例吗？是2:1，也就是16:8

```javascript
<van-row gutter="6">
	<van-col span=“16">
	放一张图片
	</van-col>
	<van-col span=“8">
	放两张图片
	</van-col>
</van-row>
```
别忘了我们要设置这两个col之间的间距为6，也就是设置row的gutter的值。
接下来，我们只要在col中放入image组件就好，这里我们使用了vant组件库中的vant-image，这是一个非常方便的同时封装了很多强大功能的组件。例如我们可以直接设置它的高宽属性。由于我们已经使用span属性分配了它们的宽度比例，所以每一个image的宽只需要设置100%就好，而它的高，我们会绑定在一个计算好的属性中。例如rowHeight，

```javascript
height=“{rowHeight}}rpx" 别忘了单位是rpx。
```
而这个属性放在哪里呢？如果大家有印象的话，我们存放在js文件的data对象中。

```javascript
data: {
……
rowHeight:0,
……
}
```
而rowHeight的计算，我们会放在attached函数中。
而attached又是什么呢？我们来复习一下，这是当组件完成初始化，进入页面节点树后会被触发的函数。
如此就完成了第一个row的绘制。
第二个row来说就更加简单了，它分为三个等比例的col

```javascript
<van-row gutter="6">
  <van-col span="8">
  </van-col>
  <van-col span="8">
  </van-col>
  <van-col span="8">
  </van-col>
</van-row>
```
同样，col中的image的宽度设为100%，而高度需要计算。让我们来看看完整代码

```javascript
<view class="mid_menu">
	<van-row gutter="6">
		<van-col span="16">
			<van-image width="100%" height="{rowHeight}}rpx" src="cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/01.png" />
		</van-col>
		<van-col span="8">
			<van-image width="100%" height="{(rowHeight - 6)/2}}rpx" src="cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/02.png" />
			<van-image width="100%" height="{(rowHeight - 6)/2}}rpx" src="cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/03.png" />
		</van-col>
	</van-row>
	<van-row gutter="6">
		<van-col span="8">
			<van-image width="100%" height="{ rowHeight2 }}rpx" src="cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/04.png" />
		</van-col>
		<van-col span="8">
			<van-image width="100%" height="{ rowHeight2 }}rpx" src="cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/05.png" />
		</van-col>
		<van-col span="8">
			<van-image width="100%" height="{ rowHeight2 }}rpx" src="cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/06.png" />
		</van-col>
	</van-row>
</view>
```

//在rpx的单位下，屏幕的宽度都为750

```javascript
const winWidth = 750
const rowWidth = (winWidth - 80-6)*2/3
const rowHeight = rowWidth * 330/666 
const rowWidth2 = (winWidth - 80 -12)/3
const rowHeight2 = rowWidth2 * 315/324
```
## 为你推荐


“为你推荐”模块我们将分成三个部分
> 1 静态数据的界面
> 2 通过云函数获取数据
> 3 通过云数据库获取数据

今天，我们讲的是第一部分如何绘制静态数据的“为你推荐”。
也将分为三块内容
> 1 布局分析
> 2 编写静态数据
> 3 绑定数据，循环渲染

![](https://imgkr.cn-bj.ufileos.com/d4ab0135-b74b-485b-9704-73cd31a7a22b.png)
#### 一 我们来分析一下布局
我们可以看出，这个模块由上下两个row组成 
![](https://imgkr.cn-bj.ufileos.com/061e55f7-0343-44d3-a3ff-1ab613c27b13.jpeg)
我们来分析一下，上面的row由三个col组成。第二个col利用offset属性，与第一个col拉开了距离。如下图： 
![](https://imgkr.cn-bj.ufileos.com/72e19e0b-9416-452f-ab64-0abd889023b0.jpeg)
略微复杂的是下面的row，等分城了4个col。 
![](https://imgkr.cn-bj.ufileos.com/f20e16b1-7beb-44a7-b942-f089ddaa174a.jpeg)
现在我们来分析单个col。我们知道，在col中，元素是从上而下布局的。所以从上到下，依次为image，view。下面的价格由于我们要用到横向布局，所以是一个row，如下图： 
![](https://imgkr.cn-bj.ufileos.com/80435536-674b-4776-bb7c-ec632ebf9bdd.jpeg)
让我们来重点分析一下最下面的row的布局。我用了三个col，第一个col用来放价格，第二个是加号按钮，第三个col实现的是右编剧。他们的比例分别是18:4:2 
我们知道col是垂直布局，所以放置价格的col中我们会放入两个view。我比较喜欢在view中放文字。
![](https://imgkr.cn-bj.ufileos.com/169efa56-b8c1-4b99-aae0-1d8f26d0f5c9.jpeg)
至此，我们就完成了布局的分析。
#### 二 静态数据
“为你推荐”模块的数据是从云数据库中读取的，只不过在这一节中，我们将先采用静态数据模拟一下。我们该怎么写静态数据呢？
首先，我们要认识到，为你推荐这个模块推荐的是4个产品。所以这个数据应该是一个数组。而每个产品的参数是一致的，应该有缩略图：thum，产品名：name，原价：oPrice，折扣价：nPrice。
所以我们在“pages/home/cmponents/home/home.js”文件中的静态数据编写如下：

```javascript
data: {
    ......
    products: [{
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
  },
  ......
}
```
这里所涉及的图片我会放在github上。大家可以存到自己的云存储上。
**三 绑定静态数据**
最后，让我们来看看界面上的代码该怎么写，打开“pages/home/cmponents/home/home.wxml”，新增一个view

```javascript
<view class="mid_menu">
	<van-row gutter="6">
		<van-col span="8">
			<view class="menu_title">为你推荐</view>
		</van-col>
		<van-col span="6" offset="8">
			<view class="change">换一批</view>
		</van-col>
		<van-col span="2">
			<van-icon color="gray" size="28rpx" name="replay" />
		</van-col>
	</van-row>
	<van-row gutter="10">
		<block wx:for="{products}}" wx:key="*this">
			<van-col span="6">
				<van-image radius="16rpx" width="{productWidth}}rpx" height="{productWidth}}rpx" src="{item.thum}}" />
				<view class="pTitle">{item.name}}</view>
				<van-row>
					<van-col span="18">
						<view class="nPrice">¥{item.nPrice}}</view>
						<view class="oPrice">¥{item.oPrice}}</view>
					</van-col>
					<van-col span="4">
						<image style="width:30rpx;height:30rpx;margin-top:10rpx;" src="./images/btnAdd.png" />
					</van-col>
					<van-col span="2">
					</van-col>
				</van-row>
			</van-col>
		</block>
	</van-row>
</view>
```
这里面的知识点，其实我们之前都讲过。无非就是以下几点：
> 1 row和col的使用，它们是如何按比例布局的，今天的新知识点是偏移量属性offset，用来实现间隔布局。
> 2 推荐的产品，我们用block和wx:for实现了数据的绑定和产品的循环渲染。wx:key和item的意义也是学过的内容。

所以，如果大家是从头一路看过来的，这节将是非常轻松的。如果对样式有什么疑问，可以参看home.wxss里面的内容。
下一节，将会有新的内容，云函数，这是一个非常强大的功能。学会使用后，我们就离10x程序员又近了一步。

