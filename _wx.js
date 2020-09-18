


load('./_util.js')
load('./_react.js')

let ui = React({
    constructor(props){
        this.state = {
            id: 123
        }
    },
    onClick_1(){
        print('click this ui')
        this.setState({
            id: 333
        })
    },
    render(){
        return <div  style={{color:'red'}}>
            div
            <button onClick='onClick_1'>
                {this.state.id}
            </button>
        </div>
    }
})

let body = <div id='cmd'>123</div>
let wv = new _webview(body.toXMLString(), ()=>{
    let cmd = document.getElementById('cmd')

    
    let draw = (root) => {
        let {_id, name, value, children, style, event} = root
        let node = document.createElement(name)
        let text = document.createTextNode(value)
        node.appendChild(text)
        
        node.setAttribute('id', _id)
        children.map((child) => {
            let child_node = draw(child)
            node.appendChild(child_node)
        })
        if (style) {
            node.setAttribute('style', style)
        }
        for(let ek in event) {
            node.setAttribute(ek, event[ek])
        }

       // TODO 用for... 会报错     
       
        return node
    }

    _onmessage = (msg) => {
        try {
            let data = draw(msg)
            document.body.appendChild(data)
        }catch(e) {
            cmd.innerHTML =typeof msg.children //e.toString()
        }
    }
})
let data = Render(ui())
wv.postMessage(data)
wv.onmessage = (msg) => {
    let _id = msg[0]
    let evt_name = msg[1]

    //print(_id, evt_name)
    let _node = all_node[_id]
    _node[evt_name]()
}
wv.loop()

