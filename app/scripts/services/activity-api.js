'use strict';

angular.module('landlordApp')
	.service('ActivityApi', function($http, md5, utils, userConfig) {
		var server = utils.getServerHost() + '/msapi',
				v = 'm.nonobank.com/msapi/'+ utils.getDate(),
				vMd5 = md5.createHash(v),
				headers = {'Authorization': vMd5,'Content-Type': 'application/x-www-form-urlencoded'};

		this.getEnvoyInfo = function(sessionId) {
			return $http({
				method: 'POST',
				url: server + '/activity/landlordEnvoyInf',
				headers: headers,
				data: utils.param({
					sessionId: sessionId
				})
			});
		};
	})