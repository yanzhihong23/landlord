'use strict';

angular.module('landlordApp')
	.controller('SettingCtrl', function($scope, $rootScope, $state, userConfig, $timeout) {
		var accountInfo = userConfig.getAccountInfo();
		$scope.info = {
			payPwdSet: accountInfo.is_pay_password,
			gesture: !!userConfig.getGesture()
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