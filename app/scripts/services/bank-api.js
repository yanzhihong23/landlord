'use strict';

angular.module('landlordApp')
	.service('BankApi', function($http, md5, utils, userConfig) {
		var server = utils.getServerHost() + '/msapi',
				v = 'm.nonobank.com/msapi/'+ utils.getDate(),
				vMd5 = md5.createHash(v),
				headers = {'Authorization': vMd5,'Content-Type': 'application/x-www-form-urlencoded'};

		this.getBankListForKQ = function(sessionId) {
			return $http({
				method: 'POST',
				url: server + '/bank/getBankListForKQ',
				headers: headers,
				data: utils.param({
					sessionId: sessionId
				})
			});
		};

		this.withdraw = function(sessionId, amount, bankId) {
			return $http({
				method: 'POST',
				url: server + '/bank/withdraw',
				headers: headers,
				data: utils.param({
					sessionId: sessionId,
					price: amount,
					bankId: bankId
				})
			});
		};

		this.getWithdrawList = function(sessionId, pageSize, pageNumber) {
			return $http({
				method: 'POST',
				url: server + '/bank/withdrawlist',
				headers: headers,
				data: utils.param({
					sessionId: sessionId,
					pageSize: pageSize,
					pageNumber: pageNumber
				})
			});
		};
	})