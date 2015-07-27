'use strict';

angular.module('landlordApp')
	.controller('HomeCtrl', function($scope, $rootScope, $ionicModal, $state, $timeout, $ionicScrollDelegate, orderService, subjectService, toaster, LandlordApi, $ionicLoading, utils, $window, userConfig, $ionicSlideBoxDelegate, localStorageService) {
    // $scope.subjects = subjectService.subjects;
    $scope.pastSubjects = [];
    var index = 0;

    $rootScope.$watch('newTab', function(val) {
      // $ionicSlideBoxDelegate.$getByHandle('homeTabs').slide(+!val);
      $scope.title = val ? '最新' : '往期';
      $ionicScrollDelegate.scrollTop();
    });

    $scope.onSlideChanged = function(index) {
      if(index) {
        $rootScope.newTab = false;
        $rootScope.oldTab = true;
      } else {
        $rootScope.newTab = true;
        $rootScope.oldTab = false;
      }
    };

    LandlordApi.getPastSubjectIds().success(function(data) {
      if(data.flag === 1) {
        $scope.pastIds = data.data.id_list.reverse();
        console.log($scope.pastIds);

        if($scope.pastIds && $scope.pastIds.length >= 2) {
          for(var i=0; i<2; i++) {
            $scope.loadPastSubjects();
          }
        }
      }
    });

    $scope.moreDataCanBeLoaded = function() {
      return index !== ($scope.pastIds && ($scope.pastIds.length - 1));
    }

    $scope.loadPastSubjects = function() {
      var id = $scope.pastIds[index];
      var item = localStorageService.get('subject_' + id);
      if(!item) {
        LandlordApi.getSubject($scope.pastIds[index]).success(function(data) {
          if(data.flag === 1) {
            item = data.data;
            formatSaleRecords(item.sale_records);

            var maxAmount = 0;
            item.sale_records.forEach(function(obj) {
              (obj.amount > maxAmount) && (maxAmount = obj.amount);
            });

            var getProfit = function(amount) {
              return amount*item.subject.annual_yield/100*item.subject.duration/12;
            };

            item.desc = {
              total: getProfit(item.subject.amount.sum),
              top: {
                amount: maxAmount,
                profit: getProfit(maxAmount)
              }
            };

            localStorageService.add('subject_' + id, item);
            $scope.pastSubjects.push(item);
          }
        }).finally(function() {
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });
      } else {
        $scope.$broadcast('scroll.infiniteScrollComplete');
        $scope.pastSubjects.push(item);
      }

      index++;
    };

    var initCurrent = function() {
      LandlordApi.getSubject().success(function(data) {
        if(data.flag === 1) {
          $scope.current = data.data;
          formatSaleRecords($scope.current.sale_records);
        }
      }).finally(function() {
        $scope.$broadcast('scroll.refreshComplete');
      });
    };

    var formatSaleRecords = function(records) {
      records.map(function(obj) {
        obj.phone = obj.phone.substr(0,3) + '****' + obj.phone.substr(-4);
        obj.date = obj.date.split(' ')[0];
      });
    }

    initCurrent();

    $scope.showDetail = function() {
      localStorageService.add('subjectDetail', $scope.current);
      $state.go('tabs.subject');
    };


	  $scope.invest = function() {
      if($rootScope.isLogined) {
        localStorageService.add('subjectDetail', $scope.current);
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

    $scope.showPastSubject = function(index) {
      localStorageService.add('subjectDetail', $scope.pastSubjects[index]);
      $state.go('tabs.subject');
    };

		$scope.doRefresh = function() {
      initCurrent();
		};

		$scope.reload = function() {
			$window.location.reload(true);
		};

		$rootScope.$on('landlordUpdated', function() {
			$scope.doRefresh();
		});
	});