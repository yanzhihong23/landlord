'use strict';

angular.module('landlordApp')
	.service('subjectService', function(LandlordApi, utils) {
		var self = this;

		return {
			previews: [],
			refundPeriods: []
		};
	})