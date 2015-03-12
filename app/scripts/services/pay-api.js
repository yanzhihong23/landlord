'use strict';

angular.module('landlordApp')
	.service('PayApi', function($http, md5, utils, userConfig) {
		var server = 'https://m-test.nonobank.com/msapi',
		// var server = 'http://api.nonobank.com/msapi',
				v = 'm.nonobank.com/msapi/'+ utils.getDate(),
				vMd5 = md5.createHash(v),
				headers = {'Authorization': vMd5,'Content-Type': 'application/x-www-form-urlencoded'};

		// vcode for pay
		this.getPayVcode = function(extRefNo, realname, idNo, idType, mId, bankCardNo, mobile, count, key, type, paycode, payMode) { 
			return $http({
				method: 'POST',
				url: server + '/quickBill/getDynTr2',
				headers: headers,
				data: utils.param({
					externalRefNumber: extRefNo,
					realname: realname,
					idno: idNo,
					idType: idType || 0, // 0: default
					m_id: mId,
					bankCardNo: bankCardNo,
					mobile: mobile,
					count: count,
					key: key, // product id
					type: type, //product type
					paycode: paycode, // 1: buy, 2: repayment
					payMode: payMode // 1: bank, 2: balance， 3: combo
				})
			});
		};

		// vcode for bind bank card
		this.getBindVcode = function(mId, sessionId, realname, idNo, bankCardNo, bankCode, mobile) {
			return $http({
				method: 'POST',
				url: server + '/quickBill/getDynTr2',
				headers: headers,
				data: utils.param({
					m_id: mId,
					sessionId: sessionId,
					realname: realname,
					idno: idNo,
					bankCardNo: bankCardNo,
					bankcode: bankCode,
					mobile: mobile
				})
			})
		}

		// just bind, no pay
		this.bindBankCard = function(mId, sessionId, extRefNo, realname, idNo, bankCardNo, bankCode, mobile, vcode, token) {
			return $http({
				method: 'POST',
				url: server + '/quickBill/saveBankCard',
				headers: headers,
				data: utils.param({
					m_id: mId,
					sessionId: sessionId,
					externalRefNumber: extRefNo,
					realname: realname,
					idno: idNo,
					bankCardNo: bankCardNo,
					bankcode: bankCode,
					mobile: mobile,
					validCode: vcode,
					token: token // return by get vcode
				})
			})
		};

		// bind and pay
		this.bindAndPay = function(mId, sessionId, extRefNo, storablePan, count, vcode, token, payMode, payCode, key, type, realname, idNo, bankCardNo, bankCode, mobile, bankId) {
			return $http({
				method: 'POST',
				url: server + '/quickBill/doPay',
				headers: headers,
				data: utils.param({
					m_id: mId,
					sessionId: sessionId,
					externalRefNumber: extRefNo,
					storablePan: storablePan,
					count: count,
					validCode: vcode,
					token: token,
					payMode: payMode,
					key: key,
					type: type,
					realname: realname,
					idno: idNo,
					bankCardNo: bankCardNo,
					bankcode: bankCode,
					mobile: mobile,
					// bankid: bankId,
					paycode: payCode
				})
			})
		};

		this.quickPay = function(mId, sessionId, extRefNo, storablePan, count, key, type, payMode, payCode, payPassword) {
			return $http({
				method: 'POST',
				url: server + '/quickBill/quickPay',
				headers: headers,
				data: utils.param({
					m_id: mId,
					sessionId: sessionId,
					externalRefNumber: extRefNo,
					storablePan: storablePan,
					count: count,
					key: key,
					type: type,
					payMode: payMode,
					paycode: payCode,
					paypassword: payPassword
				})
			})
		};

		this.getBankListForKQ = function(sessionId) {
			return $http({
				method: 'POST',
				url: server + '/bank/getBankListForKQ',
				headers: headers,
				data: utils.param({
					sessionId: sessionId
				})
			})
		}
	})