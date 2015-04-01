'use strict';

/**
 * @ngdoc function
 * @name landlordApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the landlordApp
 */
angular.module('landlordApp')
	.controller('MainCtrl', function($scope) {
		$scope.house = {};
		$scope.order = {};
		$scope.pay = {};
	})
	.controller('StartupCtrl', function($scope, $state, $timeout, utils) {
		$timeout(function() {
			utils.disableBack();
			$state.go('tabs.home');
		}, 3000);
	})
	.controller('TosCtrl', function($scope, $rootScope, $state, $ionicHistory, utils, userConfig) {
		var accountInfo = userConfig.getAccountInfo();
		$scope.userInfo = {
			realname: accountInfo.realname,
			id: accountInfo.idnum,
			mobile: accountInfo.mobilenum
		};

		if($rootScope.landlord) {
			$rootScope.landlord.joinDate = utils.getDate();
		} 

		$scope.close = function() {
			if($ionicHistory.backView()) {
				$ionicHistory.goBack();
			} else {
				utils.disableBack();
				$state.go('account.info');
			}
		};
	})
  .controller('HomeCtrl', function($scope, $rootScope, $ionicModal, $state, $timeout, toaster, LandlordApi, $ionicLoading, utils, $window) {
  	$scope.countdown = 0;

  	$scope.goToInfo = function() {
  		utils.disableBack();
  		$state.go('account.info');
  	}

  	var updateData = function(restartCountdown) {
  		// get current
  		$ionicLoading.show();
  		LandlordApi.getLandlord().success(function(data, status, headers, config) {
  			$ionicLoading.hide();
  			$scope.$broadcast('scroll.refreshComplete');
  			if(data.flag === 1) {
  				var landlord = data.data.landlord;
  				// for tos
  				$rootScope.landlord = landlord;
  				$rootScope.landlord.fp_publish_date = utils.getDate(landlord.fp_publish_date);

  				$scope.house = {
  					key: landlord.fp_id,
  					type: 1,
  					title: landlord.fp_title,
  					mortgageRate: landlord.house_rate,
  					duration: landlord.fp_expect,
  					minPrice: ~~landlord.fp_price_min/10000,
  					maxPrice: ~~landlord.fp_price_max/10000,
  					houseType: landlord.house_type,
  					annualYield: landlord.fp_rate_max,
  					completeRate: landlord.fp_percent,
  					status: landlord.fp_status,	// 0: not publish, 1: end, 3: on sell,
  					slogan: landlord.fp_slogan,
  					previews: data.data.landlord_atts,
  					startDate: landlord.fp_start_date && landlord.fp_start_date.replace(/-/g,'.'),
  					endDate: landlord.fp_end_date && landlord.fp_end_date.replace(/-/g,'.'),
  					percent: landlord.fp_percent,
  					price: landlord.fp_price,
  					remain: ~~((100 - +landlord.fp_percent)*landlord.fp_price/1000000)
  				};

  				$scope.$parent.house = $scope.house;

  				// countdown
  				if(/-/.test(landlord.fp_finish_date_remain) || landlord.fp_status != '3') {
  					$scope.countdown = 0;
  				} else {
  					var remainArr = landlord.fp_finish_date_remain.split(':');
  					$scope.countdown = +(Math.abs(remainArr[0])*3600 + remainArr[1]*60 + remainArr[2]*1);
  				}
  				
  				restartCountdown && countdown();
  			} else {
  				console.log('fail');
  			}
  		}).error(function(data) {
  			$ionicLoading.hide();
  		})
  	};

  	// toaster.pop('success', "text");
  	// localStorage.setItem('ls.isLogined', true); // test on device
  	var seizeNow = false;
  	$ionicModal.fromTemplateUrl('views/modal.html', {
	    scope: $scope,
	    animation: 'slide-in-up'
	  }).then(function(modal) {
	    $rootScope.modal = modal;
	  });
	  $scope.openModal = function() {
	    $rootScope.modal.show();
	  };
	  $scope.closeModal = function() {
	    $rootScope.modal.hide();
	  };
	  $scope.$on('modal.hidden', function() {
	  	if(seizeNow) {
	  		seizeNow = false;
	  		$state.go('tabs.buy');
	  	}
    });

	  $scope.seize = function() {
	  	seizeNow = true;
	  	$scope.modal.hide();
	  };

	  var el_h1 = document.querySelector('#h1'),
	  		el_h2 = document.querySelector('#h2'),
	  		el_m1 = document.querySelector('#m1'),
	  		el_m2 = document.querySelector('#m2'),
	  		el_s1 = document.querySelector('#s1'),
	  		el_s2 = document.querySelector('#s2'),
	  		od_h1 = new Odometer({el: el_h1}),
	  		od_h2 = new Odometer({el: el_h2}),
	  		od_m1 = new Odometer({el: el_m1}),
	  		od_m2 = new Odometer({el: el_m2}),
	  		od_s1 = new Odometer({el: el_s1}),
	  		od_s2 = new Odometer({el: el_s2});

	  var countdown = function() {
	  	var parsed = parseTime($scope.countdown);
	  	od_h1.update(Math.min(parsed.h1, 9));
	  	od_h2.update(parsed.h2);
	  	od_m1.update(parsed.m1);
	  	od_m2.update(parsed.m2);
	  	od_s1.update(parsed.s1);
	  	od_s2.update(parsed.s2);

  		if($scope.countdown) {
  			$timeout(function() {
  				$scope.countdown += -1;
  				countdown();
  			}, 1000);
  		}
	  };

	  function parseTime(countdown) {
	    if(countdown < 0) countdown = 0;
	    var h = Math.floor(countdown/3600),
	        m = Math.floor((countdown-3600*h)/60),
	        s = Math.floor(countdown%60);

	    return {
        h1: Math.floor(h/10),
        h2: h%10,
        m1: Math.floor(m/10),
        m2: m%10,
        s1: Math.floor(s/10),
        s2: s%10
	    };
		}
		// countdown end

		$scope.doRefresh = function() {
			var restartCountdown = !$scope.countdown;
			updateData(restartCountdown);
		};

		$scope.reload = function() {
			$window.location.reload(true);
		};

		$rootScope.$on('landlordUpdated', function() {
			$scope.doRefresh();
		});

		updateData(true);

	})
	.controller('BuyCtrl', function($scope, userConfig, $state, $rootScope, UserApi, utils, $timeout, LandlordApi, $window, toaster) {
  	// show available balance
  	var accountInfo = userConfig.getAccountInfo();
  	if(accountInfo) {
  		$scope.balance = ~~accountInfo.balanceUsable/10000;
  	}

  	var annual = $scope.house.annualYield*$scope.house.minPrice*100;
		$scope.item = {
			mIncome: (annual/12).toFixed(2) || 0,
			total: (annual/12*$scope.house.duration).toFixed(2) || 0,
			limit: Math.min($scope.house.maxPrice, $scope.house.remain) || 1
		};

		$scope.buy = angular.copy($scope.item);
		$scope.buy.volume = 1;

		$scope.showInfo = function() {
			toaster.pop('info', '关注“大房东投资计划”微信公众号，获取最新活动内容，即有机会获得加息券和现金券。');
		};

		$scope.increase = function() {
			$scope.buy.volume += 1;
		};

		$scope.decrease = function() {
			$scope.buy.volume -= 1;
		};

		var interestsInit = function() {
			if(!$scope.validInterests.length) return;

			var limit = +$scope.buy.volume*10000;
			$scope.validInterests = $scope.validInterests.map(function(obj) {
				obj.checked = false;
				obj.disabled = +obj.minimum > limit;

				return obj;
			});

			var checkedItem, maxValue;
			for(var i=0, len=$scope.validInterests.length; i<len; i++) {
				if(!$scope.validInterests[i].disabled) {
					if(!angular.isDefined(checkedItem) || +$scope.validInterests[i].value > maxValue) {
						checkedItem = i;
						maxValue = +$scope.validInterests[i].value;
					} 
				}
			}

			if(angular.isDefined(checkedItem)) $scope.validInterests[checkedItem].checked = true;
		};

		var couponsInit = function() {
			if(!$scope.validCoupons.length) return;

			var limit = +$scope.buy.volume*10000;
			$scope.validCoupons = $scope.validCoupons.map(function(obj) {
				if(obj.minimum > limit) {
					obj.disabled = true;
					obj.checked = false;
				} else {
					obj.disabled = false;
					obj.checked = true;
				}

				return obj;
			});
		};

		$scope.$watch('buy.volume', function(val, old) {
			val = ~~val;
			if(val < 1) {
				val = 1;
			} else if(val > $scope.item.limit) {
				val = $scope.item.limit;
			}

			$scope.buy.volume = val;
			$scope.buy.mIncome = ($scope.item.mIncome*val).toFixed(2);
			$scope.buy.total = ($scope.item.total*val).toFixed(2);

			$scope.$parent.pay.count = val;
			$scope.$parent.order.total = val*10000;

			// for tos
			$rootScope.landlord && ($rootScope.landlord.total = val*10000);

			interestsInit();

			couponsInit();

			// calculate total with coupons
			calcTotalPay();
			// calculate extra earning with interests
			calcExtraEarn();
		});

		$scope.buyNow = function() {
			UserApi.generateOrderNo(userConfig.getSessionId())
				.success(function(data, status, headers, config) {
					if(data.flag === 1) {
						$scope.orderNo = data.data;
						$scope.$parent.pay.extRefNo = data.data;
						$scope.$parent.pay.earning = +$scope.buy.total + ($scope.buy.extraEarn || 0);

						$state.go('tabs.order');
					}
				});
		};

		$scope.validInterests = [];
		$scope.validCoupons = [];

		LandlordApi.getCouponList(userConfig.getSessionId(), $scope.house.key, $scope.house.type)
			.success(function(data) {
				if(data.flag === 1) {
					var data = data.data;
					var filter = function(obj) {
						return {
							code: obj.uv_code,
							id: obj.uv_id,
							value: obj.value,
							minimum: obj.minimum,
							sum: obj.uv_code + ':' + obj.uv_id + ':' + obj.value
						};
					}

					// init coupon data
					if(data.coupon && data.coupon.length) {
						$scope.validCoupons = data.coupon.map(filter);
						couponsInit();
					}
					$scope.showCoupon = $scope.validCoupons.length < 2 || $window.innerHeight > 568; // 568 iphone5
					calcTotalPay();

					// init interest data
					if(data.interest && data.interest.length) {
						$scope.validInterests = data.interest.map(filter);
						interestsInit();
					}
					$scope.showInterest = $scope.validInterests.length < 2 || $window.innerHeight > 568;
					calcExtraEarn();
				}
			});

		$scope.$watch('validInterests', function() {
			calcExtraEarn();
		}, true);

		$scope.$watch('validCoupons', function() {
			calcTotalPay();
		}, true);

		var calcTotalPay = function() {
			$scope.order.total = $scope.buy.volume*10000;
			var coupons = [];
			for(var i=0; i<$scope.validCoupons.length; i++) {
				if($scope.validCoupons[i].checked) {
					$scope.order.total -= +$scope.validCoupons[i].value; 
					coupons.push($scope.validCoupons[i].sum);
				}
			}
			$scope.pay.coupons = coupons;
		};

		var calcExtraEarn = function() {
			var checked = false;
			for(var i=0; i<$scope.validInterests.length; i++) {
				if($scope.validInterests[i].checked) {
					$scope.buy.extraEarn = $scope.buy.volume*100*(+$scope.validInterests[i].value)/12*$scope.house.duration;
					$scope.pay.interest = $scope.validInterests[i].sum;
					checked = true;
				}
			}

			if(!checked) {
				$scope.buy.extraEarn = 0;
				$scope.pay.interest = '';
			}
		};

		$scope.selectInterest = function(index) {
			if(!$scope.validInterests[index].disabled) {
				for(var i=0; i<$scope.validInterests.length;i++) {
					$scope.validInterests[i].checked = i===index;
				}
			}
		}; 

		// reset
		$rootScope.$on('landlordUpdated', function() {
			$scope.buy.volume = 1;
		});
	})
