'use strict';

angular.module('landlordApp')
	.service('bankService', function($rootScope, localStorageService, userConfig, UserApi, PayApi) {
		var self = this;

		this.getBankList = function() {
			return localStorageService.get('bankList');
		};

		this.getBoundBankList = function() {
			return localStorageService.get('boundBankList');
		};

		this.updateBankList = function() {
			PayApi.getBankListForKQ(userConfig.getSessionId())
				.success(function(data) {
					if(data.flag === 1) {
						console.log('----------- get bank list success -------------');
						var bankList = data.data.map(function(obj) {
							return {
								text: obj.name,
								value: obj.id
							};
						});

						localStorageService.add('bankList', bankList);
					}
				});
		};

		this.updateBoundBankList = function() {
			UserApi.getBoundBankList(userConfig.getSessionId())
				.success(function(data) {
					if(data.flag === 1) {
						console.log('----------- get bound bank list success -------------');
						var boundBankList = data.data.map(function(obj) {
							return {
								value: obj.kuaiq_short_no,
								text: (obj.banks_cat || '中国工商银行') + '（尾号' + obj.banks_account.substr(-4) + '）'
							}
						});

						localStorageService.add('boundBankList', boundBankList);
					}
				});
		};

		this.update = function() {
			self.updateBankList();
			self.updateBoundBankList();
		};

		// init
		if(userConfig.getSessionId()) {
			self.update();
		} else {
			$rootScope.$on('loginSuc', function() {
				self.update();
			});
		}
	})