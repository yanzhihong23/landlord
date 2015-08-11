'use strict';

angular.module('landlordApp')
	.service('accountService', function($rootScope, LandlordApi, userConfig) {
		var self = this;

		this.init = function() {
			this.invest = 0;
			this.recharge = 0;
			this.withdraw = 0;
			// export balance
			this.balance = {
				total: 0,
				available: 0,
				frozen: 0
			};

			this.earnings = {
				total: 0,
				current_month: 0,
				next_month: 0
			};
			// export investing items
			this.investing_ids = [];
		}

		this.update = function() {
			// reset investing ids
			self.investing_ids.splice(0, self.investing_ids.length);

			LandlordApi.getAccountInfo(userConfig.getSessionId())
				.success(function(data) {
					if(data.flag === 1) {
						data = data.data;

						self.invest = +data.invest || 0;
						self.recharge = +data.recharge || 0;
						self.withdraw = +data.withdraw || 0;

						self.balance.total = +data.balance.total || 0;
						self.balance.available = +data.balance.available || 0;
						self.balance.frozen = +data.balance.frozen || 0;

						self.earnings.total = +data.earnings.total || 0;
						self.earnings.current_month = +data.earnings.current_month || 0;
						self.earnings.next_month = +data.earnings.next_month || 0;

						data.investing_ids && data.investing_ids.forEach(function(obj) {
							self.investing_ids.push(obj);
						});

						self.investing_ids.reverse();
					}
				});
		};

		self.init();
		self.update();

		$rootScope.$on('loginSuc', function() {
			self.update();
		});
	})