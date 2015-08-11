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

		var getLimit = function(fullname) {
			switch(fullname) {
				case '中国工商银行':
				case '':
					return {
						per: 5000,
						day: 50000,
						month: 50000,
						desc: '单笔限额5000，单日5万，每月5万'
					};
				case '中国农业银行':
					return {
						per: 500000,
						day: 500000,
						month: 0,
						desc: '单笔限额50万，单日50万，每月不限'
					};
				case '中国银行':
					return {
						per: 10000,
						day: 10000,
						month: 0,
						desc: '单笔限额1万，单日1万，每月不限'
					};
				case '中国建设银行':
				case '招商银行':
				case '上海浦东发展银行':
				case '广东发展银行':
					return {
						per: 0,
						day: 0,
						month: 0,
						desc: '无限额'
					};
				case '中国光大银行':
				case '中国民生银行':
					return {
						per: 5000,
						day: 5000,
						month: 0,
						desc: '单笔限额5000，单日5000，每月不限'
					};
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
								value: obj.id,
								name: obj.name,
								id: obj.id,
								shortName: getBankShortName(obj.name),
								limit: getLimit(obj.name)
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
								text: (obj.banks_cat || '中国工商银行') + '（尾号' + obj.banks_account.substr(-4) + '）',
								limit: getLimit(obj.banks_cat)
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

		this.order = {};

		// init
		if(userConfig.getSessionId()) {
			self.update();
		}

		$rootScope.$on('loginSuc', function() {
			self.update();
		});
	})