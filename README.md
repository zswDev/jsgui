总概念，
逻辑线程，渲染线程

通过虚拟dom 和 浏览器层交互

逻辑层位于 java层：
    可以调用很多 native能力
    可以大量运算不会阻塞 主界面

diff位于 逻辑层：
    diff 计算后 将最少修改量 交给webview渲染
    防止阻塞webview

webview层：
    提供渲染能力
    提供事件处理和通知到 java层
    执行简单的js

是否重构webview通信模式？，还是直接调用webview的绘制方法。