'use strict';

angular.module('landlordApp')
	.factory('httpInterceptor', function(toaster) {
		return {
			responseError: function(rejecton) {
				// toaster.pop('error', '网络连接超时');
			}
		}
	})
	.factory('utils', function($ionicHistory, $timeout) {
		return {
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
			}
		}
	})
	.service('userConfig', function(localStorageService, UserApi, $interval, $rootScope) {
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

		this.setAccountInfo = function(account) {
			self.setLoginStatus(true);
			self.setSessionId(account && account.session_id);
			localStorageService.add('accountInfo', account);
		};

		this.getAccountInfo = function() {
			return localStorageService.get('accountInfo');
		};

		this.logout = function() {
			localStorageService.clearAll();
		};

		this.setUser = function(user, broadcast) {
			localStorageService.add('user', user);
			if(broadcast) {
				autoLogin(true)
			} else {
				self.autoLogin();
			}
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