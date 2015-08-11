'use strict';

angular.module('landlordApp')
	.service('UserApi', function($http, md5, utils, serverConfig) {
		var server = serverConfig.url,
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

		this.register = function(mobile, vcode, password, sessionId, borrowtype, approach, amId) {
			return $http({
				method: 'POST',
				url: server + '/user/register',
				headers: headers,
				data: utils.param({
					mobile: mobile,
					validatemobile: vcode,
					password: password,
					sessionId: sessionId,
					borrowtype: borrowtype || '理财',
					approach: approach || 'dfd',
					am_id: amId || 'dfd'
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
		};

		this.updateKycInfo = function(sessionId, realname, idNo, mobile) {
			return $http({
				method: 'POST',
				url: server + '/qactivity/updateMFDByMid',
				headers: headers,
				data: utils.param({
					sessionId: sessionId,
					real_name: realname,
					id_num: idNo,
					mobile: mobile
				})
			})
		};

		this.doKyc = function(sessionId, realname, idNo) {
			return $http({
				method: 'POST',
				url: server + '/user/degreecard',
				headers: headers,
				data: utils.param({
					sessionId: sessionId,
					myName: realname,
					myCard: idNo
				})
			});
		};

		this.sendSmsForRetrievePassword = function(mobile) {
			return $http({
				method: 'POST',
				url: server + '/user/sendValidateMobile',
				headers: headers,
				data: utils.param({
					mobilenum: mobile
				})
			});
		};

		this.findPassword = function(mobile, vcode, idNo) {
			return $http({
				method: 'POST',
				url: server + '/user/findPassword',
				headers: headers,
				data: utils.param({
					mobilenum: mobile,
					validation: vcode,
					idCard: idNo
				})
			});
		};

		this.changeFindPassword = function(sessionId, password) {
			return $http({
				method: 'POST',
				url: server + '/user/changeFindPassword',
				headers: headers,
				data: utils.param({
					sessionId: sessionId,
					password: password
				})
			});
		};

		this.changeFindPassword = function(sessionId, password) {
			return $http({
				method: 'POST',
				url: server + '/user/changeFindPassword',
				headers: headers,
				data: utils.param({
					sessionId: sessionId,
					password: password
				})
			});
		};

		this.feedback = function(sessionId, content) {
			return $http({
				method: 'POST',
				url: server + '/user/feedBack',
				headers: headers,
				data: utils.param({
					sessionId: sessionId,
					suggestion: content
				})
			});
		};


	})