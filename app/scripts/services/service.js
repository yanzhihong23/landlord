'use strict';

angular.module('landlordApp')
	.service('serverConfig', function() {

	})
	.factory('utils', function($ionicHistory) {
		return {
			param: function(obj) {
				var str = [];
        for(var p in obj) {
        	str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
        }
        
        return str.join("&");
			},
			getDate: function() {
				var now = new Date();
				var year = now.getFullYear();
				var month = now.getMonth() + 1;
				var date = now.getDate();
				var appendZero = function(obj) {
					return (obj < 10 ? '0' : '') + obj;
				};
				
				return year + '-' + appendZero(month) + '-' + appendZero(date);
			},
			disableBack: function() {
				$ionicHistory.nextViewOptions({
				  disableAnimate: false,
				  disableBack: true
				});
			}
		}
	})
	.service('userConfig', function(localStorageService, UserApi, $interval) {
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
			// self.setLoginStatus(false);
			// self.setSessionId();
			// self.setAccountInfo();
		};

		this.setUser = function(user) {
			localStorageService.add('user', user);
			self.autoLogin();
		};

		function autoLogin() {
			var user = localStorageService.get('user');
			if(user) {
				UserApi.login(user.username, user.password)
	  			.success(function(data, status, headers, config) {
						if(data.flag !== 1) {
							auto = null;
							self.logout();
						} else {
							self.setAccountInfo(data.data);
						}
					});
			}
		}

		this.autoLogin = function() {
			autoLogin();
			if(!auto) {
				auto = $interval(autoLogin, 18000000); // 30 min
			}
		};
	})