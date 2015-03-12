'use strict';

angular.module('landlordApp')
	.service('UserApi', function($http, md5, utils) {
		var server = 'https://m-test.nonobank.com/msapi',
		// var server = 'http://api.nonobank.com/msapi',
				v = 'm.nonobank.com/msapi/'+ utils.getDate(),
				vMd5 = md5.createHash(v),
				headers = {'Authorization': vMd5,'Content-Type': 'application/x-www-form-urlencoded'};

		this.sendSms = function(phone) {
			return $http({
				method: 'POST',
				url: server + '/user/sendMessage',
				headers: headers,
				data: utils.param({
					phone: phone
				})
			});
		};

		this.login = function(username, password) {
			return $http({
				method: 'POST',
				url: server + '/user/login',
				headers: headers,
				data: utils.param({
					username: username,
					password: password
				})
			}); 
		};

		this.logout = function(sessionId) {
			return $http({
				method: 'POST',
				url: server + '/user/logout',
				headers: headers,
				data: utils.param({
					sessionId: sessionId
				})
			});
		}

		this.register = function(mobile, vcode, password, sessionId, borrowtype) {
			return $http({
				method: 'POST',
				url: server + '/user/register',
				headers: headers,
				data: utils.param({
					mobile: mobile,
					validatemobile: vcode,
					password: password,
					sessionId: sessionId,
					borrowtype: borrowtype || '理财'
				})
			}); 
		};

		this.generateOrderNo = function(sessionId) {
			return $http({
				method: 'POST',
				url: server + '/user/generateKQMobileOrderNo',
				headers: headers,
				data: utils.param({
					sessionId: sessionId
				})
			});
		};

		this.getBoundBankList = function(sessionId) {
			return $http({
				method: 'POST',
				url: server + '/user/getFinaceBankAccountsForKQ',
				headers: headers,
				data: utils.param({
					sessionId: sessionId
				})
			});
		};

		this.setPayPassword = function(sessionId, password) {
			return $http({
				method: 'POST',
				url: server + '/user/savePayPassword',
				headers: headers,
				data: utils.param({
					sessionId: sessionId,
					newZFPwd: password
				})
			});
		};

		this.changePayPassword = function(sessionId, oldPassword, newPassword) {
			return $http({
				method: 'POST',
				url: server + '/user/changePayPassword',
				headers: headers,
				data: utils.param({
					sessionId: sessionId,
					oldZFPwd: oldPassword,
					newZFPwd: newPassword
				})
			});
		};

		this.retrievePayPassword = function(sessionId, vcode, newPassword) {
			return $http({
				method: 'POST',
				url: server + '/user/saveNewPayPassword',
				headers: headers,
				data: utils.param({
					sessionId: sessionId,
					validCode: vcode,
					newZFPwd: newPassword
				})
			});
		};

		this.sendSmsForRetrievePayPassword = function(sessionId, mobile) {
			return $http({
				method: 'POST',
				url: server + '/user/sendMobileMessageForPay',
				headers: headers,
				data: utils.param({
					sessionId: sessionId,
					mobile: mobile
				})
			});
		}


	})