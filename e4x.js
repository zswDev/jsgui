/** 
 * 测试 e4x
*/
const log = (obj) => print(JSON.stringify(obj, null, 4))
const getType = (obj) => Object.prototype.toString.call(obj)
const isType = (obj, type) => getType(obj) === type
const Type = {
    Func: getType(()=>{}),
    Obj: getType({}),
    Arr: getType([])
}


function React(that_object){

    let _that = {}

    if(isType(that_object, Type.Func)) {

        _that.constructor = function(props){
            this.props = props
            this.state = {}
        }
        _that.render = function(){
            return that_object(this.props)
        }
    } else if (isType(that_object, Type.Obj)) {
        _that = that_object
    }

    _that.props = {}
    _that.state = {}

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
    

    return node
}

let _state = React({
    constructor(props) {
        this.props = props // 默认绑定
        this.state = {
            id: 123
        }
    },
    onClick(){
        this.state.id = 321
        //print(JSON.stringify(this))
    },
    render(){
        return (
            <view>
                <div>{this.state.id}</div>
                <div>{this.props}</div>
            </view>
        )
    }
})


let box = React((props) => {
    return (
        <view>
            <div>
                {props}
            </div>  
        </view>
    )
})

// {box(555)}

let Frame = React((props)=>{

    return (
        <view>
            {_state(444)}
            {box()}
        </view>
    )
})

//TODO 要转成 {},[]提高性能


//print(Frame) // 初始化了
//_state._that.onClick()
//print(Frame)


let main= <view></view>
let node=<div>321</div>
main.xx=11
main.xxx = node
let option = <div onClick='123'></div>
option.@onClick = 321;
main.appendChild(node)
main.appendChild(option)
/*
print(option.@onClick)
print('-----')
print(main['xx'].toXMLString())
print('-----')
print(main.xx.toXMLString())
print('-----')
print(main.toXMLString())
print('-----')
print(main.*.toXMLString())
print('-----')
print(main.div[0].toXMLString())
*/

// java -jar -Dfile.encoding=utf-8 rhino-1.7.12.jar -f e4x.js