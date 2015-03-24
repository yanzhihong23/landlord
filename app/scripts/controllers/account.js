'use strict';

angular.module('landlordApp')
	.controller('InfoCtrl', function($scope, $rootScope, userConfig, $state, LandlordApi, $filter, utils) {
		$scope.isNoRecord = false;

  	if(!userConfig.isLogined()) {
  		$rootScope.$on('loginSuc', function(evt) {
  			init();
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

  	$scope.recharge = function() {
  		$state.go('account.recharge');
  	};

  	$scope.goToTos = function(index) {
  		var item = $scope.items[index];
  		$rootScope.landlord = {
  			total: item.invest,
  			fp_title: item.finance_plan.fp_title,
  			fp_price_max: item.finance_plan.fp_price_max,
  			fp_start_date: item.finance_plan.fp_start_date,
  			fp_end_date: utils.getDate(utils.addMonth(new Date(item.finance_plan.fp_start_date), ~~item.finance_plan.fp_expect)),
  			fp_expect: item.finance_plan.fp_expect,
  			fp_rate_min: item.finance_plan.fp_rate_min,
  			fp_publish_date: utils.getDate(item.finance_plan.fp_publish_date),
  			va_extno: item.vipAccounts[0].va_extno,
  			joinDate: utils.getDate(item.vipAccounts[0].vfInfo[0].vf_service_time)
  		}
  		utils.disableBack();
  		$state.go('tabs.tos');
  	};

  	var init = function() {
  		LandlordApi.getLandlordAccountInfo(userConfig.getSessionId())
  			.success(function(data) {
  				$scope.$broadcast('scroll.refreshComplete');

  				$scope.investingItems = [];
  				$scope.items = [];

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
  					$rootScope.$broadcast('balanceUpdated');

  					var investingItems = data.vipAccounts;
  					var idObj = {};
  					if(investingItems.length) {
  						$scope.isNoRecord = false;
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
  										$scope.items.push(data);
  									}
  								});
  							}
  						}
  					} else {
  						$scope.isNoRecord = true;
  					}
  				}
  			});
		};

		$scope.logout = function() {
			userConfig.logout();
			utils.disableBack();
			$state.go('account.phone');

			var callMeOffFn = $rootScope.$on('loginSuc', function() {
				init();
				utils.disableBack();
				$state.go('account.info');
				callMeOffFn(); // deregister the listener
			});
		}

		$scope.doRefresh = function() {
			init();
		};

		$rootScope.$on('landlordUpdated', function() {
			init();
		});

		init();
	})
	.controller('AccountCtrl', function($scope, $rootScope, md5, $state, UserApi, userConfig, utils, toaster, $interval, $timeout, $ionicLoading) {
		$scope.account = {};
		$scope.resendCountdown = 0;
		var resendCountdown = utils.resendCountdown($scope);
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
	.controller('RetrievePasswordCtrl', function($scope, UserApi, toaster, userConfig, md5, utils) {
		$scope.resendCountdown = 0;
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
			UserApi.findPassword($scope.account.phone, $scope.account.retrieveVcode, $scope.account.idNo)
				.success(function(data) {
					if(data.flag === 5) {
						UserApi.changePassword(data.data.session_id, $scope.account.newPassword)
							.success(function(data) {
								if(data.flag === 3) {
									toaster.pop('success', data.msg);
									var password = md5.createHash($scope.account.newPassword);
									userConfig.setUser({
										username: $scope.account.phone,
										password: md5.createHash($scope.account.newPassword)
									}, true); // broadcast login success
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
	.controller('RechargeCtrl', function($scope, $rootScope, $state, UserApi, PayApi, userConfig, md5, utils, toaster, $ionicLoading, $ionicActionSheet) {
		var accountInfo,
				sessionId,
				mId,
				payMode = 1, // bank
				payCode = 2, // recharge
				extRefNo,
				storablePan,
				token;

		$scope.resendCountdown = 0;
		var resendCountdown = utils.resendCountdown($scope);

		$scope.bankCards = [];
		$scope.recharge = {};

		var init = function() {
			accountInfo = userConfig.getAccountInfo();
			sessionId = userConfig.getSessionId();
			mId = accountInfo.m_id;
			$scope.balanceUsable = accountInfo.balanceUsable;
			$scope.recharge.name = accountInfo.realname;
			$scope.recharge.id = accountInfo.idnum;
			$scope.recharge.phone = accountInfo.mobilenum;

			if(accountInfo.realname && accountInfo.idnum) {
				$scope.disableIdEdit = true;
			}

			UserApi.generateOrderNo(sessionId)
				.success(function(data) {
					if(data.flag === 1) {
						extRefNo = data.data;
					}
				});
				
			UserApi.getBoundBankList(sessionId)
				.success(function(data) {
					if(data.flag === 1) {
						var arr = data.data;
						for(var i=0; i<arr.length; i++) {
							var card = {
								value: arr[i].kuaiq_short_no, // storablePan
								text: arr[i].banks_cat + '（尾号' + arr[i].banks_account.substr(-4) + '）'
							};
							
						}
						$scope.bankCards.push(card);
					} 

					$scope.bankCards.push({
						text: '添加银行卡',
						value: 'add'
					});

					$scope.recharge.bankCard = $scope.bankCards[0].value;
					$scope.recharge.bankCardShow = $scope.bankCards[0].text;
					console.log($scope.bankCards);
				}); 
		};

		// get bank list
		PayApi.getBankListForKQ(userConfig.getSessionId())
			.success(function(data) {
				if(data.flag === 1) {
					$scope.recharge.bankCode = "1"; // icbc as default
					$scope.bankList = data.data;
				}
			});

		$scope.$watch('recharge.bankCard', function(val, oldVal) {
			if(val !== oldVal && val === 'add') {
				// $state.go('account.rechargeNew');
			}
		});

		$scope.selectBank = function() {
			if($scope.bankCards.length === 1) {
				$state.go('account.rechargeNew');
				return;
			}

			var hideSheet = $ionicActionSheet.show({
				buttons: $scope.bankCards,
				cancelText: '取消',
				buttonClicked: function(index) {
					if(index === $scope.bankCards.length-1) {
						$state.go('account.rechargeNew');
					} else {
						$scope.recharge.bankCard = $scope.bankCards[index].value;
						hideSheet();
					}
	     	}
			})
		};

		$scope.quickRecharge = function() {
			$ionicLoading.show();
			var password = md5.createHash($scope.recharge.password);
			PayApi.quickPay(mId, sessionId, extRefNo, $scope.recharge.bankCard, $scope.recharge.amount, null, null, payMode, payCode, password)
				.success(function(data) {
					$ionicLoading.hide();
					if(data.flag === 1) {
						toaster.pop('success', data.msg);
						$rootScope.$broadcast('landlordUpdated');
						$state.go('account.info');
					} else {
						toaster.pop('error', data.msg);
					}
				})
		};

		$scope.sendSms = function() {
			$scope.clicked = true;
			PayApi.getPayVcode(
				extRefNo,
				$scope.recharge.name,
				$scope.recharge.id,
				0, mId,
				$scope.recharge.cardNo,
				$scope.recharge.phone,
				$scope.recharge.amount,
				null,
				null,
				payCode, payMode)
			.success(function(data) {
				$scope.clicked = false;
				if(data.flag === 1) {
					resendCountdown();
					storablePan = data.storablePan;
					token = data.token;
					toaster.pop('success', data.msg);
				} else {
					toaster.pop('error', data.msg);
				}
			});
		};

		$scope.rechargeNew = function() {
			$ionicLoading.show();

			// update kyc info
			if(!accountInfo.realname) {
				UserApi.updateKycInfo(sessionId, $scope.recharge.name, $scope.recharge.id, accountInfo.mobilenum)
					.success(function(data) {
						if(data.flag === 1) {
							userConfig.autoLogin(); // get new account info
							pay();
						} else {
							toaster.pop('error', data.msg);
						}
					});
			} else {
				pay();
			}

		};

		var pay = function() {
			PayApi.bindAndPay(mId, sessionId, 
				extRefNo, storablePan, 
				$scope.recharge.amount, 
				$scope.recharge.vcode, 
				token, 
				payMode, 
				payCode, 
				null, 
				null, 
				$scope.recharge.name, 
				$scope.recharge.id, 
				$scope.recharge.cardNo, 
				$scope.recharge.bankCode, 
				$scope.recharge.phone)
			.success(function(data) {
				$ionicLoading.hide();
				if(data.flag === 1) {
					toaster.pop('success', data.msg);
					$rootScope.$broadcast('landlordUpdated');
					$state.go('account.info');
				} else {
					toaster.pop('error', data.msg);
				}
			});
		};

		init();
	})