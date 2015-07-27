'use strict';

angular.module('landlordApp')
	.factory('utils', function($ionicHistory, $timeout, $ionicPopup) {
		return {
			passwordPattern: /^(?!\d+$|[a-zA-Z]+$|[\W-_]+$)[\s\S]{6,16}$/,
			param: function(obj) {
				var str = [];
        for(var p in obj) {
        	str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
        }
        
        return str.join("&");
			},
			getDate: function(dateObj) {
				var now = dateObj ? new Date(dateObj) : new Date();
				var year = now.getFullYear();
				var month = now.getMonth() + 1;
				var date = now.getDate();
				var appendZero = function(obj) {
					return (obj < 10 ? '0' : '') + obj;
				};
				
				return year + '-' + appendZero(month) + '-' + appendZero(date);
			},
			addMonth: function(dateObj, num) {
				var currentMonth = dateObj.getMonth();
		    dateObj.setMonth(dateObj.getMonth() + num)

		    if (dateObj.getMonth() != ((currentMonth + num) % 12)){
		        dateObj.setDate(0);
		    }
		    return dateObj;
			},
			disableBack: function() {
				$ionicHistory.nextViewOptions({
				  disableAnimate: false,
				  disableBack: true
				});
			},
			goBack: function(depth) {
				$ionicHistory.goBack(depth);
			},
			isPasswordValid: function(password) {
				var minMaxLength = /^[\s\S]{6,16}$/,
	        letter = /[a-zA-Z]/,
	        number = /[0-9]/,
	        special = /[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/,
	        count = 0;
	      if(minMaxLength.test(password)) {
	      	letter.test(password) && count++;
	      	number.test(password) && count++;
	      	special.test(password) && count++;
	      }

	      return count >= 2;
			},
			resendCountdown: function($scope) {
				$scope.resendCountdown = 0;
				
				return function() {
					$scope.resendCountdown = 60;
					var countdown = function() {
					  if($scope.resendCountdown > 0) {
					    $scope.resendCountdown += -1;
					    $timeout(countdown, 1000);
					  }
					};
					countdown();
				};
			},
			alert: function(obj) {
				var alertPopup = $ionicPopup.alert({
				  title: obj.title || '温馨提示',
				  cssClass: obj.cssClass || 'text-center',
				  subTitle: obj.subTitle || '',
				  template: obj.content || '',
				  templateUrl: obj.contentUrl || '',
				  okText: obj.okText || '确认',
				  okType: obj.okType || 'button-energized'
				});
				alertPopup.then(function(res) {
					obj.callback && obj.callback();
				});
			},
			confirm: function(obj) {
				var confirmPopup = $ionicPopup.confirm({
				  title: obj.title || '温馨提示',
				  template: obj.content || '',
				  cssClass: obj.cssClass || 'text-center',
				  okText: obj.okText || '确认',
				  okType: obj.okType || 'button-energized',
				  cancelText: obj.cancelText || '取消'
				});
				confirmPopup.then(function(res) {
					if(res) {
						obj.onOk && obj.onOk();
					} else {
						obj.onCancel && obj.onCancel();
					}
				});
			}
		}
	})
	.service('appConfig', function(localStorageService) {
		this.setVersion = function(version) {
			localStorageService.add('version', version);
		};

		this.getVersion = function() {
			return localStorageService.get('version');
		};
	})
	.service('userConfig', function(localStorageService, UserApi, $interval, $rootScope, $state, $ionicHistory) {
		var self = this;
		var auto = null;

		this.isLogined = function() {
			return localStorageService.get('isLogined') === 'true';
		};

		this.setLoginStatus = function(isLogined) {
			localStorageService.add('isLogined', isLogined);
		};

		this.setSessionId = function(sessionId) {
			localStorageService.add('sessionId', sessionId);
		};

		this.getSessionId = function() {
			return localStorageService.get('sessionId');
		};

		this.setGesture = function(gesture) {
			var gestures = localStorageService.get('gestures') || [];
			var user = localStorageService.get('user');
			var stored = false;

			for(var i=0, len=gestures.length; i<len; i++) {
				if(gestures[i].username === user.username) {
					stored = true;
					if(!gesture) { // disable
						gestures.splice(i, 1);
						break;
					} else { // change
						gestures[i].gesture = gesture;
						break;
					}
				}
			}

			if(!stored) { // new
				gestures.push({
					username: user.username,
					gesture: gesture
				});
			}

			localStorageService.add('gestures', gestures);
		};

		this.getGesture = function() {
			var gestures = localStorageService.get('gestures') || [];
			var user = localStorageService.get('user');
			for(var i=0, len=gestures.length; i<len; i++) {
				if(gestures[i].username === user.username) {
					return gestures[i].gesture;
				}
			}

			return null;
		};

		this.setAccountInfo = function(account) {
			$rootScope.isLogined = true;
			self.setLoginStatus(true);
			self.setSessionId(account && account.session_id);
			localStorageService.add('accountInfo', account);
		};

		this.getAccountInfo = function() {
			return localStorageService.get('accountInfo');
		};

		this.logout = function() {
			$rootScope.isLogined = false;
			localStorageService.remove('isLogined');
			localStorageService.remove('sessionId');
			localStorageService.remove('accountInfo');
			localStorageService.remove('user');
			localStorageService.remove('boundBankList');
			// localStorageService.clearAll();

			$state.go('tabs.info');
			$ionicHistory.clearHistory();
			$ionicHistory.clearCache();
		};

		this.setUser = function(user, broadcast) {
			localStorageService.add('user', user);
			if(broadcast) {
				autoLogin(true)
			} else {
				self.autoLogin();
			}
		};

		this.getUser = function() {
			return localStorageService.get('user');
		};

		function autoLogin(broadcast) {
			var user = localStorageService.get('user');
			if(user) {
				UserApi.login(user.username, user.password)
	  			.success(function(data, status, headers, config) {
						if(data.flag !== 1) {
							auto = null;
							self.logout();
						} else {
							self.setAccountInfo(data.data);
							if(broadcast) $rootScope.$broadcast('loginSuc');
							console.log('----------- autoLogin success -----------');
						}
					});
			}
		}

		this.autoLogin = function() {
			autoLogin();
			worker.postMessage('startTicker');
			worker.onmessage = function(evt) {
				autoLogin();
			}

			// if(!auto) {
			// 	auto = $interval(autoLogin, 1200000); // 20 min
			// }
		};
	})