'use strict';

angular.module('landlordApp')
	.controller('MyCardsCtrl', function($scope, $rootScope, $state, bankService, utils, userConfig) {
		var init = function() {
			console.log('------------- init MyCardsCtrl --------------');
			$scope.cardList = bankService.getBoundBankList();
		};

		$scope.addNew = function() {
			var accountInfo = userConfig.getAccountInfo();
			if(accountInfo.realname && accountInfo.idnum) {
				$state.go('tabs.addCard');
			} else {
				$state.go('tabs.kyc');
			}
		};

		$scope.delete = function(index) {
			utils.confirm({
				content: '确定要删除这张银行卡吗？',
				okType: 'button-balanced',
				onOk: function() {
					$scope.cardList.splice(index, 1);
				}
			})
		};

		$rootScope.$on('boundBankListUpdated', function(evt) {
			init();
		});

		init();
	})
	.controller('AddCardCtrl', function($scope, $rootScope, $state, userConfig, PayApi, bankService, toaster, $ionicLoading, $ionicActionSheet, utils) {
		var accountInfo = userConfig.getAccountInfo(),
				sessionId = userConfig.getSessionId(),
				mId = accountInfo && accountInfo.m_id,
				realname = accountInfo.realname,
				idNo = accountInfo.idnum,
				extRefNo,
				token,
				resendCountdown = utils.resendCountdown($scope);

		$scope.clicked = false;
		$scope.bankList = bankService.getBankList();
		$scope.pay.realname = accountInfo.realname;
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
		};

		$scope.sendSms = function() {
			$scope.clicked = true;
			PayApi.getBindVcode(mId, sessionId, realname, idNo, $scope.pay.cardNo, $scope.pay.bankCode, $scope.pay.phone)
				.success(function(data) {
					$scope.clicked = false;

					if(data.flag === 1) {
						resendCountdown();
						extRefNo = data.externalRefNumber;
						token = data.token;
						toaster.pop('success', data.msg);
					} else {
						toaster.pop('error', data.msg);
					}
				})
		};

		$scope.submit = function() {
			$ionicLoading.show();
			PayApi.bindBankCard(mId, sessionId, extRefNo, realname, idNo, $scope.pay.cardNo, $scope.pay.bankCode, $scope.pay.phone, $scope.pay.vcode, token)
				.success(function(data) {
					if(data.flag === 1) {
						toaster.pop('success', data.msg);
						// update bankService
						bankService.updateBoundBankList();

						$state.go('tabs.myCards');
					} else {
						toaster.pop('error', data.msg);
					}
				});
		};


	})