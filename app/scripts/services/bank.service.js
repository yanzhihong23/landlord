'use strict';

angular.module('landlordApp')
	.service('bankService', function($rootScope, localStorageService, userConfig, UserApi, BankApi) {
		var self = this;
		var getBankShortName = function(fullname) {
			switch(fullname) {
				case '中国工商银行':
				case '':
					return 'icbc';
				case '中国农业银行':
					return 'abc';
				case '中国银行':
					return 'boc';
				case '中国建设银行':
					return 'ccb';
				case '招商银行':
					return 'cmb';
				case '中国光大银行':
					return 'ceb'
				case '上海浦东发展银行':
					return 'spdb';
				case '广东发展银行':
					return 'gdb';
				case '中国民生银行':
					return 'cmbc';
			}
		};

		this.getBankList = function() {
			return localStorageService.get('bankList') || [];
		};

		this.getBoundBankList = function() {
			return localStorageService.get('boundBankList') || [];
		};

		this.updateBankList = function() {
			BankApi.getBankListForKQ(userConfig.getSessionId())
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
								id: obj.banks_id,
								name: obj.banks_cat || '中国工商银行',
								shortName: getBankShortName(obj.banks_cat),
								tailNo: obj.banks_account.substr(-4),
								value: obj.kuaiq_short_no,
								text: (obj.banks_cat || '中国工商银行') + '（尾号' + obj.banks_account.substr(-4) + '）'
							}
						});

						localStorageService.add('boundBankList', boundBankList);
						$rootScope.$broadcast('boundBankListUpdated');
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
		}

		$rootScope.$on('loginSuc', function() {
			self.update();
		});
	})