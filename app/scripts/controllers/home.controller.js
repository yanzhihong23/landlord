'use strict';

angular.module('landlordApp')
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

	});