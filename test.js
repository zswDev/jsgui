

importPackage(java.io)
importPackage(java.net)
importPackage(java.lang)

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
let _loadJar = (path) => {
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
//importClass(Packages.ca.weblite.webview.WebView) // ?? 第三方ca
importPackage(Packages.ca.weblite.webview)
//print(ca.weblite.webview.WebView)
const toHTML = (body, script) =>{
    body = '<body>'+body+'</body>'
    script = '<script type="application/javascript">'+script+'</script>'
    let html = '<html>'+body + script+'</html>'
    let data = 'data:text/html,'+ html
    print(data)
    return data
}

let data = toHTML('123123', 'msg_cb(123)')



let wv = new WebView()
wv.url(data)


const ConcurrentLinkedQueue = java.util.concurrent.ConcurrentLinkedQueue

const queue = new ConcurrentLinkedQueue()

// wv.addJavascriptCallback("native_cb",(msg)=>{
//     Thread.sleep(1)
//     //print(msg)
//     // msg = JSON.parse(msg)
//     //print(Date.now()-msg[0])
//     // TODO wv加载完后才可以执行 函数
//     if(!queue.isEmpty()){
//         let v = queue.poll()
//         msg !==print(msg)
//         print(Thread.currentThread().getName(), v)
//         wv.eval(v)
//     }
//     wv.eval("native_cb()")
// })
wv.addJavascriptCallback("msg_cb",function(msg){
    //print('msg', msg)
})
new Thread(function(){
    Thread.sleep(1000*3)
    while(true){
        Thread.sleep(100)
        wv.dispatch({
            run: () => {
                wv.eval("msg_cb()")
            }
        })
    }
}).start()
wv.show()


    


