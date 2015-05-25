'use strict';

angular.module('landlordApp')
	.controller('InfoCtrl', function($scope, $state, $ionicActionSheet, accountService) {
    $scope.balance = accountService.balance;

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
              // recharge
              $state.go('tabs.rechargeInfo');
              break;
            case 2:
              // withdraw
              $state.go('tabs.withdraw');
              break;
          }
        }
      })
    };
	})