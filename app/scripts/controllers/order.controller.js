'use strict';

angular.module('landlordApp')
	.controller('OrderCtrl', function($scope, $rootScope, $state, $ionicLoading, UserApi, PayApi, userConfig, toaster, md5, $ionicActionSheet, $ionicModal, bankService, orderService, couponService, utils) {
		$scope.selected = couponService.selected;
		$scope.order = orderService.order;
		$scope.order.balance = +userConfig.getAccountInfo().balanceUsable;

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

			console.log('pay: ' + $scope.order.pay + ' & balance: ' + $scope.order.balance);

			if($scope.order.pay > $scope.order.balance) {
				console.log('pay > balance')
				$scope.bankCards = bankService.getBoundBankList();
				if($scope.bankCards.length){
					$scope.order.card = $scope.bankCards[$scope.bankCards.length - 1];
					$scope.order.payMode = 3;
				}
			} else {
				console.log('pay < balance')
				$scope.order.payMode = 2;
			}

			console.log($scope.order);
		}, true);

		$scope.confirm = function() {
			$ionicModal.fromTemplateUrl('templates/purchase-modal.html', {
				scope: $scope,
				animation: 'slide-in-up'
			}).then(function(modal) {
		    $scope.purchaseModal = modal;
		    $scope.purchaseModal.show();
		  });
		};

		$scope.modalCancel = function() {
			$scope.purchaseModal.hide();
		};

		$scope.modalConfirm = function() {
			$scope.quickPay();
		};

		$scope.selectCard = function() {
			$scope.purchaseModal.hide();
			$state.go('tabs.selectCard');
		};

		$rootScope.$on('backFromSeclecCard', function() {
			console.log('backFromSeclecCard')
			$scope.purchaseModal.show();
		});

		$scope.quickPay = function() {
			var accountInfo = userConfig.getAccountInfo(),
					sessionId = userConfig.getSessionId(),
					mId = accountInfo.m_id,
					payCode = 1, // buy
					payMode = $scope.order.payMode,
					payPassword = md5.createHash($scope.order.payPassword),
					extRefNo;

			$ionicLoading.show();

			UserApi.generateOrderNo(sessionId).success(function(data) {
				if(data.flag === 1) {
					extRefNo = data.data;

					var params = {
						mId: mId,
						sessionId: sessionId,
						extRefNo: extRefNo,
						storablePan: $scope.order.card && $scope.order.card.value, // todo
						bankId: $scope.order.card && $scope.order.card.id,
						count: $scope.order.volume,
						key: orderService.subject.subject.id,
						type: 1,
						payMode: $scope.order.payMode,
						payCode: payCode,
						payPassword: payPassword,
						coupon: $scope.order.coupon && $scope.order.coupon.sum,
						interest: $scope.order.interest && $scope.order.interest.sum
					};

					console.log('quickpay params');
					console.log(params);

					$ionicLoading.show();
					PayApi.quickPay(params)
						.success(function(data) {
							if(data.flag === 1) {
								$scope.purchaseModal.hide();
								$scope.order.payPassword = null; // clear password
								$rootScope.$broadcast('landlordUpdated');
								$state.go('tabs.purchaseSuc');
							} else if(/密码错误/.test(data.msg)) { // wrong password
								$scope.purchaseModal.hide();

								utils.confirm({
									content: '支付密码不正确',
									okText: '重新输入',
									onCancel: function() {
										$scope.purchaseModal.show();
									},
									onOk: function() {
										$scope.purchaseModal.show();
										$scope.order.payPassword = null;
									}
								})
							} else {
								toaster.pop('error', data.msg);
							}
						});
				}
			});
		};

		$scope.closeModal = function() {
	    $rootScope.alertModal.hide();
	  };

	  $scope.retrievePassword = function() {
	  	$rootScope.alertModal.hide();
	  	$state.go('tabs.retrievePayPassword');
	  };

	  $scope.recharge = function() {
	  	$rootScope.$on('rechargeSuc', function(event, amount) {
	  		init(amount);
	  	});

  		$state.go('tabs.recharge');
  	};

	  $scope.recommend = function(name) {
	  	switch(name) {
	  		case 'ccb':
	  			$scope.pay.bankCode = 4;
	  			$scope.pay.bankName = '中国建设银行';
	  			break;
  			case 'cmb':
  				$scope.pay.bankCode = 5;
  				$scope.pay.bankName = '招商银行';
  				break;
				case 'pingan':
					$scope.pay.bankCode = 33;
					$scope.pay.bankName = '平安银行';
					break;
	  	}

	  	$state.go('tabs.pay');
	  };

		$scope.$on('modal.hidden', function() {
	    // Execute action
	    // $scope.user.payPassword = null;
	  });

		$rootScope.$on('balanceUpdated', function() {
			init();
		});

		init();
	})
	.controller('SeclectCardCtrl', function($scope, bankService, orderService, utils) {
		$scope.bankCards = bankService.getBoundBankList();

		$scope.select = function(index) {
			orderService.order.card = $scope.bankCards[index];
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