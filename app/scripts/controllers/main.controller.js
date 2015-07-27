'use strict';

/**
 * @ngdoc function
 * @name landlordApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the landlordApp
 */
angular.module('landlordApp')
	.controller('MainCtrl', function($scope, $rootScope, $state) {
		$scope.house = {};
		$scope.order = {};
		$scope.pay = {};

		var reset = function() {
    	$rootScope.hideTabs = !/tabs.home|tabs.info|tabs.welfare/.test($state.current.name);
    };

    $rootScope.$on('$ionicView.beforeEnter', function() {
      reset();
    });

    $rootScope.$on('$ionicView.afterEnter', function() {
      reset();
    });
	})
	.controller('StartupCtrl', function($scope, $state, $timeout, utils) {
		$scope.goHome = function() {
			utils.disableBack();
			$state.go('tabs.home');
		};
	})
	.controller('InterestCouponCtrl', function($scope, $ionicHistory, utils) {
		$scope.close = function() {
			utils.disableBack();
			$ionicHistory.goBack();
		};
	})
	.controller('TosCtrl', function($scope, $state, userConfig, localStorageService, orderService) {
		var accountInfo = userConfig.getAccountInfo();
		$scope.userInfo = {
			realname: accountInfo.realname,
			id: accountInfo.idnum,
			mobile: accountInfo.mobilenum
		};

		$scope.current = localStorageService.get('subjectDetail');

		if($state.current.name === 'tabs.tos') {
			var amount = orderService.order && orderService.order.amount;
			$scope.current.buy_records = [
				{
					date: moment().format('YYYY-MM-DD HH:mm:ss'),
					invest: amount
				}
			]
			$scope.current.invest = amount;
		}

	})
	.controller('RetrieveTxPwdCtrl', function($scope, $state, userConfig, UserApi, toaster, md5, $ionicHistory, $timeout, utils) {
		var sessionId = userConfig.getSessionId();
		var mobile = userConfig.getAccountInfo().mobilenum;
		var resendCountdown = utils.resendCountdown($scope);
		$scope.invalidPassword = false;
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
	

