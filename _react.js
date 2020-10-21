/**
 * 实现 虚拟dom
 * 实现 react props, state 组件
 * 实现 diff算法
 * 实现 组件间通信 或 redux
*/

let _old_toString = Object.prototype.toString
const log = (obj) => print(JSON.stringify(obj, null, 4))
const getType = (obj) => _old_toString.call(obj)
const isType = (obj, type) => getType(obj) === type

Object.prototype.toString = function(){ // 重写对象的 toString 方法
    return JSON.stringify(this, null, 4)
}


const Type = {
    Func: getType(()=>{}),
    Obj: getType({}),
    Arr: getType([])
}

const all_node = {
    '_id': 'object'
}

let node_idx = 0
function React(that_object){

    let _id =  ++node_idx + Date.now()
    let _type = 'user'
    let _that = {
        _id: _id,
        _type: _type
    }

    if(isType(that_object, Type.Func)) {

        _that.constructor = function(props){
            this.props = props
            this.state = {}
        }
        _that.render = function(){
            let _xml = that_object(this.props)
            _xml.@_id = _id;
            _xml.@_type = _type;

            return _xml
        }
    } else if (isType(that_object, Type.Obj)) {
        _that = that_object
        let _render = _that.render
        _that.render = function(){
            let _xml = _render.call(_that)
            _xml.@_id = _id;
            _xml.@_type = _type;

            return _xml
        }
    } else {
        return
    }

    _that.props = {}
    _that.state = {}
    _that.tree = {} // 储存当前树
    _that.setState = function(data) {
        _that.state = data
        let new_data = _that.render()
        let old_tree = _that.tree
        let new_tree = xml_to_map(new_data)
        print(old_tree, new_tree)
    }

    _that.__state = 1 // 生命周期， 
    _that.__init = function(props){
        if (this.__state === 1) {
            this.constructor(props)
            this.__state = 2    
        }
    }

    //TODO xml 要转成 {},[]提高性能
    let node =  (props) =>{
       _that.__init(props)
       return _that.render()
    }
    node._that = _that

    node.toString = () =>{
        _that.__init('')
        return _that.render().toString()
    }
    node.toXMLString = node.toString
    
    all_node[_id] = _that
    return node
}

const xml_to_map = (xml, parent_id, user_id) => {
    let _node = {}

    let name = xml.name().toString() //标签
    let value = xml.text().toString() // 值, 中文会乱码

    let _id = xml.@_id.toString();
    let _type = 'user'

    if (_id) {   // 代表这个节点是用户组件，它的子节点都要关联，直到子节点是用户组件
        user_id = _id
        _node._id = _id
        _node.parent_id = parent_id
        all_node[user_id].tree = _node // 关联自己的树节点
    } else {
        // 比对native 节点只能靠类型判定
        _type = 'native'
        _node.user_id = user_id
    }

    let style = xml.@style;
    style = style.toString() ? JSON.parse(style) : {}

    let style_arr = []
    for(let sk in style) {
        style_arr.push(sk+':'+style[sk])
    }

    _node._type = _type
    _node.event =  null
    _node.style = style_arr.join(';')
    _node.name = name
    _node.value = value
    _node.children =  []
    _node.event = {}
    
    let _ref = {
        onClick: 'onclick' 
    }
    for(let r1 in _ref) {
        let origin_func = xml.attribute(r1).toString()
        if(origin_func){
            let evt_name = _ref[r1]
            let params = [user_id, "'" + origin_func +"'"]
            _node.event[evt_name] = '_evt_cb('+params+')'
        }
    }
    

    // 是否还有子节点
    // elements(), xml节点
    // text(), 值节点
    // comments(), 注释值节点
    let element = xml.elements(); // 是否有子节点
    let elen = element.length() 

    for(let i=0;i<elen; i++) {
        let _child = xml_to_map(element[i], _node._id, user_id)
        _child.idx = i   // 在父对象的坐标
        _node.children.push(_child)
    }

    return _node
}

