'use strict';

angular.module('landlordApp')
	.controller('WithdrawCtrl', function($scope, $state, $ionicActionSheet, $ionicLoading, $ionicPopup, accountService, bankService, BankApi, userConfig, utils) {
		var accountInfo = userConfig.getAccountInfo(),
				sessionId = userConfig.getSessionId();
		$scope.balance = accountService.balance;
		$scope.cardList = bankService.getBoundBankList();
		if($scope.cardList && $scope.cardList.length) {
			$scope.card = $scope.cardList[0];
		}

		$scope.withdraw = {
			fee: 0,
			result: 0,
			invalid: false
		};

		$scope.history = function() {
			$state.go('account.withdrawHistory');
		}

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
			val = Math.min(parseFloat(val), +accountService.balance.available);
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
					$ionicLoading.hide();
					if(data.flag === 8) { // success
						accountService.update();

						$ionicPopup.alert({
							title: '提现申请已成功提交，等待处理。',
							cssClass: 'alert',
							okText: '确定',
							okType: 'accent'
						}).then(function(res) {
							$state.go('account.withdrawHistory');
						});

						// utils.goBack();
					}
				})
		};

	})
	.controller('WithdrawHistoryCtrl', function($scope, $filter, $ionicLoading, userConfig, BankApi) {
		$scope.loading = true;
		$ionicLoading.show();
		BankApi.getWithdrawList(userConfig.getSessionId(), 10, 0)
			.success(function(data) {
				$scope.loading = false;
				$ionicLoading.hide();
				if(data.flag === 1) {
					var result = data.data.reslut;
					if(result.countRows) {
						$scope.records = result.content.map(function(obj) {
							var status, className;
							switch(+obj.gf_status) {
								case 0:
									// status = '待受理';
									// break;
								case 1:
									// status = '已受理';
									// break;
								case 2:
									status = '处理中';
									break;
								case 3:
									status = '撤消申请';
									break;
								case 4:
									status = '提现成功';
									className = 'suc';
									break;
								case 5:
									status = '提现失败';
									className = 'fail'
									break;
							}
							return {
								name: obj.banks_cat + '（尾号' + obj.banks_account.substr(-4) + '）',
								date: $filter('date')(new Date(obj.gf_time*1000), 'yyyy-MM-dd'),
								amount: +obj.gf_price + +obj.gf_withdrawal_price,
								status: status,
								className: className
							}
						})
					}
				}
			})
	})