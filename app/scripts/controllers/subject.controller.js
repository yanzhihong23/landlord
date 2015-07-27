'use strict';

angular.module('landlordApp')
	.controller('SubjectCtrl', function($scope, $rootScope, $state, localStorageService, utils, orderService) {
		$scope.current = localStorageService.get('subjectDetail');

		$scope.slogans = $scope.current.subject.slogan && $scope.current.subject.slogan.split('◆');

		$scope.preview = {
			index: 1
		};

		var amount = $scope.current.subject.amount;
		$scope.remain = Math.max(amount.sum - amount.adjust -  amount.complete, 0);

		$scope.showPreviews = function() {
			$state.go('tabs.preview');
		};

		$scope.onSlideChanged = function(index) {
			$scope.preview.index = index + 1;
		};

		$scope.invest = function() {
      if($rootScope.isLogined) {
      	orderService.subject = $scope.current;
        $state.go('tabs.buy');
      } else {
        utils.confirm({
          content: '您还未登录，去登录吧~~',
          onOk: function() {
            $state.go('tabs.login');
          }
        });
      }
	  };

	})