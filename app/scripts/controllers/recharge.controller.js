'use strict';

angular.module('landlordApp')
	.controller('RechargeCtrl', function($scope, $rootScope, $state, UserApi, PayApi, userConfig, md5, utils, toaster, $ionicLoading, $ionicActionSheet, $ionicModal, bankService, accountService, orderService) {
		var accountInfo = userConfig.getAccountInfo(),
				sessionId = userConfig.getSessionId(),
				mId = accountInfo.m_id,
				payMode = 1, // bank
				payCode = 2, // recharge
				extRefNo,
				storablePan,
				token;

		$scope.order = orderService.order = {};
		orderService.subject = null;

		// get bound bank list
		$scope.bankCards = bankService.getBoundBankList();
		if($scope.bankCards.length) {
			$scope.order.card = $scope.bankCards[$scope.bankCards.length - 1];
		}

		$scope.selectCard = function() {
			$state.go('tabs.selectCard:info');
		};

		$scope.addCard = function() {
			$state.go('tabs.addCard');
		};

		$scope.quickRecharge = function() {
			$ionicLoading.show();
			var payPassword = md5.createHash($scope.order.password);

			UserApi.generateOrderNo(sessionId)
				.success(function(data) {
					if(data.flag === 1) {
						extRefNo = data.data;

						var params = {
							mId: mId,
							sessionId: sessionId,
							extRefNo: extRefNo,
							storablePan: $scope.order.card && $scope.order.card.value,
							bankId: $scope.order.card && $scope.order.card.id,
							count: $scope.order.amount,
							key: null,
							type: null,
							payMode: $scope.order.payMode,
							payCode: payCode,
							payPassword: payPassword
						};

						$ionicLoading.show();
						PayApi.quickPay(params).success(function(data) {
							if(data.flag === 1) {
								accountService.update();
								utils.goBack();
							} else {
								utils.alert({
									content: data.msg
								});
							}
						})
					}
				});
		};
	})