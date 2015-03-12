'use strict';

angular.module('landlordApp')
	.directive('publicity', function() {
		return {
			restrict: 'E',
			templateUrl: 'templates/publicity.html'
		}
	})