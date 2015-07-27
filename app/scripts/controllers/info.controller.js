'use strict';

angular.module('landlordApp')
	.controller('InfoCtrl', function($scope, $rootScope, $state, $ionicActionSheet, accountService, userConfig, utils) {
    $scope.info = accountService;

    var init = function() {
      var accountInfo = userConfig.getAccountInfo();
      if(accountInfo) {
        var gender = accountInfo.sex === '男' ? '包租公' : accountInfo.sex === '女' ? '包租婆' : '';

        $scope.user = {
          name: accountInfo.realname,
          phone: accountInfo.mobilenum.substr(0,3) + '****' + accountInfo.mobilenum.substr(-4),
          gender: gender
        };
      }
    };

    $scope.showEarings = function() {
      if(!$rootScope.isLogined) {
        loginConfirm();
      } else {
        $state.go('tabs.earnings');
      }
    };

    $scope.showInvestRecords = function() {
      if(!$rootScope.isLogined) {
        loginConfirm();
      } else {
        $state.go('tabs.investRecords');
      }
    };

    $scope.showAvailableBalance = function() {
      if(!$rootScope.isLogined) {
        loginConfirm();
      } else {
        $state.go('tabs.availableBalance');
      }
    };

    $scope.showReserveRecords = function() {
      if(!$rootScope.isLogined) {
        loginConfirm();
      } else {
        // $state.go('tabs.reserveRecords');
      }
    };

    $scope.showWelfare = function() {
      if(!$rootScope.isLogined) {
        loginConfirm();
      } else {
        // $state.go('tabs.reserveRecords');
      }
    };

    $scope.showCards = function() {
      if(!$rootScope.isLogined) {
        loginConfirm();
      } else {
        $state.go('tabs.myCards');
      }
    };

    $rootScope.$on('loginSuc', function() {
      init();
    });

    var loginConfirm = function() {
      utils.confirm({
        content: '您还未登录，去登录吧~',
        onOk: function() {
          $state.go('tabs.login');
        }
      });
    };

    init();
	})
  .controller('ProductCtrl', function($scope, $ionicScrollDelegate) {
    $scope.$watch('type', function(val) {
      switch(val) {
        case 'desc':
          $scope.title = '产品介绍';
          break;
        case 'security':
          $scope.title = '安全保障';
          break;
        case 'team':
          $scope.title = '专业团队';
          break;
      }
      $ionicScrollDelegate.scrollTop();
    });
  })
  .controller('EarningsCtrl', function($scope, LandlordApi, userConfig, accountService) {
    var sessionId = userConfig.getSessionId();
    $scope.info = accountService;
    $scope.items = [];

    LandlordApi.getEarningHistory(sessionId, 10, 0)
      .success(function(data) {
        if(data.flag === 1) {
          var history = data.data.history.map(function(obj) {
            obj.subject_title = obj.subject_title.substr(7);
            return obj;
          });

          $scope.items = $scope.items.concat(history);
          console.log($scope.items);
        }
      })
  })
  .controller('BalanceRecordsCtrl', function($scope, LandlordApi, userConfig, accountService) {
    var sessionId = userConfig.getSessionId(), length = 10, offset = 0;
    $scope.info = accountService;
    $scope.items = [];
    $scope.hasMoreData = true;

    $scope.loadMore = function() {
      LandlordApi.getBalanceDetail(sessionId, length, offset)
        .success(function(data) {
          if(data.flag === 1) {
            var history = data.data.history.map(function(obj) {
              // obj.subject_title = obj.subject_title.substr(7);
              return obj;
            });

            if(history.length < length) {
              $scope.hasMoreData = false;
            }

            $scope.items = $scope.items.concat(history);
            console.log($scope.items);
          }
        }).finally(function() {
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });

      offset += length;
    };

    // $scope.loadMore();

  })