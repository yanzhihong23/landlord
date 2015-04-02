'use strict';

/**
 * @ngdoc function
 * @name landlordApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the landlordApp
 */
angular.module('landlordApp')
	.controller('MainCtrl', function($scope) {
		$scope.house = {};
		$scope.order = {};
		$scope.pay = {};
	})
	.controller('StartupCtrl', function($scope, $state, $timeout, utils) {
		$timeout(function() {
			utils.disableBack();
			$state.go('tabs.home');
		}, 3000);
	})
	.controller('TosCtrl', function($scope, $rootScope, $state, $ionicHistory, utils, userConfig) {
		var accountInfo = userConfig.getAccountInfo();
		$scope.userInfo = {
			realname: accountInfo.realname,
			id: accountInfo.idnum,
			mobile: accountInfo.mobilenum
		};

		if($rootScope.landlord) {
			$rootScope.landlord.joinDate = utils.getDate();
		} 

		$scope.close = function() {
			if($ionicHistory.backView()) {
				$ionicHistory.goBack();
			} else {
				utils.disableBack();
				$state.go('account.info');
			}
		};
	})
	.controller('RetrieveTxPwdCtrl', function($scope, $state, userConfig, UserApi, toaster, md5, $ionicHistory, $timeout, utils) {
		var sessionId = userConfig.getSessionId();
		var mobile = userConfig.getAccountInfo().mobilenum;
		$scope.invalidPassword = false;
		$scope.resendCountdown = 0;
		var resendCountdown = utils.resendCountdown($scope);
		$scope.user = {
			vcode: '',
			password: ''
		};

		$scope.passwordValidate = function(password) {
	    $scope.invalidPassword = !utils.isPasswordValid(password);
		};

		$scope.sendSms = function() {
			UserApi.sendSmsForRetrievePayPassword(sessionId, mobile)
				.success(function(data) {
					if(data.flag === 1) {
						toaster.pop('success', data.msg);
						resendCountdown();
					} else {
						toaster.pop('error', data.msg); 
					}
				});
		};

		$scope.retrievePayPassword = function() {
			var payPassword = md5.createHash($scope.user.password);
			UserApi.retrievePayPassword(sessionId, $scope.user.vcode, payPassword)
				.success(function(data) {
					if(data.flag === 1) {
						toaster.pop('success', data.msg);
						$ionicHistory.goBack();
					} else {
						toaster.pop('error', data.msg); 
						if(data.flag === 4) {
							$scope.invalidVcode = true;
						}
					}
				});
		};
	})
	

