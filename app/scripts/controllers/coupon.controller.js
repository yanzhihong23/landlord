'use strict';

angular.module('landlordApp')
	.controller('CouponCtrl', function($scope, $stateParams, couponService, utils) {
		var type = $scope.type = $stateParams.type;
		$scope.title = type === 'interest' ? '我的加息券': '我的现金券';

		$scope.coupons = couponService.coupons[type];

		$scope.$watch('coupons', function(val) {

		}, true);

		$scope.select = function(index) {
			if(!$scope.coupons[index].disabled) {
				couponService.selected[type] = index;
				utils.goBack();
			}
		}
	})