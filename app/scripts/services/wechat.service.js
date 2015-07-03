'use strict';

angular.module('landlordApp')
	.service('WechatService', function($http, utils, $rootScope, userConfig, $timeout) {
		var HOST = utils.getServerHost();
		// wechat
		var initWxJsApi = function() {
			$http({
				method: 'POST',
				url: HOST + '/msapi/activity/getSignPackage?type=dfd&url=' + encodeURIComponent(location.href.split('#')[0])
				// data: utils.param({
				// 	// url: location.href,
				// 	type: 'csyy'
				// })
			}).success(function(data) {
				if(data.flag == 1) {
					console.log('get signature success');

					var config = data.data;
					// wx api init
					wx.config({
						debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
				    appId: config.appId, // 必填，公众号的唯一标识
				    timestamp: config.timestamp, // 必填，生成签名的时间戳
				    nonceStr: config.nonceStr, // 必填，生成签名的随机串
				    signature: config.signature,// 必填，签名，见附录1
				    jsApiList: [
				    	'onMenuShareTimeline',
				    	'onMenuShareAppMessage',
				    	'onMenuShareQQ'
				    ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
					});
				}
			}).error(function(data) {
			});
		};

		var resetShareContent = function() {
			var info = userConfig.getAccountInfo();
			var userKey = info ? info.userkey: '';

			var obj = {
				title: '做房东特使，不买房也能收房租', // 分享标题
			  desc: '发现一个赚钱的神器，不买房也能收房租，月入万元so easy，心动不如行动！赶快参与吧！ ', // 分享描述
			  link: HOST + '/dfd/dfdmessenger/?userfrom=' + userKey, // 分享链接
			  imgUrl: HOST + '/landlord/images/share/share-icon.jpg', // 分享图标
			  type: '', // 分享类型,music、video或link，不填默认为link
			  dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
			  success: function () { 
			      // 用户确认分享后执行的回调函数
			  },
			  cancel: function () { 
			      // 用户取消分享后执行的回调函数
			  },
			  trigger: function() {
			  	// alert(111)
			  }
			};

			wx.onMenuShareTimeline(obj); // 分享到朋友圈
			wx.onMenuShareAppMessage(obj); // 分享给朋友
			wx.onMenuShareQQ(obj);
		};

		if(wechat) {
			initWxJsApi();

			wx.ready(function() {
				// alert('wx ready');
				resetShareContent();
			});

			wx.error(function() {
				alert('wx config error');
			});
		}

		$rootScope.$on('loginSuc', function() {
			if(wechat) {
				resetShareContent();
			}
		});
	})