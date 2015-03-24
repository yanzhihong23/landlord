'use strict';

angular.module('landlordApp')
	.directive('publicity', function() {
		return {
			restrict: 'E',
			templateUrl: 'templates/publicity.html'
		}
	})
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
        	scope.$digest();
        });

        scope.$watch(attr.ngModel, function(val) {
          var hasValue = val && (val+'').length > 0;
          btn.css('visibility', hasValue ? 'visible' : 'hidden');
        });
      }
    };
  })
	// .directive('autofocus', function($timeout) {
	//   return {
	//     restrict: 'A',
	//     link : function($scope, $element) {
	//       $timeout(function() {
	//         $element[0].focus();
	//       });
	//     }
	//   }
	// })