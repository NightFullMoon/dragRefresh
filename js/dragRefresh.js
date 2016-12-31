/*
事件：
ready：插件初始化完毕之后触发
release:手指释放时触发 参数为一共拖动的距离
reset:回到起始位置时触发


dragging: 拖拽过程中的事件，参数为所占的百分比[0-100] 只有当页面在最顶部的时候才会触发
loop：循环事件、以参数loopFPS的频率调用
retreating:(暂时不触发这个事件)

// 接口
startLoop
stopLoop

// 参数：
top:起始位置 int -100
bottom：结束位置 int 300
loop : 大于这个位置就进入loop状态 int 200
loopFPS: int

*/

function DragRefresh($element, option) {
    var DEFAULTS = {
        top: -100,
        loopY: 200,
        bottom: 300,
        loopFPS: 24,
    }

    var OPTIONS = $.extend({}, DEFAULTS, option);

    // 当前是否在拖拽中
    var _isDragging = false;
    // 开始触摸的y值坐标
    var _startDragY = -1;
    // 手指在屏幕上最后的Y坐标
    var _lastY = -1;
    // 当前状态的名字
    var _currentState = "";

    var _states = {};
    $.each("ready release reset dragging loop".split(" "),
        function(i, e) {
            _states[e] = function(data) {}
        });
    _states["dragging"] = function(data) {
        // console.log(data);
        // console.log(this);
    };
    _states["release"] = function(data) {
        // console.log(data);
        // console.log(OPTIONS.loopY<_elementY()&& 0<data);
        var newY = OPTIONS.top;
        var newState = "";
        if (OPTIONS.loopY < _elementY() && 0 < data) {
            newY = OPTIONS.loopY;
            newState = "loop";
        } else {
            newY = OPTIONS.top;
            newState = "reset";
        }
        $element.animate({
            top: newY
        }, {
            progress: function() {
                // 如果需要，可以在这里调用回退的动画函数
            },
            done: function() {
                _state(newState);
            }
        });

    };

    _states["loop"] = function(data) {
        // console.log(_currentState + "是否loop？");
        _looping();
    };
    // 返回当前文档是否在最顶部
    // true或者false
    function _isTop() {
        return 0 === $(document).scrollTop();
    }

    function _elementY() {
        return $element.position().top;
    }

    // 返回当前位置所占的百分比 int
    function _progress() {
        return parseInt(((OPTIONS.top + _elementY()) / OPTIONS.bottom) * 100);
    }

    // 当处于loop状态时，以每秒loopFPS的频率调用自己
    function _looping(data) {
      if ("loop" === _currentState) {
          setTimeout(function(){
            _looping();
          },1000/OPTIONS.loopFPS);
          $element.trigger($.Event("loop"),data);
      }
    }

    //如果传入参数，并且该状态名存在，就切换状态并且触发事件，如果不存在就不改变并返回当前的事件名称
    function _state(newState, data) {

        // console.log(data);

        if (_states[newState]) {
            // console.log("改变状态：" + newState + "状态参数：");
            // 先改变状态属性，等内置的部分处理完成之后，在触发事件;
            _currentState = newState;
            _states[newState].call($element, data)
            $element.trigger($.Event(newState), data);
        }

        return _currentState;
        // retturn
    }

    document.addEventListener("touchstart", function(event) {
        if (!_isTop() || ("ready"!== _state() && "reset"!==_state())) {
            _isDragging = false;
            return;
        }
        _isDragging = true;
        _lastY = _startDragY = event.targetTouches[0].clientY;

        _state("dragging", _progress());
    });

    document.addEventListener("touchend", function(event) {
      if(!_isDragging){return;}

        var distance = _lastY - _startDragY;
        _isDragging = false;
        _startDragY = -1;
        _lastY = -1;
        // $(document).trigger(_events["release"]);

        // console.log(_lastY+"xxxxxxxxxxx"+_startDragY);
        _state("release", distance);
    });

    // 监听文档的拖拽事件
    document.addEventListener("touchmove", function(event) {
        // console.log("开始滑动");
        // console.log(event.detail);
        if (!_isDragging) {
            return;
        }

        // 现在触摸的位置
        var newPosition = event.targetTouches[0].clientY;
        _lastY = newPosition;
        // 往上滑动，不做处理
        if (newPosition < _startDragY) {
            return;
        }
        event.preventDefault();
        var distance = newPosition - _startDragY;

        // THIS.data._lastPostion = newPosition;
        // console.log(THIS.data._lastPostion);
        // console.log(distance);
        // 还没到最底部就更新你位置并且触发事件
        // debugger
        if (_elementY() < OPTIONS.bottom) {
            $element.css({
                top: distance
            });
            // update(THIS.progress());
            // todo:这个是不是要改为设置成dragging的状态？
            // THIS.data.$this.trigger("dragging", THIS.progress());
            _state("dragging", _progress());
        }
    });

    var component = {
        startLoop: function() {
            return component;
        },
        stopLoop: function() {
            return component;
        }
    };
    _state("ready");
    return component;
}



$.fn.dragRefresh = function(options) {
    return new DragRefresh($(this), options);
}

// call跟apply有什么区别？
