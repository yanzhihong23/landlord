'use strict';

angular.module('landlordApp')
	.controller('OrderCtrl', function($scope, $rootScope, $state, $ionicLoading, UserApi, PayApi, userConfig, toaster, md5, $ionicActionSheet, $ionicModal, accountService) {
		var init = function(amount) {
			console.log('----------- init OrderCtrl -----------');
			$scope.order.balanceUsable = +userConfig.getAccountInfo().balanceUsable + (+amount || 0);
			$scope.order.balance = $scope.order.balanceUsable;
			$scope.order.bank = Math.max($scope.order.total - $scope.order.balance, 0);
			$scope.bankCards = [];
			$scope.order.bankCard = null;
			$scope.user = {payPassword: ''};

			$scope.order.useBalance = !!$scope.order.balance;

			UserApi.getBoundBankList(userConfig.getSessionId())
				.success(function(data) {
					if(data.flag === 1) {
						$scope.bankCards = data.data.map(function(obj) {
							if(!$scope.order.bankCard && /建设|招商|平安/.test(obj.banks_cat)) {
								$scope.order.bankId = obj.banks_id;
								$scope.order.bankCard = obj.kuaiq_short_no;
								$scope.order.bankCardShow = obj.banks_cat + '（尾号' + obj.banks_account.substr(-4) + '）';
							}

							return {
								bankId: obj.banks_id,
								value: obj.kuaiq_short_no,
								text: obj.banks_cat + '（尾号' + obj.banks_account.substr(-4) + '）'
							}
						});
					} 

					$scope.bankCards.push({
						text: '添加银行卡',
						value: 'add'
					});

					if(!$scope.order.bankCard) {
						$scope.order.bankId = $scope.bankCards[0].bankId;
						$scope.order.bankCard = $scope.bankCards[0].value;
						$scope.order.bankCardShow = $scope.bankCards[0].text;
						$scope.showBankRec = /工商|光大|民生/.test($scope.bankCards[0].text);
					}
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
				// $state.go('tabs.pay');
				$scope.showBankRec = false;
			} else {
				for(var i=0; i<$scope.bankCards.length; i++) {
					if(val == $scope.bankCards[i].value) {
						$scope.showBankRec = /工商|光大|民生/.test($scope.bankCards[i].text);
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
			PayApi.quickPay(mId, sessionId, $scope.pay.extRefNo, $scope.order.bankCard, $scope.order.bankId, $scope.pay.count, $scope.house.key, $scope.house.type, payMode, payCode, payPassword, $scope.pay.coupons, $scope.pay.interest)
				.success(function(data) {
					$ionicLoading.hide();
					if(data.flag === 1) {
						toaster.pop('success', data.msg);
						$scope.user.payPassword = null; // clear password
						// update account service(balance)
						accountService.update();
						
						$rootScope.$broadcast('landlordUpdated');
						$state.go('account.info');
					} else if(/密码错误/.test(data.msg)) { // wrong password
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
	  };

	  $scope.recharge = function() {
	  	$rootScope.$on('rechargeSuc', function(event, amount) {
	  		init(amount);
	  	});

  		$state.go('account.recharge');
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
	    $scope.user.payPassword = null;
	  });

		$rootScope.$on('balanceUpdated', function() {
			init();
		}); 

		init();
	})