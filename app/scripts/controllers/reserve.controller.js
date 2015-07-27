'use strict';

angular.module('landlordApp')
	.controller('ReserveCtrl', function($scope, $state, $timeout, orderService) {
		orderService.order = null;

		$scope.order = {};
		$scope.showCalender = false;
		$scope.$watch('showCalender', function(val) {
			$scope.animated = false;
		});

		$scope.showCalenderFn = function() {
			$scope.showCalender = true;
		};

		$scope.previewMonth = function() {
			console.log('preview month');
		};

		$scope.nextMonth = function() {
			console.log('next month');
		};

		$scope.select = function(index) {
			$scope.showCalender = false;
		};

		$scope.reserve = function() {
			orderService.order = $scope.order;
			$state.go('tabs.reserveConfirm');
		};
	})
	.controller('ReserveConfirmCtrl', function($scope, orderService, accountService, utils) {
		$scope.order = orderService.order;
		$scope.order.balance = accountService.balance.avaiable;

		$scope.showEarnestDesc = function() {
			utils.alert({
				title: '定金说明',
				cssClass: 'popup-large',
				contentUrl: 'templates/earnest.html',
				okType: 'button-balanced'
			});
		};
	})