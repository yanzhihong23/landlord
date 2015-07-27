'use strict';

angular.module('landlordApp')
	.service('couponService', function(LandlordApi, userConfig, localStorageService) {
		this.coupons = {
			cash: [],
			interest: []
		};

		this.selected = {
			cash: null,
			interest: null
		};

		var self = this,
				subjectDetail = localStorageService.get('subjectDetail'),
				sessionId = userConfig.getSessionId(),
				key;

		if(subjectDetail) {
			key = subjectDetail.subject.id;
		}

		var init = function() {
			LandlordApi.getCouponList(sessionId, key, 1)
				.success(function(data) {
					var data = data.data;
					var filter = function(obj) {
						return {
							code: obj.uv_code,
							id: obj.uv_id,
							value: ~~obj.value,
							minimum: +obj.minimum,
							sum: obj.uv_code + ':' + obj.uv_id + ':' + obj.value
						};
					};

					if(data.coupon && data.coupon.length) {
						self.coupons.cash = data.coupon.map(filter);
					}

					if(data.interest && data.interest.length) {
						self.coupons.interest = data.interest.map(filter);
					}

				});
		};

		init();
	})