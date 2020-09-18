
importPackage(java.io)
importPackage(java.net)
importPackage(java.lang)
importPackage(java.util.concurrent)

Object.prototype.toString = function(){ // 重写对象的 toString 方法
    return JSON.stringify(this, null, 4)
}

const _jarr = (args) => {
    let type = args[0].getClass()
    let len = args.length
    let arr = new java.lang.reflect.Array.newInstance(type, len)
    for(let i=0;i<len;i++){
        arr[i] = args[i]
    }
    return arr
}

// 获取系统jar加载器
const _loadJar = (path) => {
    let fn = new File(path)

    if (!fn.exists()) {
        throw new Error("file not found")
    }
    let urlcls = fn.toURI().toURL()
    let _arr = _jarr([urlcls])
    let loadcls = new URLClassLoader(_arr)

    let sysloadcls = ClassLoader.getSystemClassLoader()  // 系统的类加载器
    let method = loadcls.getClass().getDeclaredMethod("addURL", urlcls.getClass())
    if(!method.isAccessible()){
        method.setAccessible(true)
    }
    print(urlcls)
    
    method.invoke(sysloadcls, urlcls) // 动态加载jar
}

_loadJar('./WebView.jar')
importPackage(Packages.ca.weblite.webview)

function _webview(data, script){
    this.msg_queue = new ConcurrentLinkedQueue()
    this.logic_queue = new ConcurrentLinkedQueue();

    this.wv = new WebView()
    data = this._toHTML(data, script)
    this.wv.url(data)

    this._main_loop() // 启动主消息队列


    new Thread({ // 这是浏览器线程
        run: ()=>{  
            print('webview start')
            this.wv.show()
        }
    }).start()
}

_webview.prototype.browser_lib = function(script){
    let _main_loop = '_main_loop();'
    let _onmessage = 'var _onmessage=(data)=>{};';
    let _postMessage = 'var _postMessage=(data)=>{_msg_cb(data)};'
   
    script = '(' + script +')();'
    script = _main_loop + _onmessage + _postMessage + script;
   
    return script
}

_webview.prototype._toHTML = function (body, script) {
    body = '<body>'+body+'</body>'

    script = this.browser_lib(script)
    script = '<script type="application/javascript">'+script+'</script>'

    let html = '<html>'+body + script+'</html>'
    let data = 'data:text/html,'+ html
    print(data)
    return data
}

_webview.prototype._main_loop = function(){ // 主消息轮询
    this.wv.addJavascriptCallback('_msg_cb', msg => {
        if (msg !== '[]') { // 处理消息回调
            this.logic_queue.add(msg) // 不做序列化处理
        } 
    })
    this.wv.addJavascriptCallback('_evt_cb', evt => {
        if(evt !== '[]') {
            // evt = JSON.parse(evt)
            // let _id = evt[0]
            // let evt_name = evt[1]
            
            this.logic_queue.add(evt)
        }
    })


    this.wv.addJavascriptCallback('_main_loop',(msg)=>{ // TODO wv加载完后才可以执行 函数

        new Thread({
            run: ()=> {
                while(true) {
                    while(!this.msg_queue.isEmpty()){ // 给浏览器发消息
                        let msg = this.msg_queue.poll()
                        let func_str = '_onmessage('+msg+')'
                        print(func_str)

                        // TODO 注意主进程退出，这里会报错
                        this.wv.dispatch({
                            run: () => {
                                this.wv.eval(func_str)
                            }
                        })

                    }
            
                    Thread.sleep(1)
                }
            }
        }).start()
    })
}

_webview.prototype.postMessage = function(data) {
    let params = [data]
    this.msg_queue.add(params)
}

let i = 1
_webview.prototype.onmessage = function(data) {

     //this.logic_queue.add(data)
    print(Thread.currentThread().getName(), 'onmessage:', Date.now() - data)

    if (i < 5) {
        ++i
        this.postMessage(Date.now())
    }
}
_webview.prototype.loop = function(){
    while(true){
        while(!this.logic_queue.isEmpty()){
            let data = this.logic_queue.poll()
            data = JSON.parse(data)
            this.onmessage(data)
        }
        Thread.sleep(100)
    }
}
// TODO 注意 html 元素的内容
// TODO 注意 document.write会清除全部元素，包括系统方法!!
// TODO 注意第一次通信会很慢, 因为要加载页面

// let body = <div id="a1">123</div>
// let wv = new _webview(body.toXMLString(),()=>{
//     let cmd = document.getElementById('a1')

//     _onmessage = (msg) => {
//         cmd.innerHTML = msg.name
//        let btn = document.createElement(msg.name)
//        let text = document.createTextNode(msg.value)
//        btn.appendChild(text)
//        document.body.appendChild(btn)
//     }
// })

// wv.postMessage({name: 'div', value: '333'})
// wv.loop()
