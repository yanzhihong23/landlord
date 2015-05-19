'use strict';

angular.module('landlordApp')
	.controller('InfoCtrl', function($scope, $rootScope, userConfig, $state, LandlordApi, $filter, utils, $ionicHistory, $ionicLoading, $ionicActionSheet, localStorageService) {
		$scope.isNoRecord = false;
    $scope.earnings = {
      balance: 0,
      invest: 0,
      earnings: 0
    };

    $scope.showMenu = function() {
      var hideSheet = $ionicActionSheet.show({
        buttons: [
          {text: '隐藏资产金额'},
          {text: '充值'},
          {text: '提现'}
        ],
        cancelText: '取消',
        buttonClicked: function(index) {
          hideSheet();
          switch(index) {
            case 0:
              // hide amount
              break;
            case 1:
              $scope.recharge();
              break;
            case 2:
              // withdraw
              $state.go('tabs.withdraw');
              break;
          }
        }
      })
    };

  	// $scope.backToHome = function() {
			// utils.disableBack();
  	// 	$state.go('tabs.home');
  	// };

  	$scope.recharge = function() {
      var callMeOffFn = $rootScope.$on('rechargeSuc', function(event, amount) {
        init();
        callMeOffFn();
      })
  		$state.go('tabs.rechargeInfo');
  	};

  	var init = function() {
      console.log('------------- init InfoCtrl --------------');
      $ionicLoading.show();
  		LandlordApi.getLandlordAccountInfo(userConfig.getSessionId())
  			.success(function(data) {
          $ionicLoading.hide();
  				$scope.$broadcast('scroll.refreshComplete');

  				$scope.investingItems = [];
  				$scope.items = [];

  				if(data.flag === 1) {
  					data = data.data;
  					$scope.info = {
  						balance: data.balanceUsable || 0,
  						invest: data.invest || 0,
  						earnings: data.earnings || 0,
              frozen: data.lockbalance || 0
  					}
  					$scope.showTip = !!data.balanceUsable;

  					// update balance
  					var accountInfo = userConfig.getAccountInfo();
  					accountInfo.balanceUsable = data.balanceUsable;
  					userConfig.setAccountInfo(accountInfo);
  					$rootScope.$broadcast('balanceUpdated');

  					var investingItems = data.vipAccounts;
  					var idObj = {}, idArr = [];
  					if(investingItems.length) {
  						$scope.isNoRecord = false;
  						for(var i=0; i<investingItems.length; i++) {
  							var id = investingItems[i].fp_id;
  							if(!idObj[id]) {
  								idObj[id] = 1;
                  idArr.push(id);
  								
  							}
  						}

              localStorageService.add('orderIds', idArr);
  					} else {
  						$scope.isNoRecord = true;
  					}
  				}
  			});
		};


		$scope.doRefresh = function() {
			init();
		};

		$rootScope.$on('landlordUpdated', function() {
			init();
		});

		init();
	})