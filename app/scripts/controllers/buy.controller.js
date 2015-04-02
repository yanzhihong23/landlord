'use strict';

angular.module('landlordApp')
	.controller('BuyCtrl', function($scope, userConfig, $state, $rootScope, UserApi, utils, $timeout, LandlordApi, $window, toaster) {
		var init = function() {
			console.log('----------- init BuyCtrl -----------');
	  	var accountInfo = userConfig.getAccountInfo();
	  	if(accountInfo) {
	  		$scope.balance = ~~accountInfo.balanceUsable/10000;
	  	}

	  	var annual = $scope.house.annualYield*$scope.house.minPrice*100;
			$scope.item = {
				mIncome: (annual/12).toFixed(2) || 0,
				total: (annual/12*$scope.house.duration).toFixed(2) || 0,
				limit: Math.min($scope.house.maxPrice, $scope.house.remain) || 1
			};

			$scope.buy = angular.copy($scope.item);
			$scope.buy.volume = 1;

			$scope.validInterests = [];
			$scope.validCoupons = [];

			LandlordApi.getCouponList(userConfig.getSessionId(), $scope.house.key, $scope.house.type)
				.success(function(data) {
					if(data.flag === 1) {
						var data = data.data;
						var filter = function(obj) {
							return {
								code: obj.uv_code,
								id: obj.uv_id,
								value: obj.value,
								minimum: obj.minimum,
								sum: obj.uv_code + ':' + obj.uv_id + ':' + obj.value
							};
						}

						// init coupon data
						if(data.coupon && data.coupon.length) {
							$scope.validCoupons = data.coupon.map(filter);
							couponsInit();
						}
						$scope.showCoupon = $scope.validCoupons.length < 2 || $window.innerHeight > 568; // 568 iphone5
						calcTotalPay();

						// init interest data
						if(data.interest && data.interest.length) {
							$scope.validInterests = data.interest.map(filter);
							interestsInit();
						}
						$scope.showInterest = $scope.validInterests.length < 2 || $window.innerHeight > 568;
						calcExtraEarn();
					}
				});
		};

		$scope.showInfo = function() {
			toaster.pop('info', '关注“大房东投资计划”微信公众号，获取最新活动内容，即有机会获得加息券和现金券。');
		};

		$scope.increase = function() {
			$scope.buy.volume += 1;
		};

		$scope.decrease = function() {
			$scope.buy.volume -= 1;
		};

		var interestsInit = function() {
			if(!$scope.validInterests.length) return;

			var limit = +$scope.buy.volume*10000;
			$scope.validInterests = $scope.validInterests.map(function(obj) {
				obj.checked = false;
				obj.disabled = +obj.minimum > limit;

				return obj;
			});

			var checkedItem, maxValue;
			for(var i=0, len=$scope.validInterests.length; i<len; i++) {
				if(!$scope.validInterests[i].disabled) {
					if(!angular.isDefined(checkedItem) || +$scope.validInterests[i].value > maxValue) {
						checkedItem = i;
						maxValue = +$scope.validInterests[i].value;
					} 
				}
			}

			if(angular.isDefined(checkedItem)) $scope.validInterests[checkedItem].checked = true;
		};

		var couponsInit = function() {
			if(!$scope.validCoupons.length) return;

			var limit = +$scope.buy.volume*10000;
			$scope.validCoupons = $scope.validCoupons.map(function(obj) {
				if(obj.minimum > limit) {
					obj.disabled = true;
					obj.checked = false;
				} else {
					obj.disabled = false;
					obj.checked = true;
				}

				return obj;
			});
		};

		$scope.$watch('buy.volume', function(val, old) {
			val = ~~val;
			if(val < 1) {
				val = 1;
			} else if(val > $scope.item.limit) {
				val = $scope.item.limit;
			}

			$scope.buy.volume = val;
			$scope.buy.mIncome = ($scope.item.mIncome*val).toFixed(2);
			$scope.buy.total = ($scope.item.total*val).toFixed(2);

			$scope.$parent.pay.count = val;
			$scope.$parent.order.total = val*10000;

			// for tos
			$rootScope.landlord && ($rootScope.landlord.total = val*10000);

			interestsInit();

			couponsInit();

			// calculate total with coupons
			calcTotalPay();
			// calculate extra earning with interests
			calcExtraEarn();
		});

		$scope.buyNow = function() {
			UserApi.generateOrderNo(userConfig.getSessionId())
				.success(function(data, status, headers, config) {
					if(data.flag === 1) {
						$scope.orderNo = data.data;
						$scope.$parent.pay.extRefNo = data.data;
						$scope.$parent.pay.earning = +$scope.buy.total + ($scope.buy.extraEarn || 0);

						$state.go('tabs.order');
					}
				});
		};

		

		$scope.$watch('validInterests', function() {
			calcExtraEarn();
		}, true);

		$scope.$watch('validCoupons', function() {
			calcTotalPay();
		}, true);

		var calcTotalPay = function() {
			$scope.order.total = $scope.buy.volume*10000;
			var coupons = [];
			for(var i=0; i<$scope.validCoupons.length; i++) {
				if($scope.validCoupons[i].checked) {
					$scope.order.total -= +$scope.validCoupons[i].value; 
					coupons.push($scope.validCoupons[i].sum);
				}
			}
			$scope.pay.coupons = coupons;
		};

		var calcExtraEarn = function() {
			var checked = false;
			for(var i=0; i<$scope.validInterests.length; i++) {
				if($scope.validInterests[i].checked) {
					$scope.buy.extraEarn = $scope.buy.volume*100*(+$scope.validInterests[i].value)/12*$scope.house.duration;
					$scope.pay.interest = $scope.validInterests[i].sum;
					checked = true;
				}
			}

			if(!checked) {
				$scope.buy.extraEarn = 0;
				$scope.pay.interest = '';
			}
		};

		$scope.selectInterest = function(index) {
			if(!$scope.validInterests[index].disabled) {
				for(var i=0; i<$scope.validInterests.length;i++) {
					$scope.validInterests[i].checked = i===index;
				}
			}
		}; 

		// reset
		$rootScope.$on('landlordUpdated', function() {
			init();
		});

		init();
	})