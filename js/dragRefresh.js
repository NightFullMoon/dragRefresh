/*
事件：
ready：插件初始化完毕之后触发
release:手指释放时触发 参数为一共拖动的距离
reset:回到起始位置时触发
loop:进入looping前的状态

dragging: 拖拽过程中的事件，参数为所占的百分比[0-100] 只有当页面在最顶部的时候才会触发
looping：循环事件、以参数loopFPS的频率调用
retreating:从释放到loop或者从loop到reset过程中调用的函数

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
        top: 0,
        loopY: 200,
        bottom: 300,
        loopFPS: 24,
        // 定义了添加到$element上的css类名
        stateCss: function(state) {
            if (state) {
                return "state-" + state;
            } else {
                return "";
            }
        },
        // 这里面的this也是指向$element本身
        //初始化完成时调用的函数，仅调用一次
        onReady: function() {},
        // 定义了滑动距离与移动距离的函数
        // 参数为目前为止移动了多长的px
        // 返回元素应该移动的距离
        move:function(distance){return distance;}
    }

    var OPTIONS = $.extend({}, DEFAULTS, option);

    if (OPTIONS.bottom < OPTIONS.loopY) {
        OPTIONS.loopY = OPTIONS.bottom;
    }

    // 当前是否在拖拽中
    var _isDragging = false;
    // 开始触摸的y值坐标
    var _startDragY = -1;
    // 手指在屏幕上最后的Y坐标
    var _lastY = -1;
    // 当前状态的名字
    var _currentState = "";

    var _states = {};
    $.each("ready release reset dragging loop retreating looping".split(" "),
        function(i, e) {
            _states[e] = function(data) {}
        });
    _states["dragging"] = function(data) {
        // console.log(data);
        // console.log(this);
    };

    _states["ready"] = function(data) {
        $element.css("top", OPTIONS.top);
    };

    _states["reset"] = function(data) {
        $element.css("top", OPTIONS.top);
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

        _state("retreating", {
            target: newY,
            callback: function() {
                _state(newState);
            }
        })
    };

    _states["retreating"] = function(data) {
        var target = data.target || OPTIONS.top;

        $element.animate({
            top: target
        }, {
            progress: function() {
                // 如果需要，可以在这里调用回退的动画函数
                // console.log("retreating");
                $element.trigger($.Event("retreating"), _progress());
            },
            done: function() {
                // _state(newState);
                $.isFunction(data.callback) && data.callback();
            }
        });
    };

    _states["loop"] = function(data) {
        // console.log(_currentState + "是否loop？");
        $element.css("top", OPTIONS.loopY);
        // _looping();
        _state("looping");
          // _looping();
    };

    _states["looping"] = function(data) {
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
        // console.log(OPTIONS.top + _elementY());
        return parseInt(((_elementY() - OPTIONS.top) / (OPTIONS.bottom - OPTIONS.top)) * 100);
    }

    // 当处于loop状态时，以每秒loopFPS的频率调用自己
    function _looping(data) {
        if ("looping" === _currentState) {
            setTimeout(function() {
                _looping();
            }, 1000 / OPTIONS.loopFPS);
            $element.trigger($.Event("looping"), data);
        }
    }

    //如果传入参数，并且该状态名存在，就切换状态并且触发事件，如果不存在就不改变并返回当前的事件名称
    function _state(newState, data) {

        // console.log(data);

        if (_states[newState]) {
            // console.log("改变状态：" + newState + "状态参数：");
            // 先改变状态属性，等内置的部分处理完成之后，在触发事件;
            $element.removeClass(OPTIONS.stateCss(_currentState));
            _currentState = newState;
            $element.addClass(OPTIONS.stateCss(newState));
            _states[newState].call($element, data)
            $element.trigger($.Event(newState), data);
        }

        return _currentState;
        // retturn
    }

    document.addEventListener("touchstart", function(event) {
        if (!_isTop() || ("ready" !== _state() && "reset" !== _state())) {
            _isDragging = false;
            return;
        }
        _isDragging = true;
        _lastY = _startDragY = event.targetTouches[0].clientY;

        _state("dragging", _progress());
    });

    document.addEventListener("touchend", function(event) {
        if (!_isDragging) {
            return;
        }

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
        // 新的位置没超过最底部就更新位置并且触发事件

        var newY = OPTIONS.top + OPTIONS.move(distance);
        // debugger
        if (newY < OPTIONS.bottom) {
            $element.css({
                top: newY
            });
            _state("dragging", _progress());
        }
    });

    var component = {
        startLoop: function() {
            _state("loop");
            return component;
        },
        stopLoop: function() {
            // _state("reset");
            _state("retreating", {
                target: OPTIONS.top,
                callback: function() {
                    _state("reset");
                }
            })
            return component;
        },
        on: function(arg1, arg2, arg3, arg4) {
            $element.on(arg1, arg2, arg3, arg4);
            return component;
        }
    };
    OPTIONS.onReady.call($element);
    _state("ready");
    return component;
}

$.fn.dragRefresh = function(options) {
    return new DragRefresh($(this), options);
}

$.fn.dragRefresh.material = function(options) {
    // console.log("hhhhh ");
}

$.extend(true,{
    DragRefresh: {
        material: function(options) {
          var $button = $('<div class="refresh-wrap js_refresh"><img src="../image/icon_refresh.png" alt="refresh" class="refresh-icon" /></div>');
          $("body").append($button);

var drag =          $button.dragRefresh({
              top: -150,
              loopY: 150,
              stateCss: function(state) {
                  // console.log(this);
                  return "material-" + state;
              },
              onReady: function() {
                  // console.log("I am ready!");
              }
          }).on("looping", function() {
              // console.log("loop----");
              var $icon = $(this).find(".refresh-icon");
              var str = $icon.attr("style") || "";
              var oldDeg = str.match(/transform:\srotateZ\((.*)?deg\)/) || [];
              // console.log(oldDeg);
              if (2 === oldDeg.length) {
                  oldDeg = oldDeg[1];
              } else {
                  oldDeg = 0;
              }

              newDeg = (parseInt(oldDeg) + 20) % 360;
              $icon.css({
                  transform: "rotateZ(" + (newDeg) + "deg)",
                  opacity:1
              });
          });

          // 也可以在初始化完成之后扩展
          $button.on("dragging retreating", function(event, progress) {
              // console.log("dragging事件"+progress);
              var $icon = $(this).find(".refresh-icon");
              // console.log(this);
              $icon.css({
                  transform: "rotateZ(" + (progress / 2) * 3.6 + "deg)",
                  opacity: progress / 100
              });
          });

          return drag;
        }
    }
});

$.extend(true,{
  DragRefresh:{
    text:function(){}
  }
});
