'use strict';

angular.module('landlordApp')
	.controller('PayCtrl', function($scope, $rootScope, $state, PayApi, userConfig, toaster, UserApi, $ionicLoading, $timeout, utils, $ionicActionSheet, bankService) {
		var accountInfo = userConfig.getAccountInfo();
		var sessionId = userConfig.getSessionId();
		var mId = accountInfo && accountInfo.m_id, storablePan, token;
		var resendCountdown = utils.resendCountdown($scope);

		$scope.pay = $scope.$parent.pay;
		$scope.pay.name = accountInfo.realname;
		$scope.pay.id = accountInfo.idnum;
		$scope.pay.phone = accountInfo.mobilenum;
		$scope.pay.key = $scope.house.key;
		$scope.pay.type = $scope.house.type;

		// $scope.pay.cardNo = '6228483470502762919'; // for test
		console.log('payMode: ' + $scope.pay.payMode);

		if(accountInfo.realname && accountInfo.idnum) {
			$scope.disableIdEdit = true;
		}

		$scope.bankList = bankService.getBankList();
		if(!$scope.pay.bankCode)  {
			$scope.pay.bankCode = $scope.bankList[0].value;
			$scope.pay.bankName = $scope.bankList[0].text;
		}

		$scope.selectBank = function() {
			var hideSheet = $ionicActionSheet.show({
				buttons: $scope.bankList,
				cancelText: '取消',
				buttonClicked: function(index) {
					$scope.pay.bankCode = $scope.bankList[index].value;
					$scope.pay.bankName = $scope.bankList[index].text;
					hideSheet();
	     	}
			});
		}

		$scope.sendSms = function() {
			PayApi.getPayVcode(
				$scope.pay.extRefNo,
				$scope.pay.name,
				$scope.pay.id,
				0, mId,
				$scope.pay.cardNo,
				$scope.pay.phone,
				$scope.pay.count,
				$scope.pay.key,
				$scope.pay.type,
				1, $scope.pay.payMode)
			.success(function(data) {
				if(data.flag === 1) {
					resendCountdown();
					storablePan = data.storablePan;
					token = data.token;
					toaster.pop('success', data.msg);
				} else {
					toaster.pop('error', data.msg);
				}
			})
		};

		$scope.doPay = function() {
			$ionicLoading.show();

			// update kyc info
			if(!accountInfo.realname) {
				UserApi.updateKycInfo(sessionId, $scope.pay.name, $scope.pay.id, accountInfo.mobilenum)
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
				$scope.pay.extRefNo, storablePan, 
				$scope.pay.count, 
				$scope.pay.vcode, 
				token, 
				$scope.pay.payMode, 
				1, 
				$scope.house.key, 
				$scope.house.type, 
				$scope.pay.name, 
				$scope.pay.id, 
				$scope.pay.cardNo, 
				$scope.pay.bankCode, 
				$scope.pay.phone,
				$scope.pay.coupons, 
				$scope.pay.interest)
			.success(function(data) {
				$ionicLoading.hide();
				if(data.flag === 1) {
					toaster.pop('success', data.msg);
					// $scope.order = {};
					$scope.pay = {};
					$rootScope.$broadcast('landlordUpdated');
					// update bankService
					bankService.updateBoundBankList();
					
					$state.go('account.info');
				} else {
					toaster.pop('error', data.msg);
				}
			});
		};
	})