'use strict';

angular.module('landlordApp')
	.controller('OrderCtrl', function($scope, $rootScope, $state, $ionicLoading, UserApi, PayApi, userConfig, toaster, md5, $ionicActionSheet, $ionicModal) {
		var init = function() {
			console.log('----------- init OrderCtrl -----------');
			$scope.order.balanceUsable = userConfig.getAccountInfo().balanceUsable;
			$scope.order.balance = $scope.order.balanceUsable;
			$scope.order.bank = Math.max($scope.order.total - $scope.order.balance, 0);
			$scope.bankCards = [];
			$scope.user = {payPassword: ''};

			$scope.order.useBalance = !!$scope.order.balance;

			UserApi.getBoundBankList(userConfig.getSessionId())
				.success(function(data) {
					if(data.flag === 1) {
						var arr = data.data;
						for(var i=0; i<arr.length; i++) {
							var card = {
								value: arr[i].kuaiq_short_no, // storablePan
								text: arr[i].banks_cat + '（尾号' + arr[i].banks_account.substr(-4) + '）'
							};
							$scope.bankCards.push(card);
						}
					} 

					$scope.bankCards.push({
						text: '添加银行卡',
						value: 'add'
					});

					$scope.order.bankCard = $scope.bankCards[0].value;
					$scope.showBankRec = /工商|光大|民生/.test($scope.bankCards[0].text);
					$scope.order.bankCardShow = $scope.bankCards[0].text;
				}); 
		};

		$scope.selectBank = function() {
			if(!$scope.order.useCard) return;

			if($scope.bankCards.length === 1) {
				$state.go('tabs.pay');
				return;
			}

			var hideSheet = $ionicActionSheet.show({
				buttons: $scope.bankCards,
				cancelText: '取消',
				buttonClicked: function(index) {
					if(index === $scope.bankCards.length-1) {
						$state.go('tabs.pay');
					} else {
						$scope.order.bankCard = $scope.bankCards[index].value;
						$scope.order.bankCardShow = $scope.bankCards[index].text;
						hideSheet();
					}
	     	}
			})
		};

		$scope.$watch('order.bankCard', function(val, oldVal) {
			if(val !== oldVal && val === 'add' && $scope.order.useCard) {
				$state.go('tabs.pay');
				$scope.showBankRec = false;
			} else {
				for(var i=0; i<$scope.bankCards.length; i++) {
					if(val == $scope.bankCards[i].value) {
						$scope.showBankRec = /工商|广大|民生/.test($scope.bankCards[i].text);
						break;
					}
				}
			}
		});

		$scope.$watch('order.useBalance', function(val) {
			if(val) {
				if($scope.order.total > $scope.order.balanceUsable) {
					$scope.order.balance = $scope.order.balanceUsable;
					$scope.order.bank = $scope.order.total - $scope.order.balance;

					$scope.order.cardDisabled = false;
					$scope.order.useCard = true;

					$scope.$parent.pay.payMode = 3;
				} else {
					$scope.order.balance = $scope.order.total;
					$scope.order.bank = 0;

					$scope.order.useCard = false;
					$scope.order.cardDisabled = false;

					$scope.$parent.pay.payMode = 2;
				}
			} else {
				$scope.order.balance = 0;
				$scope.order.bank = $scope.order.total;
				$scope.order.useCard = true;
				$scope.order.cardDisabled = false;

				$scope.$parent.pay.payMode = 1;
			}

			console.log('payMode: ' + $scope.$parent.pay.payMode);
		});

		$scope.$watch('order.useCard', function(val, oldVal) {
			if(val !== oldVal) { // val === oldVal when back from bind new card
				if(val) {
					if($scope.order.balanceUsable > $scope.order.total) {
						$scope.order.useBalance = false;
					}

					if($scope.order.useBalance) {
						$scope.$parent.pay.payMode = 3;
					} else {
						$scope.$parent.pay.payMode = 1;
					}
					if($scope.order.bankCard === 'add' && $scope.bankCards.length === 1) {
						// $scope.order.useCard = false;
						$state.go('tabs.pay');
					}
				} else {
					if($scope.order.balanceUsable) {
						$scope.$parent.pay.payMode = 2;
						$scope.order.useBalance = true;
					}
					
				}
			}

			console.log('payMode: ' + $scope.$parent.pay.payMode);
		});

		$scope.quickPay = function() {
			var accountInfo = userConfig.getAccountInfo();
			var sessionId = userConfig.getSessionId();
			var mId = accountInfo.m_id;
			var payCode = 1; // buy
			var payMode = $scope.$parent.pay.payMode;
			var payPassword = md5.createHash($scope.user.payPassword);

			$ionicLoading.show();
			PayApi.quickPay(mId, sessionId, $scope.pay.extRefNo, $scope.order.bankCard, $scope.pay.count, $scope.house.key, $scope.house.type, payMode, payCode, payPassword, $scope.pay.coupons, $scope.pay.interest)
				.success(function(data) {
					$ionicLoading.hide();
					if(data.flag === 1) {
						toaster.pop('success', data.msg);
						$scope.user.payPassword = null; // clear password
						$rootScope.$broadcast('landlordUpdated');
						$state.go('account.info');
					} else if(data.flag === -1) { // wrong password
						$ionicModal.fromTemplateUrl('views/wrong-password.html', {
							scope: $scope,
							animation: 'slide-in-up'
						}).then(function(modal) {
							$rootScope.alertModal = modal;
							$rootScope.alertModal.show();
						});
					} else {
						toaster.pop('error', data.msg);
					}
				});
		};

		$scope.closeModal = function() {
	    $rootScope.alertModal.hide();
	  };

	  $scope.retrievePassword = function() {
	  	$rootScope.alertModal.hide();
	  	$state.go('tabs.retrievePayPassword');
	  }

		$scope.$on('modal.hidden', function() {
	    // Execute action
	    $scope.user.payPassword = null;
	  });

		$rootScope.$on('balanceUpdated', function() {
			init();
		}); 

		init();
	})