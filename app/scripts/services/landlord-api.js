'use strict';

angular.module('landlordApp')
	.service('LandlordApi', function($http, md5, utils, serverConfig){
		var server = utils.getServerHost() + '/msapi',
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
	})