'use strict';

angular.module('landlordApp')
	.controller('AccountCtrl', function($scope, $rootScope, md5, $state, UserApi, userConfig, utils, toaster, $interval, $timeout, $ionicLoading) {
		var resendCountdown = utils.resendCountdown($scope);
		$scope.account = {};
		$scope.clicked = false;
		$scope.invalidPassword = false;

		$scope.backToHome = function() {
			utils.disableBack();
  		$state.go('tabs.home');
  	};

		$scope.passwordValidate = function(password) {
      $scope.invalidPassword = !utils.isPasswordValid(password);
		};

		$scope.login = function() {
  		var username = $scope.account.phone;
  		var password = md5.createHash($scope.account.password || '');

  		$ionicLoading.show();
  		UserApi.login(username, password)
  			.success(function(data, status, headers, config) {
  				$ionicLoading.hide();
					if(data.flag === 1) {
						userConfig.setAccountInfo(data.data);
						// clear password
						$scope.account.password = null;

						payPasswordCheck();

						userConfig.setUser({
							username: username,
							password: password
						});
					} else {
						toaster.pop('error', data.msg);
					}
				});
		};

		$scope.sendSms = function(resend) {
			$scope.clicked = true;
			UserApi.sendSms($scope.account.phone)
				.success(function(data, status, headers, config) {
					$scope.clicked = false;
	  			if(data.flag === 1) {
	  				$scope.account.sessionId = data.data.session_id;
	  				!resend && $state.go('account.register');
	  				toaster.pop('success', '短信验证码发送成功');
	  				resendCountdown();
	  			} else if(data.flag === 6) {
	  				!resend && $state.go('account.login');
	  			} else if(data.flag === 8) {
	  				toaster.clear();
	  				toaster.pop('error', data.msg);
	  			}
	  		});

		};

		$scope.resendSms = function() {
			$scope.sendSms(true);
		};

		$scope.register = function() {
			var account = $scope.account;
			if(!$scope.clicked) {
				$scope.clicked = true;
				$ionicLoading.show();
	  		UserApi.register(account.phone, account.vcode, account.password, account.sessionId)
	  			.success(function(data, status, headers, config) {
	  				$ionicLoading.hide();
		  			if(data.flag === 1) {
		  				userConfig.setAccountInfo(data.data);
		  				toaster.pop('success', data.msg);
		  				payPasswordCheck();

		  				userConfig.setUser({
								username: account.phone,
								password: md5.createHash(account.password)
							});
							// clear password
							$scope.account.password = null;
		  			} else {
		  				toaster.pop('error', data.msg);
		  			}
		  			$scope.clicked = false;
		  		});
			}
  		
		};

		$scope.setPayPassword = function() {
			var password = md5.createHash($scope.account.payPassword || '');
			if(!$scope.clicked) {
				$scope.clicked = true;
				$ionicLoading.show();
				UserApi.setPayPassword(userConfig.getSessionId(), password)
					.success(function(data) {
						$ionicLoading.hide();
						if(data.flag === 1) {
							toaster.pop('success', data.msg);
							$rootScope.$broadcast('loginSuc');
						} else {
							toaster.pop('error', data.msg);
						}
						$scope.clicked = false;
					});
			}
			
		};

		var payPasswordCheck = function() {
			var accountInfo = userConfig.getAccountInfo();
			if(accountInfo && !accountInfo.is_pay_password) {
				utils.disableBack();
				$state.go('account.setPayPassword');
			} else {
				$rootScope.$broadcast('loginSuc');
				// utils.disableBack();
				// $state.go('tabs.home');
			}
		};
	})
	.controller('RetrievePasswordCtrl', function($scope, UserApi, toaster, userConfig, md5, utils, $ionicLoading) {
		var resendCountdown = utils.resendCountdown($scope);
		$scope.sendRetrieveSms = function() {
			UserApi.sendSmsForRetrievePassword($scope.account.phone)
				.success(function(data) {
					if(data.flag === 1) {
						resendCountdown();
						toaster.pop('success', data.msg);
					} else {
						toaster.pop('error', data.msg);
					}
				});
		};

		$scope.changePassword = function() {
			$ionicLoading.show();
			UserApi.findPassword($scope.account.phone, $scope.account.retrieveVcode, $scope.account.idNo || '')
				.success(function(data) {
					$ionicLoading.hide();
					if(data.flag === 5) {
						var password = md5.createHash($scope.account.newPassword);
						UserApi.changePassword(data.data.session_id, password)
							.success(function(data) {
								if(data.flag === 3) {
									toaster.pop('success', data.msg);
									userConfig.setUser({
										username: $scope.account.phone,
										password: password
									}, true); // broadcast login success

									// clear form, reset data
									$scope.account.retrieveVcode = null;
									$scope.account.newPassword = null;
									$scope.resendCountdown = 0;
								} else {
									toaster.pop('error', data.msg);
								}
							});
					} else {
						toaster.pop('error', data.msg);
					}
				});
			
		}
	})
	