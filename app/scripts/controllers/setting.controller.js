'use strict';

angular.module('landlordApp')
	.controller('SettingCtrl', function($scope, $rootScope, $state, userConfig, $ionicHistory, $timeout, utils, bankService) {
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
			payPwdSet: accountInfo.is_pay_password,
			gesture: !!userConfig.getGesture()
		}

		$scope.logout = function() {
      $ionicHistory.clearHistory();
      $ionicHistory.clearCache();

			userConfig.logout();
			utils.disableBack();
			$state.go('tabs.home');
		};

		$scope.toggleGesture = function() {
			$timeout(function() {
				if($scope.info.gesture) {
					$state.go('tabs.gesture', {action: 'set'});
				} else {
					$state.go('tabs.gesture', {action: 'disable'});
				}
				$scope.info.gesture = !$scope.info.gesture;
			}, 350); // time for toggle animation
		};

		$scope.changeGesture = function() {
			$state.go('tabs.gesture', {action: 'change'});
		};

		$rootScope.$on('toggleGesture', function(evt, val) {
			$scope.info.gesture = val;
			$scope.$apply();
		});
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
			UserApi.updateKycInfo(sessionId, $scope.kyc.name, $scope.kyc.id, accountInfo.mobilenum)
				.success(function(data) {
					if(data.flag === 1) {
						userConfig.autoLogin(); // get new account info
						utils.goBack();
					} else {
						toaster.pop('error', data.msg);
					}
				});
		}
	})
	.controller('GestureCtrl', function($scope, $state, $stateParams, $rootScope, userConfig, utils, md5) {
		var title, msg, MSG = {
			SET: '请滑动设置个性手势，最少连接4个点',
			CONFIRM: '请再次确认您的个性手势',
			INVALID: '至少选择4个点，请重新绘制！',
			MISMATCH: '两次输入不一致，请重新绘制！',
			ORIGINAL: '请绘制原解锁图案',
			NEW: '请绘制新解锁图案',
			WRONG: '输入错误，请重新输入'
		}

		var resetCanvas = function(msg) {
			$scope.gesture.msg = msg;
			$scope.$apply();
			$scope.$broadcast('reset');
		};

		var setNew = function() {
			var newGesture;
			return function(val) {
				if(!newGesture) {
					newGesture = val.join('->');
					resetCanvas(MSG.CONFIRM);
				} else {
					if(val.join('->') === newGesture) {
						$rootScope.$broadcast('toggleGesture', true);
						userConfig.setGesture(md5.createHash(val.join('->')));
						utils.goBack();
					} else {
						resetCanvas(MSG.MISMATCH);
					}
				}
			}
		};

		var setInit = function() {
			var set = setNew();
			$scope.$on('gesture', function(evt, val) {
				set(val);
			});
		};

		var changeInit = function() {
			var original = userConfig.getGesture();
			var matchOriginal = false;
			var set = setNew();
			$scope.$on('gesture', function(evt, val) {
				if(!matchOriginal) {
					if(md5.createHash(val.join('->')) === original) {
						matchOriginal = true;
						resetCanvas(MSG.NEW);
					} else {
						resetCanvas(MSG.WRONG);
					}
				} else {
					set(val);
				}
			});
		};

		var disableInit = function() {
			var original = userConfig.getGesture();
			$scope.$on('gesture', function(evt, val) {
				if(md5.createHash(val.join('->')) === original) {
					$rootScope.$broadcast('toggleGesture', false);
					userConfig.setGesture();
					utils.goBack();
				} else {
					resetCanvas(MSG.WRONG);
				}
			});
		};

		if(/set/.test($stateParams.action)) {
			title = '设置手势密码';
			msg = MSG.SET;
			setInit();
		} else if(/change/.test($stateParams.action)) {
			title = '修改手势密码';
			msg = MSG.ORIGINAL;
			changeInit();
		} else {
			title = '关闭手势密码';
			msg = MSG.ORIGINAL;
			disableInit();
		}

		$scope.gesture = {
			title: title,
			msg: msg
		};

		$scope.$on('invalid', function(evt) {
			resetCanvas(MSG.INVALID);
		});

	})


