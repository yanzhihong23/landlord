'use strict';

angular.module('landlordApp')
	.controller('OrderCtrl', function($scope, $rootScope, $state, $ionicLoading, UserApi, PayApi, userConfig, toaster, md5, $ionicActionSheet, $ionicModal, bankService, orderService, couponService, accountService, utils) {
		$scope.selected = couponService.selected;
		$scope.order = orderService.order;
		$scope.balance = accountService.balance;

		var init = function(amount) {
			console.log('----------- init OrderCtrl -----------');

			$scope.coupons = couponService.coupons;

			$scope.$watch('coupons', function(val) {
				if(val) {
					$scope.coupons.cash = val.cash;
					cashInit();
				}
			});
		};

		var cashInit = function() {
			if(!$scope.coupons.cash.length) return;

			var amount = $scope.order.amount;
			$scope.coupons.cash = $scope.coupons.cash.map(function(obj) {
				obj.checked = false;
				obj.disabled = +obj.minimum > amount;

				return obj;
			});

			var maxValue;
			$scope.selected.cash = null;
			for(var i=0, len=$scope.coupons.cash.length; i<len; i++) {
				if(!$scope.coupons.cash[i].disabled) {
					if($scope.selected.cash === null || +$scope.coupons.cash[i].value > maxValue) {
						$scope.selected.cash = i;
						maxValue = +$scope.coupons.cash[i].value;
					}
				}
			}

			if($scope.selected.cash !== null) $scope.coupons.cash[$scope.selected.cash].checked = true;
		};

		$scope.selectCashCoupon = function() {
			$state.go('tabs.coupons', {type: 'cash'});
		};

		$scope.$watch('selected', function(val) {
			var cashValue = 0;
			if($scope.selected.cash !== null) {
				cashValue = $scope.coupons.cash[$scope.selected.cash].value;
				$scope.order.cash = $scope.coupons.cash[$scope.selected.cash];
			}

			$scope.order.pay = Math.max($scope.order.amount - cashValue, 0);

			if($scope.order.pay > $scope.balance.available) {
				$scope.bankCards = bankService.getBoundBankList();
				if($scope.bankCards.length){
					$scope.order.card = $scope.bankCards[$scope.bankCards.length - 1];
					$scope.order.payMode = 3;
				}
			} else {
				$scope.order.payMode = 2;
			}
		}, true);

		$scope.confirm = function() {
			orderService.purchase($scope);
		};

		$scope.$on('purchaseSuc', function() {
			$state.go('tabs.purchaseSuc');
		});

		$rootScope.$on('balanceUpdated', function() {
			init();
		});

		init();
	})
	.controller('SeclectCardCtrl', function($scope, $state, bankService, orderService, utils) {
		$scope.bankCards = /:new/.test($state.current.name) ? bankService.getBankList() : bankService.getBoundBankList();

		$scope.select = function(index) {
			if(/:new/.test($state.current.name)){
				bankService.order.card = $scope.bankCards[index];
			} else {
				orderService.order.card = $scope.bankCards[index];
			}

			utils.goBack();
		};
	})
	.controller('PurchaseSucCtrl', function($scope, $state, $ionicHistory, accountService, orderService) {
		$scope.subject = orderService.subject;
		$scope.order = orderService.order;

		$scope.startDate = moment($scope.subject.subject.interest_start_date).format('YYYY-MM-DD');
		var duration = $scope.subject.subject.duration;

		// refund periods
		$scope.refundPeriods = [];
		for(var i=0; i<duration; i++) {
			var item = {
				date: moment($scope.startDate).add(i+1, 'M').format('YYYY-MM-DD'),
				amount: $scope.order.income/duration
			};

			if(i === duration-1) {
				item.amount = $scope.order.income + $scope.order.amount + $scope.order.extraEarn;
				item.desc = '(含' + ($scope.order.interest ? '加息' + $scope.order.interest.value  + '%、' : '') + '本金)';
			}

			$scope.refundPeriods.push(item);
		}

		$scope.complete = function() {
			accountService.update();
			$state.go('tabs.info');
			$ionicHistory.clearHistory();
			$ionicHistory.clearCache();
		};

	})