'use strict';

angular.module('landlordApp')
	.service('PayApi', function($http, md5, utils, userConfig, serverConfig) {
		var server = serverConfig.url,
				v = 'm.nonobank.com/msapi/'+ utils.getDate(),
				vMd5 = md5.createHash(v),
				headers = {'Authorization': vMd5,'Content-Type': 'application/x-www-form-urlencoded'};

		// vcode for pay
		this.getPayVcode = function(obj) {
			return $http({
				method: 'POST',
				url: server + '/quickBill/getDynTr2',
				headers: headers,
				data: utils.param({
					externalRefNumber: obj.extRefNo,
					realname: obj.realname,
					idno: obj.idNo,
					idType: obj.idType || 0, // 0: default
					m_id: obj.mId,
					bankCardNo: obj.bankCardNo,
					mobile: obj.mobile,
					count: obj.count,
					key: obj.key, // product id
					type: obj.type, //product type
					paycode: obj.payCode, // 1: buy, 2: repayment/recharge
					payMode: obj.payMode // 1: bank, 2: balance， 3: combo
				})
			});
		};

		// vcode for bind bank card
		this.getBindVcode = function(mId, sessionId, realname, idNo, bankCardNo, bankCode, mobile) {
			return $http({
				method: 'POST',
				url: server + '/quickBill/getDynByBind',
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
		this.bindAndPay = function(obj) {
			return $http({
				method: 'POST',
				url: server + '/quickBill/doPay',
				headers: headers,
				data: utils.param({
					m_id: obj.mId,
					sessionId: obj.sessionId,
					externalRefNumber: obj.extRefNo,
					storablePan: obj.storablePan,
					count: obj.count,
					validCode: obj.vcode || '',
					token: obj.token,
					payMode: obj.payMode,
					key: obj.key,
					type: obj.type,
					realname: obj.realname,
					idno: obj.idNo,
					bankCardNo: obj.bankCardNo,
					bankcode: obj.bankCode,
					mobile: obj.mobile,
					paycode: obj.payCode,
					coupon: obj.coupon || '', // uv_code:uv_id:value
					interest: obj.interest || ''
				})
			})
		};

		this.quickPay = function(obj) {
			return $http({
				method: 'POST',
				url: server + '/quickBill/quickPay',
				headers: headers,
				data: utils.param({
					m_id: obj.mId,
					sessionId: obj.sessionId,
					externalRefNumber: obj.extRefNo,
					storablePan: obj.storablePan,
					bankid: obj.bankId,
					count: obj.count,
					key: obj.key,
					type: obj.type,
					payMode: obj.payMode,
					paycode: obj.payCode,
					paypassword: obj.payPassword,
					coupon: obj.coupon || '',
					interest: obj.interest || ''
				})
			})
		};
	})