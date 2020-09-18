
importPackage(javax.swing)
importPackage(java.lang)
importPackage(java.awt)


const X = 1400
const Y = 0
const width = 9*50
const height = 16*50

function UI(title) {
    this.frame = new JFrame(title || '')
    this.frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE)
    
    this.frame.setBounds(X, Y, width, height)
    
    this.contentPane = this.frame.getContentPane()
    
    this.panel = new JPanel()
    this.panel.setBackground(Color.white)

    this.frame.add(this.panel)
    this.frame.setVisible(true)
}
UI.prototype.setLayout = function(layout){
    this.panel.setLayout(layout)
}
UI.prototype.add = function(node, layout){
    let root = {
        node: this.panel,
        push(obj){
            this.node.add(obj)
        }
    }

    node = typeof node === 'xml' ? xml_to_ui(node, root) : map_to_ui(node, root)
    // if (layout) {
    //     this.panel.add(node.node, layout)
    // } else {
    //     this.panel.add(node.node)
    // }   
    // 重绘
    // _ui.panel.validate()
    // _ui.panel.repaint()
    this.panel.revalidate()
}

let _ui = new UI()
_ui.setLayout(new BorderLayout())

const draw = {
    JPanel: {
        constructor(parent, classify, value, layout_str){
            this.node = new classify()
            if (layout_str) {
                let layout_obj = new java.awt[layout_str]
                this.node.setLayout(layout_obj)
            }
            parent.push(this.node)
            
            return this
        },
        push(obj, layout_str) {
            if (layout_str) {
                let layout_obj = this.node.getLayout()
                this.node.add(obj, layout_obj[layout_str])
            } else {
                this.node.add(obj)
            }
        }
    },

    JScrollPane: {
        constructor(parent, classify, value, layout_str){
            this.node = new classify()
            parent.push(this.node, layout_str)
            return this
        },
        push(obj, layout_str) {
            if (layout_str) {
                let layout_obj = this.node.getLayout()
                this.node.add(obj, layout_obj[layout_str])
            } else {
                this.node.add(obj)
            }
            this.node.setViewportView(obj)
        }
    },

    JList: {
        constructor(parent, classify,value,layout_str){
            this.model = new DefaultListModel()
            this.node = new classify(this.model)
           
            parent.push(this.node)
            
            return this
        },

        _idx: 0,
        push(obj, layout_str){
            this.model.add(this._idx, obj.getText())
            ++this._idx
        }
    },

    JLabel: {
        constructor(parent, classify,value,layout_str){
            this.node = new classify(value || '')

            parent.push(this.node, layout_str)

            return this
        },
        push(){}
    },

    JButton: {
        constructor(parent, classify,value, layout_str){
            this.node = new classify(value || '')

            parent.push(this.node, layout_str)
            
            return this
        },
        push(){}
    },

    JTextField: {
        constructor(parent, classify,value,layout_str){
            this.node = new classify(value || '')

            parent.push(this.node, layout_str)
            
            return this
        },
        push(){}
    }
}


let xml_to_ui = (xml, parent) => {
    let name = xml.name().toString() //标签
    let value = xml.text().toString() // 值, 中文会乱码

    let style = xml.@style;
    style = style.toString() ? JSON.parse(style) : {}

    let layout_str = style.layout 
    let classify = javax.swing[name]

    let draw_func = draw[name]
    if (draw_func === undefined) return

   let node = draw_func.constructor(parent, classify, value, layout_str)

    let background = style.background
    if (background) {
        let color = Color[background]
        node.node.setBackground(color)
    }

    let img = xml.@img;
    if(img.toString()){
        let icon = new ImageIcon(img)
        node.node.setIcon(icon)
    }

    let onEvneter = ['JButton', 'JTextField']
    if (onEvneter.includes(name)) {
           
        let _ref = {
           onClick: 'actionPerformed' 
        }
        let _event = {}

        for(let r1 in _ref) {
            let origin_func = xml.attribute(r1).toString()
            if(origin_func){

                let func_str =  '(' + origin_func + ')(e)'
                let handler = new Function('e',func_str)

                let evt_name = _ref[r1]
                 _event[evt_name] = handler
            }
        }

        node.node.addActionListener(_event)
    }


    // 是否还有子节点
    // elements(), xml节点
    // text(), 值节点
    // comments(), 注释值节点
    let element = xml.elements(); // 是否有子节点
    let elen = element.length() 

    for(let i=0;i<elen; i++) {
        xml_to_ui(element[i], node)
    }
    return node
}


const that_subs = {
    'id_evt': 'func'
}
let evt_idx = 0
let node_idx = 0

let xml_to_map = (xml, parent_id) => {
    let name = xml.name().toString() //标签
    let value = xml.text().toString() // 值, 中文会乱码

    let style = xml.@style;
    style = style.toString() ? JSON.parse(style) : {}
    let icon = xml.@icon;

    let draw_func = draw[name]
    if (draw_func === undefined) return

    let _node = {
        _id: ++node_idx + '_' + Date.now(),
        parent_id: parent_id,

        name: name,
        value: value,
        layout_str: style.layout,
        background: style.background,
        icon: icon.toString(),
        children: [],
        event: null
    }
    
    let onEvneter = ['JButton']
    let _ref = {
        onClick: 'actionPerformed' 
    }

    if (onEvneter.includes(name)) {
        _node.event = {}

        for(let r1 in _ref) {
            let origin_func = xml.attribute(r1).toString()
            if(origin_func){

                let func_str =  '(' + origin_func + ')(evt,tree)'
                let handler = new Function('evt','tree',func_str)

                let evt_name = _ref[r1]
                let evt_id = ++evt_idx +'_'+Date.now()

                // 关联线程间事件回调
                that_subs[evt_id] = handler
                _node.event[evt_name] = evt_id
            }
        }
    }

    // 是否还有子节点
    // elements(), xml节点
    // text(), 值节点
    // comments(), 注释值节点
    let element = xml.elements(); // 是否有子节点
    let elen = element.length() 

    for(let i=0;i<elen; i++) {
        let _child = xml_to_map(element[i], _node._id)
        _node.children.push(_child)
    }
    return _node
}