.controller('OrderCtrl', function($scope, $rootScope, $state, $ionicLoading, UserApi, PayApi, userConfig, toaster, md5, $ionicActionSheet) {
	var init = function() {
		console.log('init')
		$scope.order.balanceUsable = userConfig.getAccountInfo().balanceUsable;
		$scope.order.balance = $scope.order.balanceUsable;
		$scope.order.bank = Math.max($scope.order.total - $scope.order.balance, 0);
		$scope.bankCards = [];
		$scope.user = {payPassword: ''};

		$scope.order.useBalance = !!$scope.order.balance;

		UserApi.getBoundBankList(userConfig.getSessionId())
			.success(function(data) {
				if(data.flag === 1) {
					var arr = data.data;
					for(var i=0; i<arr.length; i++) {
						var card = {
							value: arr[i].kuaiq_short_no, // storablePan
							text: arr[i].banks_cat + '（尾号' + arr[i].banks_account.substr(-4) + '）'
						};
						$scope.bankCards.push(card);
					}
				} 

				$scope.bankCards.push({
					text: '添加银行卡',
					value: 'add'
				});

				$scope.order.bankCard = $scope.bankCards[0].value;
				$scope.showBankRec = /工商|光大|民生/.test($scope.bankCards[0].text);
				$scope.order.bankCardShow = $scope.bankCards[0].text;
			}); 
	};

	init();

	$scope.selectBank = function() {
		if(!$scope.order.useCard) return;

		if($scope.bankCards.length === 1) {
			$state.go('tabs.pay');
			return;
		}

		var hideSheet = $ionicActionSheet.show({
			buttons: $scope.bankCards,
			cancelText: '取消',
			buttonClicked: function(index) {
				if(index === $scope.bankCards.length-1) {
					$state.go('tabs.pay');
				} else {
					$scope.order.bankCard = $scope.bankCards[index].value;
					$scope.order.bankCardShow = $scope.bankCards[index].text;
					hideSheet();
				}
     	}
		})
	};

	$scope.$watch('order.bankCard', function(val, oldVal) {
		if(val !== oldVal && val === 'add' && $scope.order.useCard) {
			$state.go('tabs.pay');
			$scope.showBankRec = false;
		} else {
			for(var i=0; i<$scope.bankCards.length; i++) {
				if(val == $scope.bankCards[i].value) {
					$scope.showBankRec = /工商|广大|民生/.test($scope.bankCards[i].text);
					break;
				}
			}
		}
	});

	$scope.$watch('order.useBalance', function(val) {
		if(val) {
			if($scope.order.total > $scope.order.balanceUsable) {
				$scope.order.balance = $scope.order.balanceUsable;
				$scope.order.bank = $scope.order.total - $scope.order.balance;

				$scope.order.cardDisabled = false;

				$scope.$parent.pay.payMode = 3;
			} else {
				$scope.order.balance = $scope.order.total;
				$scope.order.bank = 0;

				$scope.order.useCard = false;
				$scope.order.cardDisabled = false;

				$scope.$parent.pay.payMode = 2;
			}
		} else {
			$scope.order.balance = 0;
			$scope.order.bank = $scope.order.total;
			if($scope.bankCards.length > 1) $scope.order.useCard = true;

			$scope.order.cardDisabled = false;

			$scope.$parent.pay.payMode = 1;
		}

		console.log($scope.$parent.pay.payMode)
	});

	$scope.$watch('order.useCard', function(val, oldVal) {
		if(val !== oldVal) { // val === oldVal when back from bind new card
			if(val) {
				if($scope.order.balanceUsable > $scope.order.total) {
					$scope.order.useBalance = false;
				}

				if($scope.order.useBalance) {
					$scope.$parent.pay.payMode = 3;
				} else {
					$scope.$parent.pay.payMode = 1;
				}
				if($scope.order.bankCard === 'add' && $scope.bankCards.length === 1) {
					// $scope.order.useCard = false;
					$state.go('tabs.pay');
				}
			} else {
				if($scope.order.balanceUsable) {
					$scope.$parent.pay.payMode = 2;
					$scope.order.useBalance = true;
				}
				
			}
		}
		console.log($scope.$parent.pay.payMode)
	});

	$scope.quickPay = function() {
		var accountInfo = userConfig.getAccountInfo();
		var sessionId = userConfig.getSessionId();
		var mId = accountInfo.m_id;
		var payCode = 1; // buy
		var payMode = $scope.$parent.pay.payMode;
		var payPassword = md5.createHash($scope.user.payPassword);

		// var coupon = ['ZC5010Mar1800004:372726:50.10','zktest31:373868:100.00'];

		$ionicLoading.show();
		PayApi.quickPay(mId, sessionId, $scope.pay.extRefNo, $scope.order.bankCard, $scope.pay.count, $scope.house.key, $scope.house.type, payMode, payCode, payPassword, $scope.pay.coupons, $scope.pay.interest)
			.success(function(data) {
				$ionicLoading.hide();
				if(data.flag === 1) {
					toaster.pop('success', data.msg);
					$scope.user.payPassword = null; // clear password
					$rootScope.$broadcast('landlordUpdated');
					$state.go('account.info');
				} else {
					toaster.pop('error', data.msg);
				}
			});
	};

	$rootScope.$on('balanceUpdated', function() {
		init();
	}); 
})
.controller('PayCtrl', function($scope, $rootScope, $state, PayApi, userConfig, toaster, UserApi, $ionicLoading, $timeout, utils, $ionicActionSheet) {
	var accountInfo = userConfig.getAccountInfo();
	var sessionId = userConfig.getSessionId();
	var mId = accountInfo && accountInfo.m_id, storablePan, token;
	$scope.resendCountdown = 0;
	var resendCountdown = utils.resendCountdown($scope);

	$scope.pay = $scope.$parent.pay;
	$scope.pay.name = accountInfo.realname;
	$scope.pay.id = accountInfo.idnum;
	$scope.pay.phone = accountInfo.mobilenum;
	$scope.pay.key = $scope.house.key;
	$scope.pay.type = $scope.house.type;

	// $scope.pay.cardNo = '6228483470502762919'; // for test
	console.log('$scope.pay.payMode = ' + $scope.pay.payMode);


	if(accountInfo.realname && accountInfo.idnum) {
		$scope.disableIdEdit = true;
	}

	PayApi.getBankListForKQ(userConfig.getSessionId())
		.success(function(data) {
			if(data.flag === 1) {
				$scope.bankList = data.data.map(function(obj) {
					return {
						text: obj.name,
						value: obj.id
					};
				});

				$scope.pay.bankCode = $scope.bankList[0].id;
				$scope.pay.bankName = $scope.bankList[0].text;
			}
		});

	$scope.selectBank = function() {
		var hideSheet = $ionicActionSheet.show({
			buttons: $scope.bankList,
			cancelText: '取消',
			buttonClicked: function(index) {
				$scope.pay.bankCode = $scope.bankList[index].value;
				$scope.pay.bankName = $scope.bankList[index].text;
				hideSheet();
     	}
		});
	}

	$scope.sendSms = function() {
		PayApi.getPayVcode(
			$scope.pay.extRefNo,
			$scope.pay.name,
			$scope.pay.id,
			0, mId,
			$scope.pay.cardNo,
			$scope.pay.phone,
			$scope.pay.count,
			$scope.pay.key,
			$scope.pay.type,
			1, $scope.pay.payMode)
		.success(function(data) {
			if(data.flag === 1) {
				resendCountdown();
				storablePan = data.storablePan;
				token = data.token;
				toaster.pop('success', data.msg);
			} else {
				toaster.pop('error', data.msg);
			}
		})
	};

	$scope.doPay = function() {
		$ionicLoading.show();

		// update kyc info
		if(!accountInfo.realname) {
			UserApi.updateKycInfo(sessionId, $scope.pay.name, $scope.pay.id, accountInfo.mobilenum)
				.success(function(data) {
					if(data.flag === 1) {
						userConfig.autoLogin(); // get new account info
						console.log(data.msg);
						pay();
					} else {
						toaster.pop('error', data.msg);
					}
				});
		} else {
			pay();
		}
	};

	var pay = function() {
		PayApi.bindAndPay(mId, sessionId, 
			$scope.pay.extRefNo, storablePan, 
			$scope.pay.count, 
			$scope.pay.vcode, 
			token, 
			$scope.pay.payMode, 
			1, 
			$scope.house.key, 
			$scope.house.type, 
			$scope.pay.name, 
			$scope.pay.id, 
			$scope.pay.cardNo, 
			$scope.pay.bankCode, 
			$scope.pay.phone,
			$scope.pay.coupons, 
			$scope.pay.interest)
		.success(function(data) {
			$ionicLoading.hide();
			if(data.flag === 1) {
				toaster.pop('success', data.msg);
				// $scope.order = {};
				$scope.pay = {};
				$rootScope.$broadcast('landlordUpdated');
				$state.go('account.info');
			} else {
				toaster.pop('error', data.msg);
			}
		});
	};
})
.controller('RetrieveTxPwdCtrl', function($scope, $state, userConfig, UserApi, toaster, md5, $ionicHistory, $timeout, utils) {
	var sessionId = userConfig.getSessionId();
	var mobile = userConfig.getAccountInfo().mobilenum;
	$scope.invalidPassword = false;
	$scope.resendCountdown = 0;
	var resendCountdown = utils.resendCountdown($scope);
	$scope.user = {
		vcode: '',
		password: ''
	};

	$scope.passwordValidate = function(password) {
    $scope.invalidPassword = !utils.isPasswordValid(password);
	};

	$scope.sendSms = function() {
		UserApi.sendSmsForRetrievePayPassword(sessionId, mobile)
			.success(function(data) {
				if(data.flag === 1) {
					toaster.pop('success', data.msg);
					resendCountdown();
				} else {
					toaster.pop('error', data.msg); 
				}
			});
	};

	$scope.retrievePayPassword = function() {
		var payPassword = md5.createHash($scope.user.password);
		UserApi.retrievePayPassword(sessionId, $scope.user.vcode, payPassword)
			.success(function(data) {
				if(data.flag === 1) {
					toaster.pop('success', data.msg);
					$ionicHistory.goBack();
				} else {
					toaster.pop('error', data.msg); 
					if(data.flag === 4) {
						$scope.invalidVcode = true;
					}
				}
			});
	};
})
	

