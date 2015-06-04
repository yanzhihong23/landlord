'use strict';

angular.module('landlordApp')
	.controller('InfoCtrl', function($scope, $rootScope, userConfig, $state, LandlordApi, $filter, utils, $ionicHistory, accountService) {
		$scope.isNoRecord = false;

    $scope.balance = accountService.balance;

  	if(!userConfig.isLogined()) {
  		$rootScope.$on('loginSuc', function(evt) {
  			init();
  			utils.disableBack();
  			$state.go('account.info');
  		})

  		utils.disableBack();
  		$state.go('account.phone');
  	}

  	$scope.backToHome = function() {
			utils.disableBack();
  		$state.go('tabs.home');
  	};

  	$scope.recharge = function() {
      var callMeOffFn = $rootScope.$on('rechargeSuc', function(event, amount) {
        init();
        callMeOffFn();
      })
  		$state.go('account.recharge');
  	};

    $scope.withdraw = function() {
      $state.go('account.withdraw');
    };

  	$scope.goToTos = function(index) {
  		var item = $scope.items[index];
      var records = item.vipAccounts[0].vfInfo.map(function(obj) {
        return {
          date: obj.vf_service_time,
          amount: obj.vf_amount
        }
      })
  		$rootScope.landlord = {
  			total: item.invest,
  			fp_title: item.finance_plan.fp_title,
        fp_price_min: item.finance_plan.fp_price_min,
        fp_price_increment: item.finance_plan.fp_price_increment,
  			fp_price_max: item.finance_plan.fp_price_max,
  			fp_start_date: item.finance_plan.fp_start_date,
  			fp_end_date: utils.getDate(utils.addMonth(new Date(item.finance_plan.fp_start_date), ~~item.finance_plan.fp_expect)),
  			fp_expect: item.finance_plan.fp_expect,
  			fp_rate_min: item.finance_plan.fp_rate_min,
  			fp_publish_date: utils.getDate(item.finance_plan.fp_publish_date.split(' ')[0]),
  			va_extno: item.vipAccounts[0].va_extno,
        records: records
  		}
  		utils.disableBack();
  		$state.go('tabs.tos');
  	};

  	var init = function() {
      console.log('------------- init InfoCtrl --------------');
  		LandlordApi.getLandlordAccountInfo(userConfig.getSessionId())
  			.success(function(data) {
  				$scope.$broadcast('scroll.refreshComplete');

  				$scope.investingItems = [];
  				$scope.items = [];

  				if(data.flag === 1) {
  					data = data.data;
  					$scope.showTip = !!data.balanceUsable;

  					// update balance
  					var accountInfo = userConfig.getAccountInfo();
  					accountInfo.balanceUsable = data.balanceUsable;
  					userConfig.setAccountInfo(accountInfo);
  					$rootScope.$broadcast('balanceUpdated');

  					var investingItems = data.vipAccounts;
  					var idObj = {};
  					if(investingItems.length) {
  						$scope.isNoRecord = false;
  						for(var i=0; i<investingItems.length; i++) {
  							var id = investingItems[i].fp_id;
  							if(!idObj[id]) {
  								idObj[id] = 1;
  								LandlordApi.getLandlordProfitDetail(userConfig.getSessionId(), id)
  								.success(function(data) {
  									if(data.flag === 1) {
  										data = data.data;
  										var desc = '该笔投资正在匹配中...';
  										if(data.next_expect_ba.ba_expect) {
                        var amount = data.next_expect_ba.ba_price_l + (data.next_expect_ba.ba_expect == data.baList.length ? +data.invest : 0);
  											desc = data.next_expect_ba.ba_time_formate + ' 入账“房租” ' + $filter('currency')(amount, '') + '元 (' + (data.next_expect_ba.ba_expect + '/' + data.baList.length) + '期)';
  										}

                      var interests = data.vipAccounts[0].vfInfo.filter(function(obj) {
                        return obj.ir_p_type == '1';
                      });

                      interests = interests.map(function(obj) {
                        return {
                          amount: (+obj.vf_amount)/10000,
                          value: obj.value
                        }
                      });

  										var item = {
  											invest: data.invest/10000,
  											earnings: data.earnings || 0,
  											images: data.landlord_atts,
  											desc: desc,
  											endDate: data.baList.length && data.baList[data.baList.length-1].ba_time_formate,
                        interests: interests,
  											showDesc: true
  										};

  										$scope.investingItems.push(item);
  										$scope.items.push(data);
  									}
  								});
  							}
  						}
  					} else {
  						$scope.isNoRecord = true;
  					}
  				}
  			});
		};

		$scope.logout = function() {
      $ionicHistory.clearHistory();
      $ionicHistory.clearCache();

			userConfig.logout();
			utils.disableBack();
			$state.go('account.phone');

			var callMeOffFn = $rootScope.$on('loginSuc', function() {
				init();
				utils.disableBack();
				$state.go('account.info');
				callMeOffFn(); // deregister the listener
			});
		}

		$scope.doRefresh = function() {
			init();
		};

		$rootScope.$on('landlordUpdated', function() {
			init();
		});

		init();
	})