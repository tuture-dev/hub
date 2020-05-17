---
title: "uni-app 结合云函数开发小程序博客（二）：接入云函数，实现完善的列表刷新机制"
description: "一个博客小程序必备的列表刷新机制、实现最接近现代主流网页的文章展示方式，并通过云函数打通小程序的后端"
tags: ["uni-app"]
categories: ["小程序", "uni-app", "入门"]
date: 2020-05-02T00:00:00.509Z
photos:
  - https://imgkr.cn-bj.ufileos.com/c827f47d-cfe5-413e-aa37-6bfe0321829c.png
---

<div class="profileBox">
  <div class="avatarBox">
    <a href="https://github.com/Bluestar123"><img src="/images/avatars/cebuzhun.png" alt="" class="avatar"></a>
  </div>
  <div class="rightBox">
    <div class="infoBox">
    <a href="https://github.com/Bluestar123"><p class="nickName">测不准</p></a>
  </div>
  <div class="codeBox">
    <a href="https://github.com/Bluestar123/testt"><span class="codeText">查看代码</span></a>
  </div>
  </div>
</div>

因为项目做的是博客demo， 首页进来想给人直观的就能看到文章，看到分类。所以想的一个是可以左右滑动，切换分类，一个是页面以列表形式，直接 list 渲染。类似掘金的样式：
![](https://imgkr.cn-bj.ufileos.com/45044261-f9f0-4102-93a8-84a8fca1517f.png)

1. 页面的左右滑动，并自带过渡效果，直接就可以使用自带的swiper组件；
1. 顶部的分类导航其实也是跟着可以左右滑动，并且跟随swiper 页面同步切换，选择也是小程序组件scroll-view，设置为左右滑动；
1. 上拉加载更多：小程序有自带的生命周期 `onReachBottom`， 默认距离底部50px距离，想要修改可以在页面的style 中设置 `onReachBottomDistance` 字段
1. 下拉刷新：小程序页面生命周期 `onPullDownRefresh`，同时要在页面的style重配置
`enablePullDownRefresh：true`开启下拉刷新；掘金的下拉刷新是安卓app的下拉样式，当你用uniapp开发应用，真机运行是可以看到如下结果。



![](https://imgkr.cn-bj.ufileos.com/2e0dad2c-dfa0-478a-824d-bdcbba1bf021.png)

小程序自带的下拉样式如下（原生导航条）：


![](https://imgkr.cn-bj.ufileos.com/797c9468-0234-4ca2-b7cd-636801e02338.png)


使用自定义导航条下拉样式如下：它会从最顶部开始出现下拉样式

![](https://imgkr.cn-bj.ufileos.com/a60475f9-7510-4b57-93e9-33efaba772b2.png)


很明显上面的结果不是我们想要的，常用的方式是自定义导航条下面的内容区使用scroll-view 组件，通过scroll-view监听到达顶部和到达底部，继而出发下拉和上拉。为了避免重复造轮子和瞻仰大佬的代码，咱们选择到插件市场逛一逛：最终我选择了如下插件

![](https://imgkr.cn-bj.ufileos.com/0fd9b160-90fe-4bf5-95ff-e2282db7cdea.png)
## 

## 引入插件进行布局



1. 下载插件，把如下两个文件夹复制到自己的项目中，我放到了(`/colorui/components/`)，scroll有空数据时的图片记得一并引入。
1. ![](https://imgkr.cn-bj.ufileos.com/02983d48-1757-4a2a-8aae-f7697671adb7.png)

大家可以自己运行下载的zip安装包，项目直接可以跑通。咱们这里不做演示，直接引入插件中的代码放入首页： （代码参考插件中的` /pages/swipe-list/index.vue`）


```html
以下代码在 /pages/home/home.vue 中
...
<view class="top-wrap"><tab id="category" :tab-data="categoryMenu" :cur-index="categoryCur" :size="80" :scroll="true" @change="toggleCategory"></tab></view>
// 这里 swiper使用的是animationfinish，当滑动完成后改变，也可以使用 change事件
<swiper :current="categoryCur" :duration="duration" @animationfinish="swipeChange">
	<swiper-item v-for="(item, index) in categoryData" :key="index">
		<scroll :requesting="item.requesting" :end="item.end" :empty-show="item.emptyShow" :list-count="item.listCount" :has-top="true" :refresh-size="80" @refresh="refresh" @more="more">
			<view class="cells">
				<view class="cell" v-for="(item, index) in item.listData" :key="index">
					<view class="cell__hd"><image mode="aspectFill" :src="item.images" /></view>
					<view class="cell__bd">
						<view class="name">{{ item.title }}</view>
						<view class="des">{{ item.description }}</view>
					</view>
				</view>
			</view>
		</scroll>
	</swiper-item>
</swiper>
...
```
```javascript
以下代码在 /pages/home/home.vue 中


// 用于分页
let pageStart = 0
let pageSize = 15
// 列表数据
let testData = [
	{
		title: '这个绝望的世界没有存在的价值，所剩的只有痛楚',
		description: '思念、愿望什么的都是一场空，被这种虚幻的东西绊住脚，什么都做不到',
		images: '/static/logo.png' // 这里换成自己本地的图片地址
	}...]
// 引入组件， 修改路径
import Tab from '@/colorui/components/tab/index'
import Scroll from '@/colorui/components/scroll/index'


components:{Tab, Scroll},
// 当页面存在时，只会加载一次； onShow 是每次界面显示都会触发，包括手机的屏幕关闭和唤起
onLoad() {
        // 第一次进入 加载第一页的数据
	this.getList('refresh', pageStart)
},
methods: {
	getList(type, currentPage = 1) {
		let pageData = this.getCurrentData()


		pageData.requesting = true


		this.setCurrentData(pageData)


		uni.showNavigationBarLoading()


		setTimeout(() => {
			pageData.requesting = false


			uni.hideNavigationBarLoading()


			if (type === 'refresh') {
				pageData.listData = testData
				pageData.listCount = pageData.listData.length
				pageData.end = false //是否已经全部加载
				pageData.page = currentPage + 1
			} else {
				pageData.listData = pageData.listData.concat(testData)
				pageData.listCount = pageData.listData.length
				pageData.end = true
				pageData.page = currentPage + 1
			}


			this.setCurrentData(pageData)
		}, 100)
	},
	// 顶部tab切换事件
	toggleCategory(e) {
		this.duration = 0


		setTimeout(() => {
			this.categoryCur = e.index
		}, 0)
	},
	// 页面滑动切换事件
	swipeChange(e) {
		this.duration = 300


		setTimeout(() => {
			this.categoryCur = e.detail.current


			this.loadData()
		}, 0)
	},
	// 更新页面数据
	setCurrentData(pageData) {
		this.categoryData[this.categoryCur] = pageData
	},
	// 获取当前激活页面的数据
	getCurrentData() {
		return this.categoryData[this.categoryCur]
	},
	// 判断是否为加载新的页面,如果是去加载数据
	loadData() {
		let pageData = this.getCurrentData()
		if (pageData.listData.length == 0) {
			this.getList('refresh', pageStart)
		}
	},
	// 刷新数据
	refresh() {
		this.getList('refresh', pageStart)
	},
	// 加载更多
	more() {
		this.getList('more', this.getCurrentData().page)
	}
}

```
```css
以下代码在 /pages/home/home.vue 中


<style lang="scss">
// 这里改成自己放置页面的位置，  tab 和 swiper 组件中的 scss 变量文件引用也要修改
@import '~@/colorui/variables';


$top-height: 90rpx;


.top-wrap {
	position: fixed;
	left: 0;
	top: 0;
	/* #ifdef H5 */
	top: var(--window-top);
	/* #endif */
	width: 100%;
	background-color: #ffffff;
	z-index: 99;
}


swiper {
	height: 100vh;
}


.cells {
	background: #ffffff;
	margin-top: 20rpx;
}


.cell {
	display: flex;
	padding: 20rpx;


	&:not(:last-child) {
		border-bottom: 1rpx solid $lineColor;
	}


	&__hd {
		font-size: 0;


		image {
			width: 160rpx;
			height: 160rpx;
			margin-right: 20rpx;
			border-radius: 12rpx;
		}
	}


	&__bd {
		flex: 1;


		.name {
			@include line(2);
			font-size: 28rpx;
			margin-bottom: 12rpx;
		}


		.des {
			@include line(2);
			color: $mainBlack2;
			font-size: 24rpx;
		}
	}
}
</style>

```
页面效果如下：我们发现，引入了但是没有tab组件

![](https://imgkr.cn-bj.ufileos.com/e3a90e1e-821c-4db6-a093-bf4035d1529d.png)


查看dom结构可知：

![](https://imgkr.cn-bj.ufileos.com/0711bcd0-d62d-4384-8a01-bdefa32b0969.png)


`.top-wrap`使用了fixed定位，使用原生导航条没有影响，而我们使用的自定义导航条，也是定位。所以这里需要给 tab 设置 top 值，导航条的高度。还记得我们在实现自定义导航条时在App.vue中获取系统相关信息，赋值到了 `Vue.prototype.CustomBar`


```html
// 以下代码在 /pages/home/home.vue中
// 动态设置 top值
<view :style="{top: CustomBar+'px'}" class="top-wrap tui-skeleton-rect">
	<tab id="category" :tab-data="categoryMenu" :cur-index="categoryCur" :size="80" :scroll="true" @change="toggleCategory"></tab>
</view>
...
data 中设置
CustomBar: this.CustomBar,

```
效果很帅气~~

![](https://imgkr.cn-bj.ufileos.com/1abd8217-2148-4edd-a5fb-f3e53b329bf8.png)




这时大家在左右滑动的时候会发现一个问题，第一次从推荐滑动到精选集锦的时候，tab中的下边栏没有动，之后的滑动都会运动：

![](https://imgkr.cn-bj.ufileos.com/4dc7a6e4-18f1-490b-9761-793987396c4a.gif)


我们查看发现` /colorui/tab/index.vue` 中的 scrollByIndex 方法没有触发，在`tab/index.vue`中，我们发现实际上 curIndex 值是变化的，最简单的方式就是在监听curIndex变化的时候触发 scrollByIndex 方法：

```javascript
watch: {
	curIndex(newVal, oldVal) {
		this.tabCur = newVal
		this.tabCurChange(newVal, oldVal)
                // 新增
		this.scrollByIndex(newVal)
	},
...

```


bug 解决
![](https://imgkr.cn-bj.ufileos.com/9eea784b-5f59-4d25-81ce-d954a9dae8bc.gif)


## 添加云函数


这里我们创建两个云函数，一名为article存放类别下的文章，一名为articleCategory，对应我们的顶部tab(我也不确定这么分是否最好)。创建完成后记得上传。

- 初始化云数据库
```json
// 以下代码在 db_init.json 中
"article_category": {
	"data": [ // 数据
		{
			"name": "掘金"
		},
		{
			"name": "HTML"
		},
		{
			"name": "CSS"
		},
		{
			"name": "JS"
		},
		{
			"name": "VUE"
		},
		{
			"name": "REACT"
		},
		{
			"name": "LeeCode"
		},
		{
			"name": "面试题"
		}
	    ],
	    "index": [{ // 索引
	        "IndexName": "name", // 索引名称
	        "MgoKeySchema": { // 索引规则
	            "MgoIndexKeys": [{
	                "Name": "name", // 索引字段
	                "Direction": "1" // 索引方向，1：ASC-升序，-1：DESC-降序
	            }],
	            "MgoIsUnique": false // 索引是否唯一
	        }
	    }]
}

```


右键初始化我们的云数据库，如下

![](https://imgkr.cn-bj.ufileos.com/312cd558-a66e-411f-be7d-8d45f2c46c01.png)


因为云数据库中有我们的user 数据，包括初始化和注册的，所以我们这里不覆盖。这是打开我们的云端web控制台，可以看到数据初始化成功：

![](https://imgkr.cn-bj.ufileos.com/d29b2e6a-29f8-4f3d-891c-e537b22bba72.png)

接下来我们初始化文章表，由于文章会跟种类对应，所以文章每一项会有个categoryId字段，所以我们先初始化的类别表，初始化article表：


```json
// 以下代码在 db_init.json 中


// 文章表
"article": {
	   "data": [ // 数据
		{
			"headImg": "https://images.weserv.nl/?url=https://p1.ssl.qhimgs1.com/sdr/400__/t012defb31c27aec7eb.jpg",
			"title": "这个绝望的世界没有存在的价值，所剩的只有痛楚1",
			"categoryId": "5ebd3b7f33bd17004e01c686",
			"description": "思念、愿望什么的都是一场空，被这种虚幻的东西绊住脚，什么都做不到",
			"date": "2020-03-09"
		},
		{
			"headImg": "https://images.weserv.nl/?url=https://p1.ssl.qhimgs1.com/sdr/400__/t012defb31c27aec7eb.jpg",
			"title": "这个绝望的世界没有存在的价值，所剩的只有痛楚2",
			"categoryId": "5ebd3b7f33bd17004e01c686",
			"description": "思念、愿望什么的都是一场空，被这种虚幻的东西绊住脚，什么都做不到",
			"date": "2020-03-08"
		},
		{
			"headImg": "https://images.weserv.nl/?url=https://p1.ssl.qhimgs1.com/sdr/400__/t012defb31c27aec7eb.jpg",
			"title": "这个绝望的世界没有存在的价值，所剩的只有痛楚css",
			"categoryId": "5ebd3b7f33bd17004e01c686",
			"description": "思念、愿望什么的都是一场空，被这种虚幻的东西绊住脚，什么都做不到",
			"date": "2020-03-08"
		}
	   ],
	   "index": [{ // 索引
	       "IndexName": "date", // 索引名称
	       "MgoKeySchema": { // 索引规则
	           "MgoIndexKeys": [{
	               "Name": "date", // 索引字段
	               "Direction": "-1" // 索引方向，1：ASC-升序，-1：DESC-降序
	           }],
	           "MgoIsUnique": false // 索引是否唯一
	       }
	  }]
}

```


> 正常应该有PC管理平台，分配上传文章，并实现文章和类别的对应，这里就自己简化操作



这时开始写我们的页面逻辑：先把前端写死的假数据清除，包括categoryMenu 和 categoryData（记住数据格式）。
### 编写请求类别逻辑
```javascript
// 以下代码在 /pages/home/home.vue 中
onLoad() {
        // 我得逻辑是先请求类别，在根据第一个类别获取文章
	this.getCategoryMenu()
	// this.getList('refresh', pageStart)
},
...
async getCategoryMenu() {
        // 以防内部执行出错
	try {
                // 还记得我们在user表时，创建了add 和get两个目录处理不同操作，
                // 这里也用了同样思路，万一想在小程序里实现delete 和put功能也方便，不是必须的
		const res = await this.$uniCloud('articleCategory', {
			type: 'get'
		})


		this.categoryMenu = ?
		this.categoryData = ?
                // 获取完类别 获取类别下的文章
		this.getList('refresh', pageStart)
	} catch (e) {
                // 在全局混入中定义了通用的报错信息
		this.$toast(this.errorMsg)
	}
}
...

```


书写articleCategory函数中逻辑：


```javascript
// 一下代码在云函数 articleCategory中
'use strict';
const { get } = require('./get')
exports.main = async (event, context) => {
        // event 就是我们传递的 变量对象
	switch (event.type) {
		case 'get':
			return await get(event)
	}
};


// get 目录
const db = uniCloud.database()
exports.get = async (data) => {
        // 数据没有限制，表中有什么返回什么
	const collection = db.collection('article_category')
        // 查找最后一定要 get 一下
	return await collection.get()
}


// 记得上传运行云函数呦

```


云函数部署成功后，刷新我们的页面，发现有请求，书写页面逻辑：
![](https://imgkr.cn-bj.ufileos.com/6b7d40a4-e8ad-4e6a-8ea7-6d66d7b09f6b.png)


```javascript
// 请求处理数据代码
async getCategoryMenu() {
	try {
		const res = await this.$uniCloud('articleCategory', {
			type: 'get'
	        })


		this.categoryMenu = res.result.data
		this.categoryData = this.categoryMenu.map(item => {
			return {
				name: item.name,
				requesting: false,
				end: false,
				emptyShow: false,
				page: pageStart,
				listData: []
		}
		})
                // 请求第一类别文章
		// this.getList('refresh', pageStart)
	} catch (e) {
		this.$toast(this.errorMsg)
	}
}

```


这时发现页面显示不正确：
![](https://imgkr.cn-bj.ufileos.com/72ed51ee-e45e-4476-9b83-fb25bdf90fdc.png)


我们看一下`tab/index.vue` 插件代码，发现 11 行显示的是 item，而我们返回的是对象， 所以改成 item.name，这时我们的类别显示出来了。
### 编写请求文章逻辑


```javascript
// home.vue中的getList方法
// 插件本身逻辑不用动，只需加入我们的请求
async getList(type, currentPage = 1) {
	let pageData = this.getCurrentData()


	pageData.requesting = true


	this.setCurrentData(pageData)
	// 自定义导航栏没有这个，需要可以自己加
	// uni.showNavigationBarLoading()


	// 请求数据, 第0页开始 1-10条
	let res = await this.$uniCloud('article', {
                // 类别
		categoryId: this.categoryMenu[this.categoryCur]._id,
		currentPage,// 第几页
		pageSize// 每页数量
	})
        // 请求的数据赋值
	testData = res.result.list


	setTimeout(() => {
		pageData.requesting = false


		// uni.hideNavigationBarLoading()


		if (type === 'refresh') {
			pageData.listData = testData
			pageData.listCount = pageData.listData.length
			pageData.end = false //是否已经全部加载
		        pageData.page = currentPage + 1
		} else if (testData.length === 10) {
			pageData.listData = pageData.listData.concat(testData)
			pageData.listCount = pageData.listData.length
			pageData.end = false
			pageData.page = currentPage + 1
		} else if (testData.length >= 0 && testData.length < 10) {
			pageData.listData = pageData.listData.concat(testData)
			pageData.listCount = pageData.listData.length
			pageData.end = true
			// pageData.page = currentPage + 1
		}


		this.setCurrentData(pageData)
		if (pageData.listData.length === 0) {
			pageData.emptyShow = true
		}
	}, 100)
}

```


```javascript
// 以下代码在article云函数中, 相信大家一看会很清楚
'use strict';
const db = uniCloud.database()
const dbCmd = db.command


exports.main = async (event, context) => {
  const collection = db.collection('article')
  // 总条数
  let total = await collection.where({categoryId : event.categoryId}).count()


  // 获取文章列表
  let start = event.currentPage * event.pageSize
  let res = await collection.where({categoryId : event.categoryId}).orderBy('date','desc').skip(start).limit(event.pageSize).get();
  return {
	  total: total.total,
	  list: res.data
  }
};

```


数据出来了，三调正好和初始化的一样（没有出现图片的小伙伴，我们修改了images变量为 headImg，记得修改）
![](https://imgkr.cn-bj.ufileos.com/7796be1b-6639-447f-b5df-1635ff769c7b.png)




这里有个小问题
![](https://imgkr.cn-bj.ufileos.com/a42ed311-488b-45a2-8849-cf8c28aa7777.png)


这里不是使用的border-bottom，而是根据tab 的item的宽度对应生成的，那这个初始长度哪里来的呢，查看`tab/index.vue`源码中data初始赋值：` lineWidth: 100, // 下划 line 宽度`，我们发现在初始化数据时并未触发动态生成下划线的方法：this.init()，因为插件是直接写死的数据，页面直接渲染，而我们是请求的数据，
所以初始时并未执行，同样一个watch即可：


```javascript
以下代码在 tab/index.vue中
watch:{
...
        tabData(newVal) {
		this.init()
	}
}

```

我们发现未有数据时，会有个100px长的line，所以我们直接设置初始值为0即可

![](https://imgkr.cn-bj.ufileos.com/2130286d-10a7-4a43-931e-67102e2ff80d.gif)
## 文章详情


由于存储到云数据库中时，都会自动生成_id，所以从文章列表页跳转到详情页，只要带着_id字段即可，在详情页面进行请求。

> 在pages目录右键创建page-details页面，由于文章内容以markdown或者富文本形式，我们可以使用rich-text组件，但是该组件对图片的预览，链接的跳转，包括事件的实现都不好，所以我们同样在插件市场使用parse富文本解析插件，首先实现列表跳转详情页：



```javascript
// home.vue 中
<view class="cells">
        // navigator-hover 内置的点击样式
	<view hover-class="navigator-hover" @tap='toDetail(item)' class="cell" v-for="(item, index) in item.listData" :key="index">
		<view class="cell__hd"><image mode="aspectFill" :src="item.headImg" /></view>
		        <view class="cell__bd">
			<view class="name">{{ item.title }}</view>
		        <view class="des">{{ item.description }}</view>
		</view>
	</view>
</view>
...
toDetail(item) {
	this.$router('/page-details/page-details?_id='+item._id)
}


// 以下代码在 page-details.vue中
onLoad(e) {
    //路由中传参，使用onLoad接收
    console.log(e)
}

```



![](https://imgkr.cn-bj.ufileos.com/bd147d85-3061-435c-8bc7-84f41fed1e89.png)


- 富文本解析插件

![](https://imgkr.cn-bj.ufileos.com/4d91068f-d76a-4f03-af2a-50e64a777c6e.png)

下载zip解压到我们的项目中，` /colorui/components/parse`，在app.vue中引入样式
`@import "colorui/components/parse/parse.css";`，page-details中使用：


```javascript
<view>
	<Parse :content="article"  @preview="preview" @navigate="navigate"></Parse>
</view>
...
import Parse from '@/colorui/components/parse/parse.vue'
data() {
	return {
		article: ''
	}
},
components:{Parse},
...
//预览图片
preview(src, e){},
// 跳转
navigate(href, e){}

```



插件支持富文本格式和markdown格式，先介绍markdown使用

### markdown



- 使用cnpm安装marked，在根目录下npm init -y && cnpm install marked --save 
- 详情目录中引入 import marked from 'marked'



```javascript
let str = `# uncertainty \r\n ## uncertainty \r\n ### uncertainty`
this.article = marked(str)

```


![](https://imgkr.cn-bj.ufileos.com/a4ff8078-23d5-4067-bf37-d2a129b3b24c.png)


### 富文本


```javascript
onLoad(e) {
	this.article = `<div><h1>你好啊</h1><h2>我很好</h2></div>`
},

```


![](https://imgkr.cn-bj.ufileos.com/e47be2ae-c49a-4fe8-a997-576ed0a87fbf.png)
### 详情接口
创建pageDetails云函数，上传并运行；初始化 article_details 集合：


```javascript
// 以下代码在 db_init.json


"article_details": {
	"data": [
		{
                        // 这里的_id切记要和列表中返回的对应
			"id": "5ebd3c9c3c6376004c5cedbc",
			"content": "# 你好测不准 hello",
			"date": "2020-05-18"
		}
	],
	"index": [{
		"IndexName": "id", // 索引名称
		"MgoKeySchema": { // 索引规则
			  "MgoIndexKeys": [{
			      "Name": "id", // 索引字段
			      "Direction": "-1" // 索引方向，1：ASC-升序，-1：DESC-降序
			  }],
			  "MgoIsUnique": true // 索引是否唯一
		}
      }]
}

```



我使用的文章详情的id值对应列表中的_id值，实现查找；只需要点击列表跳转时把_id传到详情页，详情页中实现获取云端数据


```javascript
// 以下代码在 page-details.vue中
onLoad(e) {
	this.getDetails(e)
},
...
async getDetails(e) {
	let res = await this.$uniCloud('pageDetails', {
		id: e._id
	})
	try{
		this.article = marked(res.result.data[0].content)
	}catch(e){
		//TODO handle the exception
	}


},

```



![](https://imgkr.cn-bj.ufileos.com/25adaeaf-f484-4570-909a-395a39e93d58.png)

发现请求成功，数据也是我们刚刚上传的，富文本格式也是一样的；属性配置大家使用官网即可

![](https://imgkr.cn-bj.ufileos.com/c0734470-6199-471f-9316-59ed69acf4a6.png)


如果后台返回的富文本中的媒体标签 img、video等的链接地址没有域名，只有目录如`/upload/images/a.png`，大家可以在 `/parse/libs/wxDiscode.js`中修改：

![](https://imgkr.cn-bj.ufileos.com/296ab421-ba9e-4365-a973-d4e49b7e5a9b.png)


如果有a标签需要跳转，应为web-view组件，页面中使用原生导航条，web-view加载的第三方页面层级会最高。 App开发中使用富文本解析显示的结果可能会和小程序中不同，大家可自行尝试。
使用rich-text标签解析富文本的朋友，可能很难去改变内部的样式，还有不能给标签添加事件。如果功能简单的话大家可以使用字符串替换添加样式类，如：

> 后台返回数据 let str = '<div>你好测不准</div>'
> 1.实现文本复制可以  str = ‘<div class="wrapper">’ + str + '</div>'
> .wrapper{
> 	user-select: text;
> }
> 2.给图片添加类名，设置居中，最大宽度100%
> str = str.replace(/<img/g,"<img class='my-img'")
.my-img{
> 	display:block;
> 	max-width:100%;
> 	margin: 0 auto;
> }


> 如果详情页面中有点赞，而列表页中为 onLoad 请求，那么在退出详情页返回列表页时不会在请求（如果使用onShow，会重新请求，但是列表页会有分页查询，发挥列表页时在请求会带来很多不便），这时要更新列表页的点赞数，确定点赞或取消点赞成功的话，可以使用 uni 自带的 uni.$emit()，和 uni.$on()，详情页触发，列表页监听。和vue 的EventBus一样

## 制作侧边弹出栏
因为我得页面只做了两个切换按钮，所以设置头像，设置字段就放在侧边抽屉：
![](https://imgkr.cn-bj.ufileos.com/61e6e985-d232-408d-8a1b-f26ecd3e9274.gif)
我们要在自定义导航条组件中进行小修改


```html
// 以下代码在cu-custom中
<view class="action" @tap="BackPage" v-if="isBack">
	<text :class="'cuIcon-' + icon"></text>
	<slot name="backText"></slot>
</view>


props中添加
icon: {
	type: String,
	default: 'back'
}

```


图标我们选用colorui自带的cuIcon-sort


![](https://imgkr.cn-bj.ufileos.com/e0934571-3de9-4320-a0f7-ff6df95eea3f.png)

创建组件colorui/components/drawer/drawer.vue。其实思路也比较简单，就是icon是back还是sort，如果是sort就显示侧边栏，加个简单的动画，直接上代码：

```html
以下代码在 /colorui/components/drawer/drawer.vue
<template>
	<view class="drawer-class drawer" :class="[visible ? 'drawer-show' : '','drawer-left']">
		<view v-if="mask" class="drawer-mask" @tap="handleMaskClick" @touchmove.stop.prevent></view>
		<view class="drawer-container" @touchmove.stop.prevent>
			<slot></slot>
		</view>
	</view>


</template>


<script>
	export default {
		name:"tuiDrawer",
		props: {
			visible: {
				type: Boolean,
				default: false
			},
			mask: {
				type: Boolean,
				default: true
			},
			maskClosable: {
				type: Boolean,
				default: true
			}
		},
		methods: {
			handleMaskClick() {
				if (!this.maskClosable) {
					return;
				}
				this.$emit('close', {});
			}
		}
	}
</script>


<style>
	.drawer {
		visibility: hidden;
	}
	.drawer-show {
		visibility: visible;
	}
	.drawer-show .drawer-mask {
		display: block;
		opacity: 1;
	}


	.drawer-show .drawer-container {
		opacity: 1;
	}


	.drawer-show.drawer-left .drawer-container{
		transform: translate3d(0, -50%, 0);
	}


	.drawer-mask {
		opacity: 0;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 99999;
		background: rgba(0, 0, 0, 0.6);
		transition: all 0.3s ease-in-out;
	}


	.drawer-container {
		position: fixed;
		left: 50%;
		height: 100%;
		top: 0;
		transform: translate3d(-50%, -50%, 0);
		transform-origin: center;
		transition: all 0.3s ease-in-out;
		z-index: 99999;
		opacity: 0;
		background: #fff;
	}


	.drawer-left .drawer-container {
		left: 0;
		top: 50%;
		transform: translate3d(-100%, -50%, 0);
	}
</style>

```


在`cu-custom/cu-custom.vue`中引入（布局样式大家可以根据自己的喜好书写）：


```html
// 以下代码在/colorui/components/cu-custom/cu-custom.vue中
...
<drawer mode="left" :visible="isleftDrawer" @close="closeDrawer">
	<view class="d-container h-100 flex flex-direction justify-center align-center">
		<view class="cu-avatar xl bg-red round cu-card shadow margin-bottom-xl">
			<!-- 随机头像 http://api.btstu.cn/doc/sjtx.php-->
			<image src="http://api.btstu.cn/sjtx/api.php" class="w-100 h-100"></image>
		</view>


		<view class="cu-list w-100 menu">
			<view class="cu-item arrow" @tap='handleNav(item)' v-for="(item, index) in navList" :key='index' hover-class="hover-class">
				<view class="content">
					<text class="text-grey" :class="['cuIcon-' + item.icon]"></text>
					<text class="text-grey">{{item.navName}}</text>
				</view>
			</view>
		</view>
	</view>
</drawer>
...
import Drawer from "../drawer/drawer"
...
data() {
  retrun {
    isleftDrawer: false
  }
},
components: {Drawer},
props: {
    ...
    icon: {
	type: String,
	default: 'back'
    }
}

```


## 小节
本小节是是博客demo的最后一部分，功能没多少，也算是我对使用云函数的一个小总结。大家可以自己的想法设计自己的小程序，自己书写云函数，小编也是刚入手，有写的不对的地方请大家指正；有跟着实现功能的朋友也可以自己去拓展，例如列表页实现骨架屏，大家可以去插件市场学习查看更多的功能实现，引入到自己的项目中。能力一般，水平有限，谢谢阅读！

