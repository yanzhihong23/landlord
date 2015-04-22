'use strict';

angular.module('landlordApp')
	.service('bankService', function(localStorageService, userConfig, UserApi, PayApi) {
		var bankList, boundBankList;

		this.getBankList = function() {
			return localStorageService.get('bankList');
		};

		this.getBoundBankList = function() {
			return localStorageService.get('boundBankList');
		};

		var updateBankList = function() {
			
		}
	})