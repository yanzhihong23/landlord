'use strict';

angular.module('landlordApp')
	.directive('publicity', function() {
		return {
			restrict: 'E',
			templateUrl: 'templates/publicity.html'
		}
	})
	.directive('autofocus', function($timeout) {
	  return {
	    restrict: 'A',
	    link : function($scope, $element) {
	      $timeout(function() {
	        $element[0].focus();
	      });
	    }
	  }
	})