'use strict';

angular.module('landlordApp')
	.controller('PhoneCtrl', function($scope, $state, $ionicLoading, UserApi, toaster) {
		$scope.clicked = false;
		$scope.account = {};

		$scope.sendSms = function() {
			$scope.clicked = true;
			$ionicLoading.show();
			UserApi.sendSms($scope.account.phone)
				.success(function(data) {
					$scope.clicked = false;
	  			if(data.flag === 1) {
	  				$state.go('tabs.register', {phone: $scope.account.phone, sessionId: data.data.session_id});
	  				toaster.pop('success', '短信验证码发送成功');
	  			} else if(data.flag === 6) {
	  				$state.go('tabs.login', {phone: $scope.account.phone});
	  			} else if(data.flag === 8) {
	  				toaster.clear();
	  				toaster.pop('error', data.msg);
	  			}
	  		});
		};
	})
	.controller('RegisterCtrl', function($scope, $state, $rootScope, $stateParams, $ionicLoading, $ionicHistory, UserApi, userConfig, utils, md5, toaster) {
		var resendCountdown = utils.resendCountdown($scope),
				// phone = $stateParams.phone, 
				sessionId = $stateParams.sessionId;
		
		// init
		$scope.passwordPattern = utils.passwordPattern;
		$scope.account = {
			phone: $stateParams.phone
		};

		$scope.resendSms = function() {
			$scope.clicked = true;
			$ionicLoading.show();
			UserApi.sendSms($scope.account.phone)
				.success(function(data) {
					$scope.clicked = false;
	  			if(data.flag === 1) {
	  				sessionId = data.data.session_id;
	  				// toaster.pop('success', '短信验证码发送成功');
	  				resendCountdown();
	  			} else {
	  				utils.confirm({
	  					content: '您已经是大房东用户，去登录吧',
	  					onOk: function() {
	  						$state.go('tabs.login', {phone: $scope.account.phone});
	  					},
	  					onCancel: function() {
	  						$scope.account.phone = '';
	  					}
	  				})
	  			}
	  		});
		};

		$scope.register = function() {
			var account = $scope.account;
			if(!$scope.clicked) {
				$scope.clicked = true;
				$ionicLoading.show();
	  		UserApi.register(account.phone, account.vcode, account.password, sessionId)
	  			.success(function(data) {
	  				$ionicLoading.hide();
		  			if(data.flag === 1) {
		  				userConfig.setAccountInfo(data.data);
		  				// toaster.pop('success', data.msg);

		  				userConfig.setUser({
								username: account.phone,
								password: md5.createHash(account.password)
							});
							// clear password
							$scope.account.password = null;

							// $state.go('tabs.setPayPassword');
							$rootScope.$broadcast('loginSuc');
							$state.go('tabs.info');
							$ionicHistory.clearHistory();
							$ionicHistory.clearCache();
		  			} else if(data.flag === 4) { // wrong verify code
		  				utils.alert({
		  					content: data.msg,
		  					callback: function() {
		  						$scope.account.vcode = null;
		  					}
		  				});
		  			} else {
		  				toaster.pop('error', data.msg);
		  			}
		  			$scope.clicked = false;
		  		});
			}
		};

	})
	.controller('LoginCtrl', function($scope, $rootScope, $state, $stateParams, $ionicLoading, $ionicHistory, UserApi, userConfig, bankService, utils, md5, toaster) {
		$scope.account = {
			phone: $stateParams.phone
		};
		$scope.login = function() {
  		var username = $scope.account.phone;
  		var password = md5.createHash($scope.account.password || '');

  		$ionicLoading.show();
  		UserApi.login(username, password)
  			.success(function(data) {
					if(data.flag === 1) {
						var accountInfo = data.data;
						userConfig.setAccountInfo(accountInfo);
						bankService.update();
						// clear password
						$scope.account.password = null;

						if(accountInfo && !accountInfo.is_pay_password) {
							// utils.disableBack();
							// $state.go('tabs.setPayPassword');
						} else {
							$rootScope.$broadcast('loginSuc');
							$state.go('tabs.info');
							$ionicHistory.clearHistory();
							$ionicHistory.clearCache();
						}

						userConfig.setUser({
							username: username,
							password: password
						});
					} else if(+data.flag === 3) {
						utils.alert({
							content: '用户名或密码错误',
							callback: function() {
								$scope.account.password = null;
							}
						});
					} else {
						utils.alert({
							content: data.msg
						});
					}
				});
		};

		$scope.retrievePassword = function() {
			$state.go('tabs.retrievePassword', {phone: $scope.account.phone});
		};
	})
	.controller('SetPayPasswordCtrl', function($scope, $state, $rootScope, $ionicLoading, UserApi, userConfig, md5, utils, toaster) {
		$scope.account = {};
		$scope.clicked = false;

		$scope.passwordValidate = function(password) {
      $scope.invalidPassword = !utils.isPasswordValid(password);
		};

		$scope.setPayPassword = function() {
			var password = md5.createHash($scope.account.payPassword || '');
			if(!$scope.clicked) {
				$scope.clicked = true;
				$ionicLoading.show();
				UserApi.setPayPassword(userConfig.getSessionId(), password)
					.success(function(data) {
						if(data.flag === 1) {
							toaster.pop('success', data.msg);
							$rootScope.$broadcast('loginSuc');
							utils.disableBack();
							$state.go('tabs.home');
						} else {
							toaster.pop('error', data.msg);
						}
						$scope.clicked = false;
					});
			}
		};
	})
	.controller('RetrievePasswordCtrl', function($scope, $state, $stateParams, UserApi, toaster, userConfig, md5, utils, $ionicLoading) {
		var resendCountdown = utils.resendCountdown($scope);
		$scope.account = {phone: $stateParams.phone};

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
					if(data.flag === 5) {
						var password = md5.createHash($scope.account.newPassword);
						UserApi.changeFindPassword(data.data.session_id, password)
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

									$state.go('tabs.home');
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
	.controller('ChangePasswordCtrl', function($scope, userConfig, UserApi, utils, toaster, md5) {
		$scope.user = {
			key: '登录'
		};
		var user = userConfig.getUser(),
				password = user.password,
				sessionId = userConfig.getSessionId();

		$scope.submit = function() {
			var newPassword = md5.createHash($scope.user.newPassword);

			if($scope.user.newPassword !== $scope.user.confirm) {
				toaster.pop('error', '两次输入密码不一致！');
				$scope.user.mismatch = true;
				return;
			}
			
			if(md5.createHash($scope.user.password) !== password) {
				toaster.pop('error', '原密码输入错误!');
				$scope.user.oMismatch = true;
				return;
			}

			UserApi.changePassword(sessionId, password, newPassword)
				.success(function(data) {
					if(data.flag === 4) {
						toaster.pop('success', '登录密码修改成功！');
						user.password = newPassword;
						userConfig.setUser(user);
						utils.goBack();
					} else {
						toaster.pop('error', data.msg);
					}
				})
		};
	})
	.controller('ChangePayPasswordCtrl', function($scope, UserApi, userConfig, utils, md5, toaster) {
		var sessionId = userConfig.getSessionId();

		$scope.user = {
			key: '支付'
		};

		$scope.submit = function() {
			var password = md5.createHash($scope.user.password),
					newPassword = md5.createHash($scope.user.newPassword);

			if($scope.user.newPassword !== $scope.user.confirm) {
				toaster.pop('error', '两次输入密码不一致！');
				$scope.user.mismatch = true;
				return;
			}

			UserApi.changePayPassword(sessionId, password, newPassword)
				.success(function(data) {
					if(data.flag === 1) {
						toaster.pop('success', '支付密码修改成功！');
						utils.goBack();
					} else if(data.flag === 3) {
						$scope.user.oMismatch = true;
						toaster.pop('error', '原密码输入错误！');
					} else {
						toaster.pop('error', data.msg);
					}
				})
		}
	})
	.controller('ResetPayPasswordCtrl', function($scope, $stateParams, $rootScope, $ionicLoading, userConfig, utils, md5, UserApi) {
		var accountInfo = userConfig.getAccountInfo(),
				sessionId = userConfig.getSessionId(),
				resendCountdown = utils.resendCountdown($scope);

		$scope.passwordPattern = utils.passwordPattern;
		$scope.type = $stateParams.type === 'new' ? '设置' : '重置';
		$scope.user = {
			phone: accountInfo.mobilenum
		};

		$scope.sendSms = function() {
			$ionicLoading.show();
			UserApi.sendSmsForRetrievePayPassword(sessionId, $scope.user.phone)
				.success(function(data) {
					if(data.flag === 1) {
						resendCountdown();
					} else {
						utils.alert({content: data.msg});
					}
				});
		};

		$scope.submit = function() {
			$ionicLoading.show();
			var password = md5.createHash($scope.user.password);
			UserApi.retrievePayPassword(sessionId, $scope.user.vcode, password)
				.success(function(data) {
					if(data.flag === 1) {
						if($stateParams.type === 'new') {
							$rootScope.$broadcast('payPasswordSet');
							accountInfo.is_pay_password = true;
							userConfig.setAccountInfo(accountInfo);
						}
						utils.goBack();
					} else {
						utils.alert({content: data.msg});
					}
				});
		};
	})

