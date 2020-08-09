---
title: "使用原生开发高仿瑞幸小程序（二）：使用云存储并实现轮播图"
description: "轮播图是我们常见的一种表现形式，通常，图片之间要做到无缝衔接循环需要花一些功夫，而小程序提供的组件就已经可以实现。可以说省去了开发者不少的时间。"
tags: ["微信小程序"]
categories: ["小程序", "原生微信小程序", "入门"]
date: 2020-06-08T00:00:01.509Z
photos:
  - https://static.tuture.co/c/%40eWKc0vcpD/2.jpg
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


## 创建轮播图

轮播图是我们常见的一种表现形式，通常，图片之间要做到无缝衔接循环需要花一些功夫，而小程序提供的组件就已经可以实现。可以说省去了开发者不少的时间。
所以，今天我们要一起来学习以下几件事：

{% note warning %}
因 Hexo 中双大括号是模板引擎语法，所以本系列中遇到的所有双大括号均修改成了 `{}}` 左单括号，右双大括号的形式，读者在实际写代码的时候需要写出左右都是双大括号。
{% endnote %}

> 1 学会使用云存储
> 2 学会使用image组件
> 3 简单自定义navigation
> 4 学会使用swiper组件来创建轮播图

#### 一 云存储的使用
让我们一步一步的来，首先我们需要给小程序的首页创建一个背景。如下图 
![](https://static.tuture.co/c/@eWKc0vcpD/1590064651583-ad298e93-658b-4268-97fc-d6d0facb48a2.png)
在这里，背景图片我放到了云存储上。要知道，当我们创建小程序后，我们有5G存储空间和5G的流量可以免费使用。这足够我们开发使用了。
那么，怎么把背景图图片放到云存储上呢？我们在微信开发者工具的顶部找到“云开发”按钮。
![](https://static.tuture.co/c/@eWKc0vcpD/1590064652039-90fa8794-72ea-475d-82f2-4a8485649868.png)
这时候，我们会打开“云开发控制台”。我们再点击“存储”按钮，就来到了云存储的管理界面。如下图
![](https://static.tuture.co/c/@eWKc0vcpD/1590064651922-f1606369-b548-45f7-8007-01a47df205d5.png)
我们可以通过“新建文件夹”来进行分类管理。想我，我就创建了“images”文件夹，同时在images文件夹下面根据Tabbar又创建了。“home”，“menu”，“cart”，“order”和“my”五个文件夹。
因为我们现在在创建首页嘛，所以我会把首页下的相关图片都放在home文件夹下。云存储不仅能存图片，还能存放其他文件，这里就不细讲了。
我们可以点击“上传文件”按钮，将今天所需的图片素材，传到云存储上。我将背景图和今天轮播图所需的图片都传到了“images/home”文件夹下。
我们的image组件能直接使用File ID，省却了地址转换的麻烦。File ID的地址如下图所示。 
![](https://static.tuture.co/c/@eWKc0vcpD/1590064651569-da29f500-7b08-4619-acd2-dc14eb27d32d.png)
上图红框所标示的地址就是我们背景图片的地址，让我们复制一下，接下来马上就会用到。
#### 二 利用image组件创建背景
接下来，我们需要使用的是image组件，我们将通过改变它的z坐标将它放置在其他组件的“下面”，这样就变成了home页面的背景了。为什么不用css中的background-image呢？因为这个属性必须使用网络图片或者base64图片。而我们的云存储的File ID地址必须要转换一下才能获得真实地址，所以太麻烦，不如直接用image来的快。
好，接下来看看怎么使用image组件。
首先，我们用view给整个试图创建一个根容器，仿造html，我们给class起名为body

```html
<view class="body">
</view>
接着，我们在其中放入image组件，背景图片
<view class="body">
<image class="bg" src="cloud://myluckin-unux5.6d79-myluckin-unux5-1302022060/images/home/homebg.png"></image>
</view>
```
我们给image 的class属性赋值为bg。接下我们到home.wxss中做一些工作。
首先，我们让body横向撑满整个屏幕

```html
.body{
  width: 100%;
}
```
接下来，我们要将改变image组件的z坐标了。

```css
.bg{
  /*fixed 固定位置 absolute 跟随屏幕滚动 */
  position: absolute; 
  top: 0;
  z-index: -100;
}
```
z-index就是我们所说的z坐标了。什么是z坐标呢，我们知道横轴是x坐标，竖轴是y坐标。xy组成了一个平面，也就是我们的手机屏幕。那么垂直与手机屏幕的就是z坐标。z坐标的值越小，就在越后面，也就会被挡住。那么当我们把z-index设为-100的时候，image就位于其他组件的下方了。
很好，如果一切正确，将会看到如下画面。
![](https://static.tuture.co/c/@eWKc0vcpD/1590064651546-5a230e43-5c84-40bd-a054-68ab4d9907fe.png)
这和我们所期望的效果有些不一样？我们期待的效果是没有顶部的navigation的对不对？不要着急，接下来我们就来解决这个问题。
#### 三 简单自定义navigation
其实要让顶部的navigation消失非常简单，我们只需要打开“pages/home/home.json”，添加

```javascript
"navigationStyle": “custom",
```
即可，这行代码的意思就是，我们将使用自定义的navigation。我们只要什么都不做，就让将默认的navigarion消失了。如下图所示
![](https://static.tuture.co/c/@eWKc0vcpD/1590064651586-b850bc1e-d9ba-469b-b973-ec8de76b9fbe.png)
至于如何自定义复杂的navigation，这就不是本节的内容了。
#### 四 创建轮播图
如何创建轮播图呢？答案是，使用小程序提供的swiper组件。使用swiper组件，一切都将变得非常的简单。
> 1 我们将在home.wxml中创建swiper
> 2 我们将在home.js中定义轮播图的数据
> 3 我们将在home.js中定义swiper所需要的定位数据

首先，让我们创建swiper

```html
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

```css
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

```css
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
```html
<image src="{item}}" mode="widthFix"></image>
```
此时，在我们的微信开发者工具的模拟器中，我们看到的是酱婶的：
![](https://static.tuture.co/c/@eWKc0vcpD/1590064651651-c0270d09-fc2a-4463-9837-9685e25e3f4f.png)
我们发现，轮播图的位置距离顶部太近了，我们至少要把状态栏和标题栏空出来。
状态栏和标题栏的高度，我们可以通过系统动态获取。所以我们组件home.js中，预留两个属性
`statusBarHeight: 0,`
`titleBarHeight: 0,`
这两个属性的值，我们会在组件进入页面时进行赋值。这样，在组件被渲染时就能拿来用了。
我们要做什么来着？为了让轮播组件下来一点。所以我们可以在承载swiper的view中这么写。

```html
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

代码如下

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
![](https://static.tuture.co/c/@eWKc0vcpD/1590064672123-8a2a10a2-39c2-4c48-b1a2-78625fc0ff1d.png)

## 小程序的全局数据


这一节我们只讲一件事，就是如何在小程序里面使用全局数据。涉及三个方面
> 1 为什么要使用全局数据
> 2 怎么存储全局数据
> 3 怎么读取全局数据

那么，为什么要使用全局数据？我们试想一下，如果有些数据所有界面都要用呢，该怎么办？一个页面一个页面的传会不会太麻烦了？
我们就在首页中尝试着使用一下全局数据。
我们在小程序的项目文件中能看到app.js这个文件。 
![](https://static.tuture.co/c/@eWKc0vcpD/1590064696329-b5e34c5c-3b44-448f-9c14-92e00152d72a.png)
这个文件用来干什呢？是用来注册小程序用的，同时小程序的一系列事件都会在这个文件里得到响应。例如小程序初始化了，小程序前后台切换，还有就是可以用来存储一些全局数据。
重要的是，整个小程序只会有一个app.js的实例。这也是为什么它适合用来存储全局数据。
怎么存放呢？我们注意到app.js中有这么一行代码

```javascript
this.globalData = {}
```
这行代码的意思是，app的实例中，有个对象叫globalData，我们通常会把全局数据存放在globalData这个对象中。
那么，当我们把全局数据存放到app.js中的话，我们又该如何读取出来呢？
首先，我们能够通过全剧函数getApp()获得app.js的唯一实例。
接着就能通过点语法取出数据了，完整代码差不多就是这个样子。

```javascript
getApp().globalData.数据
```
所以整个过程就这么简单，分两步，放进去，取出来。
好，还记得上一节我们讲过的如何计算轮播图的顶边距吗？我们需要得到statusBarHeight和titleBarHeight。那我们现在就把这两个值放入全局数据中。
所以我们把home.js中attached函数中的代码移到app.js中，并将statusBarHeight和titleBarHeight的值赋给globalData。代码如下

```javascript
this.globalData = {}
wx.getSystemInfo({
  success: (res) => {
    this.globalData.statusBarHeight = res.statusBarHeight
    this.globalData.titleBarHeight = wx.getMenuButtonBoundingClientRect().bottom + wx.getMenuButtonBoundingClientRect().top - (res.statusBarHeight * 2)
  },
  failure() {
    this.globalData.statusBarHeight = 0
    this.globalData.titleBarHeight = 0
  }
})
```
这完成了第一步，把数据放进去。现在我们把数据取出来。
回到home.js的attached函数中，以下是取出数据的代码

```javascript
attached() {
this.setData({
  statusBarHeight: app.globalData.statusBarHeight,
  titleBarHeight: app.globalData.titleBarHeight
})
},
```
我们注意到更新数据用的是this.setData函数。使用这个函数更新数据，绑定数据的界面才会更新。

## 更正轮播组件的高度计算


> 首先是一个知识点，当我们在小程序中使用rpx单位的时候，屏幕的宽度都为750rpx。我们通过wx.getSystemInfoSync().windowWidth获得的是px为单位的屏幕宽度。如果涉及到需要使用屏幕宽度来计算尺寸，请使用750，因为我们在小程序中，使用的单位是rpx。

现在，我们来重新计算轮播图的高度。
之前，我们把高度的计算直接写在了wxml中，现在我们把它剥离出来，同时用变量swiperHeight做为高度的绑定。`如下：

```css
style="margin-top:{(titleBarHeight + statusBarHeight)}}rpx;height:{swiperHeight}}rpx;"
```
于是，我们的精力将集中在swiperHeight的计算上。
首先，我们需要在data中声明swiperHeight

```javascript
data: {
    swiperHeight:0,
......
```
接着，我们来计算swiperHeight，而我们之前推导过高度的计算，还记得吗？如下：

```javascript
轮播组件的高度 = (wx.getSystemInfo().windowWidth - 40)*540/1065
```
现在我们知道了，不该使用wx.getSystemInfo().windowWidth，而该直接使用750.所以我们的计算公式就该改为如下：

```javascript
const winWidth = 750
const swiperHeight = (winWidth - 40 ) * 540/1065
```
计算完后，别忘了使用setData更新swiperHeight的值。这下，轮播图的显示终于完美。 
![](https://static.tuture.co/c/@eWKc0vcpD/1590065279213-5ce25feb-b34f-4c87-93f2-bfa16fce8610.png)
为了让swiper 和image组件在不同的屏幕下都能撑满，最好给它们都加上如下样式

```css
style=“width:100%;height:100%"
```

