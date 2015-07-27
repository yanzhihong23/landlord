'use strict';

angular.module('landlordApp')
	.controller('RechargeCtrl', function($scope, $rootScope, $state, UserApi, PayApi, userConfig, md5, utils, toaster, $ionicLoading, $ionicActionSheet, $ionicModal, bankService, accountService) {
		var accountInfo,
				sessionId,
				mId,
				payMode = 1, // bank
				payCode = 2, // recharge
				extRefNo,
				storablePan,
				token;

		var resendCountdown = utils.resendCountdown($scope);
		var goToNew = function() {
			/Info/.test($state.current.name) ? $state.go('tabs.rechargeNewInfo') : $state.go('tabs.rechargeNew');
		};

		$scope.bankCards = [];
		$scope.recharge = {
			amount: $rootScope.amount
		};

		var init = function() {
			console.log('---------- init RechargeCtrl ------');
			accountInfo = userConfig.getAccountInfo();
			sessionId = userConfig.getSessionId();
			mId = accountInfo.m_id;
			$scope.balance = accountService.balance;

			$scope.recharge.name = accountInfo.realname;
			$scope.recharge.id = accountInfo.idnum;
			$scope.recharge.phone = accountInfo.mobilenum;

			if(accountInfo.realname && accountInfo.idnum) {
				$scope.disableIdEdit = true;
			}

			UserApi.generateOrderNo(sessionId)
				.success(function(data) {
					if(data.flag === 1) {
						extRefNo = data.data;
					}
				});

			// get bound bank list
			$scope.bankCards = bankService.getBoundBankList();
			$scope.bankCards.push({
				text: '添加银行卡',
				value: 'add'
			});
			$scope.recharge.bankCard = $scope.bankCards[0].value;
			$scope.recharge.bankCardShow = $scope.bankCards[0].text;
		};

		// get bank list
		$scope.bankList = bankService.getBankList();
		$scope.recharge.bankCode = $scope.bankList[0].value;
		$scope.recharge.bankName = $scope.bankList[0].text;


		$scope.selectBank = function() {
			if($scope.bankCards.length === 1) {
				$rootScope.amount = $scope.recharge.amount;
				goToNew();
				return;
			}

			var hideSheet = $ionicActionSheet.show({
				buttons: $scope.bankCards,
				cancelText: '取消',
				buttonClicked: function(index) {
					if(index === $scope.bankCards.length-1) {
						$rootScope.amount = $scope.recharge.amount;
						goToNew();
					} else {
						$scope.recharge.bankCard = $scope.bankCards[index].value;
						$scope.recharge.bankCardShow = $scope.bankCards[index].text;
						hideSheet();
					}
	     	}
			});
		};

		$scope.selectBankNew = function() {
			var hideSheet = $ionicActionSheet.show({
				buttons: $scope.bankList,
				cancelText: '取消',
				buttonClicked: function(index) {
					$scope.recharge.bankCode = $scope.bankList[index].value;
					$scope.recharge.bankName = $scope.bankList[index].text;
					hideSheet();
	     	}
			});
		}

		$scope.quickRecharge = function() {
			$ionicLoading.show();
			var password = md5.createHash($scope.recharge.password);
			PayApi.quickPay(mId, sessionId, extRefNo, $scope.recharge.bankCard, $scope.recharge.amount, null, null, payMode, payCode, password)
				.success(function(data) {
					if(data.flag === 1) {
						$rootScope.$broadcast('rechargeSuc', $scope.recharge.amount);
						// reset
						$scope.recharge.amount = null;
						$rootScope.amount = null;
						$scope.recharge.password = null;

						toaster.pop('success', data.msg);
						utils.goBack();
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
				})
		};

		$scope.$on('modal.hidden', function() {
	    // Execute action
	    $scope.recharge.password = null;
	  });

		$scope.closeModal = function() {
	    $rootScope.alertModal.hide();
	  };

	  $scope.retrievePassword = function() {
	  	$rootScope.alertModal.hide();
	  	$state.go('tabs.retrievePayPassword');
	  };

		$scope.sendSms = function() {
			$scope.clicked = true;
			PayApi.getPayVcode(
				extRefNo,
				$scope.recharge.name,
				$scope.recharge.id,
				0, mId,
				$scope.recharge.cardNo,
				$scope.recharge.phone,
				$scope.recharge.amount,
				null,
				null,
				payCode, payMode)
			.success(function(data) {
				$scope.clicked = false;
				if(data.flag === 1) {
					resendCountdown();
					storablePan = data.storablePan;
					token = data.token;
					toaster.pop('success', data.msg);
				} else {
					toaster.pop('error', data.msg);
				}
			});
		};

		$scope.rechargeNew = function() {
			$ionicLoading.show();

			// update kyc info
			if(!accountInfo.realname) {
				UserApi.updateKycInfo(sessionId, $scope.recharge.name, $scope.recharge.id, accountInfo.mobilenum)
					.success(function(data) {
						if(data.flag === 1) {
							userConfig.autoLogin(); // get new account info
							pay();
						} else {
							toaster.pop('error', data.msg);
						}
					});
			} else {
				pay();
			}

		};

		var pay = function() {
			PayApi.bindAndPay(mId, sessionId, 
				extRefNo, storablePan, 
				$scope.recharge.amount, 
				$scope.recharge.vcode, 
				token, 
				payMode, 
				payCode, 
				null, 
				null, 
				$scope.recharge.name, 
				$scope.recharge.id, 
				$scope.recharge.cardNo, 
				$scope.recharge.bankCode, 
				$scope.recharge.phone)
			.success(function(data) {
				if(data.flag === 1) {
					$rootScope.$broadcast('rechargeSuc', $scope.recharge.amount);
					// reset
					$scope.recharge.amount = null;
					$rootScope.amount = null;
					$scope.recharge.cardNo = null;
					$scope.recharge.vcode = null;
					// update bankService
					bankService.updateBoundBankList();

					toaster.pop('success', data.msg);
					utils.goBack(2);
				} else {
					toaster.pop('error', data.msg);
				}
			});
		};

		init();

		$rootScope.$on('balanceUpdated', function() {
			init();
		});
	})