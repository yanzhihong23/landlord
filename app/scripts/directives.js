'use strict';

angular.module('landlordApp')
	.directive('clearInput', function($parse) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attr) {
        var htmlMarkup = attr.clearBtnMarkup ? attr.clearBtnMarkup : '<i class="ion-ios-close-empty"></i>';
        var btn = angular.element(htmlMarkup);
        element.after(btn);

        btn.on('click', function(event) {
        	var arr = attr.ngModel.split('.');

        	if(arr.length === 1) {
        		scope[arr[0]] = null;
        	} else if(arr.length === 2) {
        		scope[arr[0]][arr[1]] = null;
        	}
          scope.$apply();
        });

        scope.$watch(attr.ngModel, function(val) {
          var hasValue = val && (val+'').length > 0;
          btn.css('visibility', hasValue ? 'visible' : 'hidden');
        });
      }
    };
  })
  .directive('bankRec', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'templates/bank-recommend.html'
    }
  })
	.directive('focusMe', function($timeout) {
	  return {
	    restrict: 'A',
	    link : function(scope, element) {
	      $timeout(function() {
	        element[0].focus();
	      }, 150);
	    }
	  }
	})
  .directive('guesturePwd', function() {
    return {
      restrict: 'E',
      replace: true,
      template: '<canvas id="myCanvas"></canvas>',
      link: function(scope, element) {
        element = element[0];
        var R, CW, CH, cxt, OffsetX = 30, OffsetY = 30;
        var PointLocationArr = [];
        var COLOR = {
          BORDER: '#f1a31a',
          BORDER_SELECTED: '#f1a31a',
          BG: '#fff',
          BG_SELECTED: '#f1a31a',
          LINE: '#f1a31a',
          HOUSE: '#fff'
        };

        var getOffsetTop = function(tmp) {
          var offsetTop = tmp.offsetTop;
          while(tmp.parentNode) {
            offsetTop += ~~tmp.parentNode.offsetTop;
            tmp = tmp.parentNode;
          }
          return offsetTop;
        }

        var init = function() {
          CW = CH = document.body.offsetWidth;
          element.width = CW;
          element.height = CH;
          R = Math.floor(CW/11);
          cxt = element.getContext('2d');
          var X = (CW - 2 * OffsetX - R * 2 * 3) / 2;
          var Y = (CH - 2 * OffsetY - R * 2 * 3) / 2;
          PointLocationArr = caculateNinePointLotion(X, Y);
          initEvent(element);
          draw(PointLocationArr, [], null);
        }

        var caculateNinePointLotion = function(diffX, diffY) {
          var Re = [];
          for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 3; col++) {
              var Point = {
                X: (OffsetX + col * diffX + (col * 2 + 1) * R),
                Y: (OffsetY + row * diffY + (row * 2 + 1) * R)
              };
              Re.push(Point);
            }
          }
          return Re;
        };

        var draw = function(_PointLocationArr, _LinePointArr, touchPoint) {
          if (_LinePointArr && _LinePointArr.length) {
            cxt.beginPath();
            for (var i = 0; i < _LinePointArr.length; i++) {
              var pointIndex = _LinePointArr[i];
              cxt.lineTo(_PointLocationArr[pointIndex].X, _PointLocationArr[pointIndex].Y);
            }
            cxt.lineWidth = 2;
            cxt.strokeStyle = COLOR.LINE;
            cxt.stroke();
            cxt.closePath();
            if(touchPoint) {
              var lastPointIndex=_LinePointArr[_LinePointArr.length-1];
              var lastPoint=_PointLocationArr[lastPointIndex];
              cxt.beginPath();
              cxt.moveTo(lastPoint.X,lastPoint.Y);
              cxt.lineTo(touchPoint.X,touchPoint.Y - getOffsetTop(element));
              cxt.stroke();
              cxt.closePath();
            }
          }
          for (var i = 0; i < _PointLocationArr.length; i++) {
            var Point = _PointLocationArr[i];
            drawCircle(Point, COLOR.BORDER, COLOR.BG);
            if(_LinePointArr.indexOf(i)>=0) {
              drawCircle(Point, COLOR.BORDER_SELECTED, COLOR.BG_SELECTED);
              drawHouse(Point, COLOR.HOUSE);
            }
          }
        };

        var drawCircle = function(point, border, bg) {
          cxt.fillStyle = border;
          cxt.beginPath();
          cxt.arc(point.X, point.Y, R, 0, Math.PI * 2, true);
          cxt.closePath();
          cxt.fill();
          cxt.fillStyle = bg;
          cxt.beginPath();
          cxt.arc(point.X, point.Y, R - 3, 0, Math.PI * 2, true);
          cxt.closePath();
          cxt.fill();
        }

        var drawHouse = function(point, color) {
          var x = point.X, y = point.Y, l = Math.ceil(R/10);
          cxt.strokeStyle = color;
          cxt.beginPath();
          cxt.moveTo(x, y - 5*l);
          cxt.lineTo(x + 5*l, y - l);
          cxt.lineTo(x + 3*l, y - l);
          cxt.lineTo(x + 3*l, y + 3*l+2);
          cxt.lineTo(x + l, y + 3*l+2);
          cxt.lineTo(x + l, y + l);
          cxt.lineTo(x - l, y + l);
          cxt.lineTo(x - l, y + 3*l+2);
          cxt.lineTo(x - 3*l, y + 3*l+2);
          cxt.lineTo(x - 3*l, y - l);
          cxt.lineTo(x - 5*l, y - l);
          cxt.lineTo(x, y - 5*l);
          cxt.stroke();
          cxt.closePath();
        };

        var isPointSelect = function(touches, LinePoint) {
          for (var i = 0; i < PointLocationArr.length; i++) {
            var currentPoint = PointLocationArr[i];
            var xdiff = Math.abs(currentPoint.X - touches.pageX);
            var ydiff = Math.abs(currentPoint.Y - touches.pageY + getOffsetTop(element));
            var dir = Math.pow((xdiff * xdiff + ydiff * ydiff), 0.5);
            if (dir < R ) {
              if(LinePoint.indexOf(i) < 0){ LinePoint.push(i);}
              break;
            }
          }
        };

        var initEvent = function(canvasContainer) {
          var LinePoint = [];
          canvasContainer.addEventListener("touchstart", function(e) {
            isPointSelect(e.touches[0],LinePoint);
          }, false);
          canvasContainer.addEventListener("touchmove", function(e) {
            e.preventDefault();
            var touches = e.touches[0];
            isPointSelect(touches,LinePoint);
            cxt.clearRect(0,0,CW,CH);
            draw(PointLocationArr, LinePoint, {X:touches.pageX,Y:touches.pageY});
          }, false);
          canvasContainer.addEventListener("touchend", function(e) {
            cxt.clearRect(0,0,CW,CH);
            draw(PointLocationArr,LinePoint,null);
            if(LinePoint.length >= 4) {
              scope.$emit('gesture', LinePoint);
              console.log(LinePoint.join('->'));
            } else {
              scope.$emit('invalid');
            }
            
            LinePoint=[];
          }, false);
        };

        scope.$on('reset', function() {
          cxt.clearRect(0,0,CW,CH);
          draw(PointLocationArr, [], null);
        });

        init();
      }
    }
  })