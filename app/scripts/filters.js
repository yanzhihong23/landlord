'use strict';

angular.module('landlordApp')
	.filter('phone', function() {
		return function(number) {
			if(isNaN(number)) {
				return '';
			} else {
				number += '';
				return number.substr(0,3) + '****' + number.substr(-4);
			}
		};
	})
	.filter('moment', function() {
		return function(date, token) {
			return moment(date).format(token);
		};
	})