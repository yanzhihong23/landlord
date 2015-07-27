'use strict';

angular.module('landlordApp')
	.service('orderService', function() {
		return {
			subject: null,
			order: null
		}
	})