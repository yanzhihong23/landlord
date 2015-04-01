'use strict';

angular.module('landlordApp')
	.controller('RechargeCtrl', function($scope, $rootScope, $state, UserApi, PayApi, userConfig, md5, utils, toaster, $ionicLoading, $ionicActionSheet) {
		var accountInfo,
				sessionId,
				mId,
				payMode = 1, // bank
				payCode = 2, // recharge
				extRefNo,
				storablePan,
				token;

		$scope.resendCountdown = 0;
		var resendCountdown = utils.resendCountdown($scope);

		$scope.bankCards = [];
		$scope.recharge = {};

		var init = function() {
			accountInfo = userConfig.getAccountInfo();
			sessionId = userConfig.getSessionId();
			mId = accountInfo.m_id;
			$scope.balanceUsable = accountInfo.balanceUsable;
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
				
			UserApi.getBoundBankList(sessionId)
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

					$scope.recharge.bankCard = $scope.bankCards[0].value;
					$scope.recharge.bankCardShow = $scope.bankCards[0].text;
					console.log($scope.bankCards);
				}); 
		};

		// get bank list
		PayApi.getBankListForKQ(userConfig.getSessionId())
			.success(function(data) {
				if(data.flag === 1) {
					$scope.bankList = data.data.map(function(obj) {
						return {
							text: obj.name,
							value: obj.id
						};
					});

					$scope.recharge.bankCode = $scope.bankList[0].id;
					$scope.recharge.bankName = $scope.bankList[0].text;
				}
			});

		$scope.selectBank = function() {
			if($scope.bankCards.length === 1) {
				$state.go('account.rechargeNew');
				return;
			}

			var hideSheet = $ionicActionSheet.show({
				buttons: $scope.bankCards,
				cancelText: '取消',
				buttonClicked: function(index) {
					if(index === $scope.bankCards.length-1) {
						$state.go('account.rechargeNew');
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
					$ionicLoading.hide();
					if(data.flag === 1) {
						toaster.pop('success', data.msg);
						$rootScope.$broadcast('landlordUpdated');
						$state.go('account.info');
					} else {
						toaster.pop('error', data.msg);
					}
				})
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
				$ionicLoading.hide();
				if(data.flag === 1) {
					toaster.pop('success', data.msg);
					$rootScope.$broadcast('landlordUpdated');
					$state.go('account.info');
				} else {
					toaster.pop('error', data.msg);
				}
			});
		};

		init();
	})