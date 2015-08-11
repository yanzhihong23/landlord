'use strict';

angular.module('landlordApp')
	.controller('WithdrawCtrl', function($scope, $state, $ionicLoading, accountService, orderService, bankService, BankApi, userConfig, utils) {
		var accountInfo = userConfig.getAccountInfo(),
				sessionId = userConfig.getSessionId();

		$scope.info = accountService;

		$scope.withdraw = {
			fee: 0,
			result: 0,
			invalid: false
		};

		$scope.order = orderService.order = {};

		// get bound bank list
		$scope.bankCards = bankService.getBoundBankList();
		if($scope.bankCards.length) {
			$scope.order.card = $scope.bankCards[$scope.bankCards.length - 1];
		}

		$scope.selectCard = function() {
			$state.go('tabs.selectCard:info');
		};

		$scope.$watch('withdraw.amount', function(val) {
			if(/\.$/.test(val)) return;
			val = Math.min(parseFloat(val), $scope.info.balance.available);
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
			BankApi.withdraw(sessionId, $scope.withdraw.result, $scope.order.card.id)
				.success(function(data) {
					if(data.flag === 8) { // success
						accountService.update();
						utils.alert({
							content: '提现申请已提交，最快24小时内到账',
							okType: 'button-balanced',
							callback: function() {
								utils.goBack();
							}
						});
					} else {
						utils.alert({
							content: data.msg
						});
					}
				});
		};

	})