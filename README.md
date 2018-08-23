<p align="center"><img src="https://github.com/Jocs/img-viewer/blob/master/logo.png?raw=true" alt="mark text" width="100" height="100"></p>

<h1 align="center">IMG VIEWER</h1>

<div align="center">
  <strong>A <code>tool</code> to help you better preview your images</strong>
</div>

<br />

<div align="center">
  <h3>
    <a href="https://github.com/jocs/img-viewer#features">
      Features
    </a>
    <span> | </span>
    <a href="https://github.com/jocs/img-viewer#download">
      Download
    </a>
    <span> | </span>
    <a href="https://github.com/jocs/img-viewer#guide">
      Guide
    </a>
    <span> | </span>
    <a href="https://github.com/jocs/img-viewer#documents">
      Documents
    </a>
    <span> | </span>
    <a href="https://github.com/jocs/img-viewer#integration">
      Integration
    </a>
  </h3>
</div>

## Features

* 支持图片放大、缩小、移动以及缩略图功能

* 零依赖，并且支持 typescript

* 能够很好的和 React、Vue、Anguar 前端框架整合

## Download

```sh
npm install -D img-viewer
```

## Guide

在 html 文件中添加 `div#custom-id` 元素。

```html
<div id="custom-id"></div>
```

在 javascript 文件中引入 `img-viewer`。

```javascript
import ImgViewer from 'img-viewer'

// or add css in the html file
import 'img-viewer/lib/imgViewer.css'

const container = document.querySelector('#custom-id')
const imageViewer = new ImgViewer(container, {
  url: 'the/path/to/your/image/url.png'
})
```

## Documents

#### class：ImgViewer

构造函数，用于生成图片预览实例。用法如下：

```javascript
const imageViewer = new ImgViewer(container, options)
```

* container: **HTMLDivElement** 类型，用于设置图片预览的容器元素。

* options：生成图片预览实例的配置项。

| 选项               | 是否必选 | 类型       | 默认值   | 含义                                               |
|:----------------:|:----:| -------- |:-----:|:------------------------------------------------:|
| url              | 是    | string   | 无     | 预览图片 url                                         |
| zoomValue        | 否    | number   | 100   | 初始图片放大倍数                                         |
| snapView         | 否    | boolean  | true  | 是否显示缩略图                                          |
| maxZoom          | 否    | number   | 1000  | 最大放大百分比                                          |
| minZoom          | 否    | number   | 50    | 最小放大半分比                                          |
| refreshOnResize  | 否    | boolean  | ture  | 窗口尺寸改变后是否调整图片大小                                  |
| zoomOnMouseWheel | 否    | boolean  | true  | 通过鼠标滚轮调整图片缩放                                     |
| beforeload       | 否    | function | noop* | 图片加载前的钩子函数*<br/> () => {}                        |
| loaded           | 否    | function | noop  | 图片成功加载的钩子函数<br/> (image: HTMLImageElement) => {} |
| failed           | 否    | function | noop  | 图片加载失败额钩子函数*<br/> (error: Error) => {}           |

**noop* is...

```javascript
const noop = () => {}
```

#### instance methods

**resetZoom**: 

将放大缩小倍数设置回初始值，也就是 options 中的 zoomValue 值。

example

```javascript
imageViewer.resetZoom()
```

**zoom**

*public  zoom(value:  number  |  string): void  {}*

调用该方法可以对图片进行放大缩小，第一个参数可以是一个keyValue，或者一个介于 minZoom 和 maxZoom 之间值。keyValue 包括如下：

* original：将图片缩放为图片原始大小，但是不能够超出 minZoom ~ maxZoom 范围。

* contain：容器整个包裹图片。

* cover：图片覆盖整个容器。

**zoomIn**

*public  zoomIn()  {}*

放大图片

**zoomOut**

*public  zoomOut()  {}*

缩小图片

**load**

*public  load(imgUrl: string)  {}*

更换预览图片

## Integration

**React**

```javascript
import React from 'react'
import ImgViewer from 'img-viewer'

class ImageViewer extends React.Component {
  componentDidMount() {
    this.loadImage()
  }
  loadImage() {
    const { container } = this
    this.imageViewer = new ImgViewer(container, {
      url: this.props.url,
      zoomValue: 100,
      beforeload() {
        // set loading status
      },
      loaded() {
        // toggle loading
      },
      failed() {
        // set load fail status
      }
    })
  }
  render() {
    return (
      <div
      	ref={ref => {this.container = ref}}
      ></div>
    )
  }
}
```

**Vue**

// 待补充

**Angular**

// 待补充

## License

**MIT**
