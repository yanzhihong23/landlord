'use strict';

angular.module('landlordApp')
	.controller('InvestRecordsCtrl', function($scope, $rootScope, $state, accountService, localStorageService, userConfig, LandlordApi, utils, $ionicSlideBoxDelegate, subjectService) {
		var ids = accountService.investing_ids,
				sessionId = userConfig.getSessionId(),
				index = 0;

		$scope.items = [];
		$scope.hasMoreData = true;
		console.log(ids);

		$scope.showSubject = function(index) {
			localStorageService.add('subjectDetail', $scope.items[index]);
			$state.go('tabs.subject');
		};

		$scope.showRefund = function(index) {
			localStorageService.add('subjectDetail', $scope.items[index]);
			$state.go('tabs.refund');
		}

		$scope.goToTos = function(index) {
			localStorageService.add('subjectDetail', $scope.items[index]);
			$state.go('tabs.tosInfo');
		};

		$scope.loadMore = function() {
			LandlordApi.getInvestedSubject(sessionId, ids[index])
				.success(function(data) {
					if(data.flag === 1) {
						var item = data.data;
						item.completed = true;
						for(var i=0; i<item.buy_records.length; i++) {
							if(!+item.buy_records[i].status) {
								item.completed = false;
								break;
							}
						}
						$scope.items.push(item);
						console.log($scope.items);
					}
				}).finally(function() {
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });

      if(index === ids.length) {
      	$scope.hasMoreData = false;
      } else {
      	index += 1;
      }
		};
	})
	.controller('RefundCtrl', function($scope, localStorageService) {
		$scope.refundPeriods = localStorageService.get('subjectDetail').refund_periods;
	})