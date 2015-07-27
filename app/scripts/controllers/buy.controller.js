'use strict';

angular.module('landlordApp')
	.controller('BuyCtrl', function($scope, userConfig, $state, $rootScope, UserApi, utils, $timeout, LandlordApi, $window, toaster, $ionicLoading, orderService, couponService) {
		$scope.selected = couponService.selected;
		$scope.order = {};
		var subject = $scope.subject = orderService.subject.subject;
		const PER = +subject.amount.per;

		var init = function() {
			console.log('----------- init BuyCtrl -----------');

	  	var annualIncome = subject.annual_yield/100*PER;
	  	var amount = subject.amount;
			$scope.item = {
				per: PER,
				monthIncome: +(annualIncome/12).toFixed(2) || 0,
				totalIncome: +(annualIncome/12*subject.duration).toFixed(2) || 0,
				maxVolume: ~~(Math.min(amount.max, amount.sum - amount.complete - amount.adjust)/PER) || 1,
				minVolume: ~~(amount.min/PER)
			};

			$scope.order = {
				volume: $scope.item.minVolume,
				amount: $scope.item.minVolume*$scope.item.per,
				income: $scope.item.minVolume*$scope.item.totalIncome
			};

			$scope.coupons = couponService.coupons;

			$scope.$watch('coupons', function(val) {
				if(val) {
					$scope.coupons.interest = val.interest;
					interestsInit();
				}
			}, true);
		};

		$scope.goTos = function() {
			if($rootScope.landlord) {
        $rootScope.landlord.records = [{
        	date: utils.getDate(),
        	amount: $scope.order.volume*PER
        }];
      }
      $state.go('tabs.tos');
		};

		$scope.increase = function() {
			$scope.order.volume += 1;
		};

		$scope.decrease = function() {
			$scope.order.volume -= 1;
		};

		var interestsInit = function() {
			if(!$scope.coupons.interest.length) return;

			var limit = +$scope.order.volume*PER;
			$scope.coupons.interest = $scope.coupons.interest.map(function(obj) {
				obj.checked = false;
				obj.disabled = +obj.minimum > limit;

				return obj;
			});

			var maxValue;
			$scope.selected.interest = null;
			for(var i=0, len=$scope.coupons.interest.length; i<len; i++) {
				if(!$scope.coupons.interest[i].disabled) {
					if($scope.selected.interest === null || +$scope.coupons.interest[i].value > maxValue) {
						$scope.selected.interest = i;
						maxValue = +$scope.coupons.interest[i].value;
					}
				}
			}

			if($scope.selected.interest !== null) $scope.coupons.interest[$scope.selected.interest].checked = true;
		};

		$scope.$watch('order.volume', function(val, old) {
			var limit = $scope.item.maxVolume;

			val = ~~val;
			if(val > limit) {
				val = limit;
			}

			$scope.order.volume = val;
			$scope.order.income = +($scope.item.totalIncome*val).toFixed(2);
			$scope.order.amount = $scope.item.per*val;

			interestsInit();
			calcExtraEarn();
		});

		$scope.buyNow = function() {
			// $ionicLoading.show();
			// UserApi.generateOrderNo(userConfig.getSessionId())
			// 	.success(function(data, status, headers, config) {
			// 		if(data.flag === 1) {
			// 			$scope.orderNo = data.data;
			// 			$scope.pay.extRefNo = data.data;
			// 		}
			// 	});

			// orderService.order = $scope.order;

			$state.go('tabs.order');
		};

		$scope.$watch('selected', function(val) {
			calcExtraEarn();
		}, true);

		var calcExtraEarn = function() {
			if($scope.selected.interest === null) {
				$scope.order.extraEarn = 0;
				$scope.order.interest = '';
			} else {
				$scope.order.extraEarn = $scope.order.volume/100*PER*(+$scope.coupons.interest[$scope.selected.interest].value)/12*subject.duration;
				$scope.order.interest = $scope.coupons.interest[$scope.selected.interest];
			}

			orderService.order = $scope.order;

			console.log($scope.order);
		};

		$scope.selectInterest = function(index) {
			if(!$scope.coupons.interest[index].disabled) {
				for(var i=0; i<$scope.coupons.interest.length;i++) {
					$scope.coupons.interest[i].checked = i===index;
				}
			}
		};

		$scope.selectInterestCoupon = function() {
			$state.go('tabs.coupons', {type: 'interest'});
		};

		// reset
		$rootScope.$on('landlordUpdated', function() {
			init();
		});

		init();
	})