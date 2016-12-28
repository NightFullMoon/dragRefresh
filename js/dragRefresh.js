function DragRefresh(options){

  var temp={
    _startDragY:0,
    _isDragging:false,
    _lastPostion:0,
    _currentState:undefined
  }

  this.data =$.extend({},
    this.defaultOption,
    options,
    temp);

  this._init();
}

DragRefresh.prototype.defaultOption={
  $this:$(),
  top:-100,
  bottom:300,
  loopFPS:24,
}

DragRefresh.prototype.state=function(newState){
  var THIS =this;
  if(undefined === newState){return THIS.data.states[THIS.data._currentState]}

  if(undefined === THIS.data.states[newState]){return THIS.data.states[THIS.data._currentState]}

  if(THIS.data.states[newState].change){
    THIS.data.states[newState].change(THIS.data.states[newState],
      function(){
        $(document).trigger($.Event(newState));
    },THIS.data.states[newState]);
  }else{
    $(document).trigger($.Event(newState));
  }

THIS.data._currentState = newState;
}

DragRefresh.prototype.addState=function(name,newState){}

DragRefresh.prototype.progress=function(){
    // fixme:这个可能造成进度不是【0-100】的情况
    return parseInt($refresh.position().top/(MAX-MIN)*100);
}

// DragRefresh.prototype._position=function(){}

DragRefresh.prototype._top=function(){
  return this.data.$this.position().top;
};

DragRefresh.prototype._isTop=function(){return 0===$(document).scrollTop();}

DragRefresh.prototype._init=function(){
  var THIS =this;
  var $this =THIS.data.$this;

  var states={
    ready:{},
    dragging:{},
    loop:{
      // update:function(){},
  change:function(state,callback){
    // console.log("loop");
  if(THIS.state()!==state){
    // console.log(getState()+"不再loop");
    return;
  }
    callback && callback();

    setTimeout(function(){state.change(state,callback);},1000/24);

  }
    },retreating:{

    },reset:{
      change:function(){
        console.log("reset");
      }
    },
      // 注：release不一定触发loop，如果它高度不足的话，就会直接进入reset
    release:{
      position:200,
      // callback是在内置行为执行完之后立即调用的
      change:function(state,callback,from){



        callback && callback();

        var newTop = 0;
        var newState ="";

        if(state.position<THIS._top()){
          newTop = state.position;
          newState = "loop";
          // 过了这个点，执行loop
      }else{
        //没过，执行reset
        newTop = THIS.data.top;
        newState = "reset";
      }

      $this.animate({top:newTop},{
        progress:function(){
          // todo:调用回调函数
          // update( progress());
        },
        done:function(){
          THIS.state(newState);
        }
      });
      }
    }
  };

  THIS.data.states = states;

  document.addEventListener("touchstart",function(event){
    if(!THIS._isTop()){
      THIS.data._isDragging =false;
      return;
    }
    THIS.data._isDragging =true;
    THIS.data._startDragY = event.targetTouches[0].clientY;
    // console.log(event);
    // console.log(pageX);
  });

  document.addEventListener("touchend",function(event){
    THIS.data._isDragging =false;
    THIS.data._startDragY=0;
    // $(document).trigger(_events["release"]);
    THIS.state("release");
  });

  document.addEventListener("touchmove",function(event){
    // console.log("开始滑动");
    // console.log(event.detail);
  if(!THIS.data._isDragging){
    return;
  }

    var newPosition =  event.targetTouches[0].clientY;
    // console.log(newPosition-position);

    if(newPosition< THIS.data._startDragY){
      return;
    }

    var change =0;
    if(THIS.data.lastPostion<newPosition){
      // 依然往下
      // lastPostion=newPosition;
        console.log("往下拖");
        change=4;
    }else{
      // 往回拖
          console.log("往回拖");
          change =-4;
          event.preventDefault();
    }

    THIS.data.lastPostion=newPosition;
      // console.log("依然往下");

      if(THIS._top()<THIS.data.bottom){
        $this.css({top:THIS._top()+change});
        // update(THIS.progress());
      }
  });
}

$.fn.dragRefresh=function(options){
  options = options || {};
  options.$this =$(this);
  return new DragRefresh(options);
}

// todo:触发事件
// todo:开启和结束loop的函数
// todo：完成2个自带的效果
