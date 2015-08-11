'use strict';

angular.module('landlordApp')
	.service('LandlordApi', function($http, md5, utils, serverConfig){
		var server = serverConfig.url,
				v = 'm.nonobank.com/msapi/'+ utils.getDate(),
				vMd5 = md5.createHash(v),
				headers = {'Authorization': vMd5,'Content-Type': 'application/x-www-form-urlencoded'};

		// get current landlord
		this.getLandlord = function() {
			return $http({
				method: 'GET',
				url: server + '/landlord/getLandlords',
				headers: headers
			});
		};

		

		this.getLandlordAccountInfo = function(sessionId) {
			return $http({
				method: 'POST',
				url: server + '/landlord/getLandlordAccountInfo',
				headers: headers,
				data: utils.param({
					sessionId: sessionId
				})
			});
		};

		this.getLandlordProfitDetail = function(sessionId, fpId) {
			return $http({
				method: 'POST',
				url: server + '/landlord/getLandlordProfitDetail',
				headers: headers,
				data: utils.param({
					sessionId: sessionId,
					fp_id: fpId
				})
			});
		};

		this.getCouponList = function(sessionId, key, type) {
			return $http({
				method: 'POST',
				url: server + '/landlord/dfdCouponList',
				headers: headers,
				data: utils.param({
					sessionId: sessionId,
					key: key,
					type: type
				})
			});
		};


		// ver 2.0
		this.getSubject = function(subjectId) {
			// subjectId = subjectId || '';

			return $http({
				method: 'POST',
				url: server + '/landlord_2/getSubject',
				headers: headers,
				data: utils.param({
					subject_id: subjectId || ''
				})
			});
		};

		this.getPastSubjectIds = function() {
			return $http({
				method: 'POST',
				url: server + '/landlord_2/getPastSubjectIds',
				headers: headers
			});
		};

		this.getAccountInfo = function(sessionId) {
			return $http({
				method: 'POST',
				url: server + '/landlord_2/getAccountInfo',
				headers: headers,
				data: utils.param({
					session_id: sessionId
				})
			});
		};

		this.getBalanceDetail = function(sessionId, length, offset) {
			return $http({
				method: 'POST',
				url: server + '/landlord_2/getBalanceDetail',
				headers: headers,
				data: utils.param({
					session_id: sessionId,
					length: length,
					offset: offset
				})
			});
		};

		this.getEarningHistory = function(sessionId, length, offset) {
			return $http({
				method: 'POST',
				url: server + '/landlord_2/getEarningHistory',
				headers: headers,
				data: utils.param({
					session_id: sessionId,
					length: length,
					offset: offset
				})
			});
		};

		this.getInvestedSubject = function(sessionId, subjectId) {
			return $http({
				method: 'POST',
				url: server + '/landlord_2/getInvestedSubject',
				headers: headers,
				data: utils.param({
					session_id: sessionId,
					subject_id: subjectId
				})
			});
		};

		this.reserveList = function() {
			return $http({
				method: 'POST',
				url: server + '/landlord_2/reserveList',
				headers: headers
			});
		};

		this.isInvestEnabled = function(sessionId, subjectId) {
			return $http({
				method: 'POST',
				url: server + '/landlord_2/isInvestEnabled',
				headers: headers,
				data: utils.param({
					session_id: sessionId,
					subject_id: subjectId
				})
			});
		}
	})