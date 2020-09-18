
## 逻辑线程，渲染线程
### 通过virtual dom 和 webview交互
### 逻辑层位于 java层：
    可以调用很多 native能力
    可以大量运算不会阻塞 渲染线程
### diff算法  or virtual dom位于 逻辑层：
    逻辑层生成和操作 virtual dom
    diff 计算后 将最少修改量 交给webview渲染
    防止阻塞webview
### webview层：
    提供渲染能力
    提供事件处理和通知到 java层
    执行简单的js
## TODO
     是否重构webview通信模式？，还是直接调用webview的绘制方法。


## [rhino.jar](https://github.com/mozilla/rhino)
     java开发的js引擎， 可调用java能力 和 .class, .jar包

## [WebView.jar](https://github.com/shannah/webviewjar)
    跨平台webview