'use strict';

angular.module('landlordApp')
	.service('accountService', function(LandlordApi, userConfig) {
		var self = this;

		// export balance
		this.balance = {};
		// export investing items
		this.investingIds = [];

		this.update = function() {
			// reset investing ids
			self.investingIds.splice(0, self.investingIds.length);

			LandlordApi.getLandlordAccountInfo(userConfig.getSessionId())
				.success(function(data) {
					if(data.flag === 1) {
						data = data.data;

						var investingItems = data.vipAccounts;
  					var idObj = {};
  					if(investingItems.length) {
  						for(var i=0; i<investingItems.length; i++) {
  							var id = investingItems[i].fp_id;
  							if(!idObj[id]) {
  								idObj[id] = 1;
  								// update investing items
                  self.investingIds.push(id);
  							}
  						}
  					}

  					// update balance
						self.balance.available = +data.balanceUsable || 0;
						self.balance.frozen = +data.lockbalance || 0;
						self.balance.invest = +data.invest || 0;
						self.balance.earnings = +data.earnings || 0;
					}
				})
		};

		self.update();
	})