'use strict';

angular.module('landlordApp')
	.controller('WithdrawCtrl', function($scope, $ionicActionSheet, $ionicLoading, accountService, bankService, BankApi, userConfig, utils) {
		var accountInfo = userConfig.getAccountInfo(),
				sessionId = userConfig.getSessionId();
		$scope.balanceAvailable = +accountService.balance.available;
		$scope.cardList = bankService.getBoundBankList();
		if($scope.cardList && $scope.cardList.length) {
			$scope.card = $scope.cardList[0];
		}

		$scope.withdraw = {
			fee: 0,
			result: 0,
			invalid: false
		};

		$scope.selectBank = function() {
			var hideSheet = $ionicActionSheet.show({
				buttons: $scope.cardList,
				cancelText: '取消',
				buttonClicked: function(index) {
					$scope.card = $scope.cardList[index];
					hideSheet();
				}
			});
		};

		$scope.$watch('withdraw.amount', function(val) {
			if(/\.$/.test(val)) return;
			val = Math.min(parseFloat(val), $scope.balanceAvailable);
			$scope.withdraw.invalid = val < 2;
			$scope.withdraw.amount = val;
			$scope.withdraw.fee = +val ? getFee(+val) : 0;
			$scope.withdraw.result = Math.max((val || 0) - $scope.withdraw.fee, 0);
		});

		var getFee = function(amount) {
			return Math.floor(amount/49999)*3 + (amount%49999 < 20000 ? 1 : 3);
		};

		$scope.submit = function() {
			$ionicLoading.show();
			BankApi.withdraw(sessionId, $scope.withdraw.result, $scope.card.id)
				.success(function(data) {
					if(data.flag === 8) { // success
						accountService.update();
						utils.goBack();
					}
				})
		};

		BankApi.getWithdrawList(sessionId, 10, 0);
	})