let all_node = {}
let map_to_ui = (map, parent) => {
    let name = map.name
    let value = map.value
    let _id = map._id
   
    let layout_str = map.layout_str
    let background = map.background
    let icon = map.icon
    let event = map.event

    let classify = javax.swing[name]
    let draw_func = draw[name]
    let node = draw_func.constructor(parent, classify, value, layout_str)

    if (background) {
        let color = Color[background]
        node.node.setBackground(color)
    } 
    if(icon){
        let img = new ImageIcon(icon)
        node.node.setIcon(img)
    }

    if (event) {
        for(let evt_name in event) {
            let evt_id = event[evt_name]

            event[evt_name] = (evt) => { // 注意事件对象传递的问题
                task.add(evt_id)
            }
        }
        node.node.addActionListener(event)
    }
    
    let children = map.children
    let clen = children.length
    for(let i=0;i<clen; i++) {
        map_to_ui(children[i], node)
    }

    // 保存node
    map.node = node
    all_node[_id] = map.name

    return node
}

// 按照react diff的原理
// 1、同一个对象由key区分
// 2、不处理跨层级操作，尝试只做简单的 树节点删除和创建，不做移动，
// 3、层级比对 两棵树，如果该层某节点 在新树中不存在，则删除老树中它的全部子节点

// 1、 组件c 不在当层(a,b)中，则插入
// 2、 组件d 在当层(a,b,c)中，但d的节点已改变，不可复用，则删除旧d，再建新的
//     组件d 之前在(a,b,c,d)中，但集合变成新的(a,b,c)了，则删除d 
// 3、 组件d 在当层(a,b,c,d)中，且集合更新，d的节点未更新，只是位置编号，则用唯一的key区分，并移动位置，参考react 的list 的 key

let _diff =(old_map, new_map)=>{
    let old_value = old_map.value
    let new_value = new_map.value

    if (old_value !== new_value){
        old_map.node.node.setText(new_value)   
    }
    
    let old_children = old_map.children
    let new_children = new_map.children

    let nlen = new_children.length
    for(let i=0;i<nlen;i++){  // 先不考虑，增减
        _diff(old_children[i], new_children[i])
    }
    return 
}



Object.prototype.toString = function(){ // 重写对象的 toString 方法
    return JSON.stringify(this, null, 4)
}

let _arr = (type, size) => java.lang.reflect.Array.newInstance(type, size);

//_ui.add(panel)

const ConcurrentLinkedQueue = java.util.concurrent.ConcurrentLinkedQueue

const queue = new ConcurrentLinkedQueue()
const task = new ConcurrentLinkedQueue()
const loop = (next) => {
    while(true) {
        Thread.sleep(1)
        next && next()
    } 
}
const Th = (func) => new Thread(func).start()
 

Th(function(){
    let arrs1 = <JList onClick={()=>{print(123)}}></JList>
    for(let i=0;i<1024;i++){    
        arrs1.appendChild(<JLabel>{i+''}</JLabel>)
    }
    
    let onClick = (evt, tree) => {
        tree.children[0].value= "33333"
        let t = JSON.stringify(tree)
        queue.add(t)
        print(Thread.currentThread().getName(),1111)
    }
    
    let panel = <JPanel style={{background: 'blue', layout: 'BorderLayout'}}>
                    <JButton icon="./defaultHead.png" style={{background: 'red',layout: 'NORTH'}} onClick={onClick}>123</JButton>
                        <JLabel style={{background: 'yellow', layout: 'CENTER'}} icon="./defaultHead.png">图片</JLabel>
                        <JTextField style={{layout: 'SOUTH'}}>请输入</JTextField>
                            
                    <!--<JScrollPane style={{background: 'red'}}>
                        {arrs1}
                    </JScrollPane>-->
                </JPanel>
   // print(panel)
    let tree = xml_to_map(panel, node_idx + '_' + Date.now())

    //print(tree)
    //print(that_subs)

    //queue.add(panel)
    let t = JSON.stringify(tree)
    queue.add(t)

    loop(() => {
        if(!task.isEmpty()) {
            let evt_id = task.poll()
            //print(evt_id)
            let _hander = that_subs[evt_id]
            _hander && _hander(null, tree)
        }
    })
})

let next_html = null
loop(() => {
    if(!queue.isEmpty()){
        let that_html = queue.poll()
        that_html = JSON.parse(that_html)

        print('-------------')
        print(that_html)
        print(all_node)
        //print(map)
        //let t1 = Date.now()
        if (next_html === null) { 
            _ui.add(that_html)
            next_html = that_html
        } else {
            _diff(next_html, that_html)
        }
       // print(Date.now() - t1)
      //  _ui.add(xml)
    }
})



// java -jar -Dfile.encoding=utf-8 rhino-1.7.12.jar -f index.js