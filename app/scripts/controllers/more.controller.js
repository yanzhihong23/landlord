'use strict';

angular.module('landlordApp')
	.controller('MoreCtrl', function($scope, $rootScope, $state, userConfig, $ionicHistory, $ionicActionSheet, utils, bankService) {
		var accountInfo = userConfig.getAccountInfo();
		var kyc, setKyc;
		var boundCards = bankService.getBoundBankList();
		if(accountInfo.realname && accountInfo.idnum) {
			kyc = '*' + accountInfo.realname.substr(1)  + '(' + accountInfo.idnum.charAt(0) + '***************' + accountInfo.idnum.substr(-1) + ')';
		} else {
			setKyc = '#/tab/kyc';
		}
		$scope.info = {
			kyc: kyc,
			setKyc: setKyc,
			phone: accountInfo.mobilenum.substr(0,3) + '****' + accountInfo.mobilenum.substr(-4),
			cards: boundCards && boundCards.length,
			payPwdSet: accountInfo.is_pay_password
		};

		$scope.logout = function() {
			$ionicActionSheet.show({
				buttons: [
				 { text: '退出登录' }
				],
				// destructiveText: 'Delete',
				titleText: '退出账户?',
				cancelText: '取消',
				cssClass: 'assertive',
				cancel: function() {
			    // add cancel code..
			  },
				buttonClicked: function(index) {
				 userConfig.logout();
				}
			});
		};
	})
	.controller('KycCtrl', function($scope, $rootScope, $ionicPopup, userConfig, UserApi, utils, toaster) {
		var accountInfo = userConfig.getAccountInfo(),
				sessionId = userConfig.getSessionId();

		$scope.kyc = {};

		$scope.showConfirm = function() {
			$rootScope.popup = $ionicPopup.confirm({
		     title: '请再次确认您的身份信息',
		     template: '姓名: ' + $scope.kyc.name + '<br>身份证: ' + $scope.kyc.id,
		     cancelText: '修改',
		     cancelType: 'button-light',
		     okText: '确认',
		     okType: 'button-energized'
		   });

			$rootScope.popup.then(function(res) {
		   	if(res) {
		   		submit();
		   	}
		   });
		};

		var submit = function() {
			UserApi.doKyc(sessionId, $scope.kyc.name, $scope.kyc.id)
				.success(function(data) {
					utils.alert({
						content: data.msg,
						callback: function() {
							if(data.flag === 8) {
								utils.goBack();
							}
						}
					});
				});
		};
	})


