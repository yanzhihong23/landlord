'use strict';

angular.module('landlordApp')
	.service('subjectService', function() {
		return {
			previews: [],
			refundPeriods: []
		};
	})