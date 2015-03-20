'use strict';

angular.module('landlordApp')
	.controller('InfoCtrl', function($scope, $rootScope, userConfig, $state, LandlordApi, $filter, utils) {
  	if(!userConfig.isLogined()) {
  		$rootScope.$on('loginSuc', function(evt) {
  			utils.disableBack();
  			$state.go('account.info');
  		})

  		utils.disableBack();
  		$state.go('account.phone');
  	}

  	$scope.backToHome = function() {
			utils.disableBack();
  		$state.go('tabs.home');
  	};

  	$scope.goToTos = function() {
  		utils.disableBack();
  		$state.go('tabs.tos');
  	};

  	var init = function() {
  		LandlordApi.getLandlordAccountInfo(userConfig.getSessionId())
  			.success(function(data) {
  				$scope.$broadcast('scroll.refreshComplete');

  				$scope.investingItems = [];

  				if(data.flag === 1) {
  					data = data.data;
  					$scope.info = {
  						balance: data.balanceUsable || 0,
  						invest: data.invest || 0,
  						earnings: data.earnings || 0
  					}
  					$scope.showTip = !!data.balanceUsable;

  					// update balance
  					var accountInfo = userConfig.getAccountInfo();
  					accountInfo.balanceUsable = data.balanceUsable;
  					userConfig.setAccountInfo(accountInfo);

  					var investingItems = data.vipAccounts;
  					var idObj = {};
  					if(investingItems.length) {
  						for(var i=0; i<investingItems.length; i++) {
  							var id = investingItems[i].fp_id;
  							if(!idObj[id]) {
  								idObj[id] = 1;
  								LandlordApi.getLandlordProfitDetail(userConfig.getSessionId(), id)
  								.success(function(data) {
  									if(data.flag === 1) {
  										data = data.data;
  										var desc = '该笔投资正在匹配中...';
  										if(data.next_expect_ba.ba_expect) {
  											desc = data.next_expect_ba.ba_time_formate + ' 入账“房租” ' + $filter('currency')(data.next_expect_ba.ba_price, '') + '元 (' + (data.next_expect_ba.ba_expect + '/' + data.baList.length) + '期)';
  										}
  										var item = {
  											invest: data.invest/10000,
  											earnings: data.earnings || 0,
  											images: data.landlord_atts,
  											desc: desc,
  											endDate: data.baList.length && data.baList[data.baList.length-1].ba_time_formate,
  											showDesc: true
  										};

  										$scope.investingItems.push(item);
  									}
  								});
  							}
  						}
  					}
  				}
  			});
		};

		$scope.logout = function() {
			userConfig.logout();
			utils.disableBack();
			$state.go('account.phone');
			$rootScope.$on('loginSuc', function() {
				utils.disableBack();
				$state.go('tabs.home');
			})
		}

		$scope.doRefresh = function() {
			init();
		};

		init();
	})
	.controller('LoginCtrl', function($scope, userConfig, $state) {

	})
	.controller('AccountCtrl', function($scope, $rootScope, md5, $state, UserApi, userConfig, utils, toaster, $interval, $timeout) {
		$scope.account = {};
		$scope.resendCountdown = 0;
		$scope.clicked = false;
		$scope.invalidPassword = false;

		$scope.passwordValidate = function(password) {
      $scope.invalidPassword = !utils.isPasswordValid(password);
		};

		$scope.login = function() {
  		var username = $scope.account.phone;
  		var password = md5.createHash($scope.account.password || '');

  		UserApi.login(username, password)
  			.success(function(data, status, headers, config) {
					if(data.flag === 1) {
						userConfig.setAccountInfo(data.data);
						// toaster.pop('success', data.msg);
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
	  		UserApi.register(account.phone, account.vcode, account.password, account.sessionId)
	  			.success(function(data, status, headers, config) {
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
				UserApi.setPayPassword(userConfig.getSessionId(), password)
					.success(function(data) {
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

		var resendCountdown = function() {
		  $scope.resendCountdown = 60;
		  var countdown = function() {
		    if($scope.resendCountdown > 0) {
		      $scope.resendCountdown += -1;
		      $timeout(countdown, 1000);
		    }
		  };
		  countdown();
		};
	})