const diff = (old_tree, new_tree, ret) => {
    // name, value, event, style, child.idx

    ret.idx = old_tree.idx

    if (old_tree.name !== new_tree.name) {  // 直接重新渲染改节点，但他的字节的不变?
        ret.name = new_tree.name // 浏览器收到有名字后，进行重建节点
        ret.value = new_tree.value
        ret.style = new_tree.style
        ret.event = {
            insert: new_tree.event
        }
    } else {

        if (old_tree.value !== new_tree.value) { // 修改值
            ret.value = new_tree.value
        } 
        if (old_tree.style !== new_tree.style) {   // 修改样式
            ret.style = new_tree.style
        }
        
        // 以浏览器事件为不变的前提
        let evts = {
            insert: {}, // 需要新增的绑定
            update: {}, // 更新响应事件的函数
            delete: {}  // 删除绑定的事件 软删除？
        }
        let old_evts = old_tree.event
        let new_evts = new_tree.event
        
        let flag = false
    
        for(let new_ek in new_evts){
            let old_ev = old_evts[new_ek]
            let new_ev = new_evts[new_ek]

            if (old_ev === undefined) { // 在老事件中不存在
                evts.insert[new_ek] = new_ev
                flag = true
            } else if (old_ev && old_ev !== new_ev) { // 事件响应函数变了
                evts.update[new_ek] = new_ev
                flag = true
            }
        }
        for(let old_ek in old_evts) {
            let new_ev = new_evts[old_ek]
            if (new_ev === undefined) { // 旧事件在新事件中不存在
                evts.delete[old_ek] = old_evts[old_ek]
                flag = true
            }
        }
        
        flag && (ret.event = evts)
    }

    // 如果是user组件 则通过 _id 确定是自己
    // 如果是native组件 则通过类型 判断
    
    // TODO 每个children 都有唯一的排序key 用户可以自定义

    // 通过排序了的唯一key 来做子对象的处理。。。
    let new_childs = new_tree.children
    let old_childs = old_tree.children
    let new_len = new_childs.length
    let old_len = old_childs.length

    let max_len = new_len < old_len ? old_len : new_len

    let child = {
        insert: [],
        update: [],
        delete: []
    }
    let flag = false

    // 先不考虑复杂的比对变化, 就是最小替换路径
    // 先不考虑相同的 user组件的 _id对比
    for(let i=0;i<max_len;i++){

        if(i<new_len) {
            let new_c = new_childs[i]

            if (i<old_len) {
                let old_c = old_childs[i]
                
                let node = {}
                diff(old_c, new_c, node)
                if (Object.keys(node).length !== 1) {
                    child.update.push(node)
                    flag = true
                }
            } else {
                child.insert.push(new_c) // 多于旧子树的
                flag = true
            }
        } else {
            let old_c = old_childs[i]
            child.delete.push({  
                name: old_c.name,
                idx: old_c.idx
            })
            flag = true
        }
    }

    flag && (ret.children = child)
    
    return ret
}




function Render(body){
    let data = xml_to_map(body, 0, 0)
    print(data)
    return data
}

let _state = React({
    constructor(props) {
        this.props = props // 默认绑定
        this.state = {
            id: 123
        }
    },
    onClick_1(){
        this.setState({
            id: 333
        })
    },
    render(){
        return (
            <div>
                <div style={{color: 'red'}}>{this.state.id}</div>
                <div onClick='onClick_1'>{this.props}</div>
            </div>
        )
    }
})


let Frame = React((props)=>{
    return (
        <div>
            {_state(123)}
        </div>
    )
})
// print(Frame)

//Render(Frame())

//print(all_node)

//_state._that.onClick_1()
let ret = {}
diff({
    idx: 0,
    name: 'div',
    value: '123',
    style: '123',
    event: {
        onClick: 'on',
        onTouch: 'on'
    },
    children: [
        {   
            idx: 0,
            name: 'div',
            value: '123',
            style: '123',
            event:{},
            children: []
        }
    ]
},{
    idx: 0,
    name: 'div',
    value: '123',
    style: '123',
    event: {
        onClick: 'on1',
        onChange: 'on'
    },
    children: [
        {
            idx: 0,
            name: 'div',
            value: '1234',
            style: '123',
            event:{},
            children: []
        },
        {
            idx: 1,
            name: 'div',
            value: '1234',
            style: '123',
            event:{},
            children: []
        }
    ]
}, ret)

print(ret)