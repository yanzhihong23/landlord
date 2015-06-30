'use strict';

angular.module('landlordApp')
	.controller('EnvoyCtrl', function($scope, $rootScope, $state, $ionicModal, $timeout, userConfig, utils) {
		$scope.myEnvoy = function() {
			$state.go('tabs.myEnvoy');
		};

		$scope.invite = function() {
			if(userConfig.isLogined()) {
				$scope.modal.show();

				$timeout(function() {
					$scope.modal.hide();
				}, 5000);
			} else {
				var callMeOffFn = $rootScope.$on('loginSuc', function() {
				  utils.disableBack();
				  $state.go('tabs.envoy');
				  callMeOffFn();
				});

				utils.disableBack();
				$state.go('account.phone');
			}
		};

  	$ionicModal.fromTemplateUrl('templates/share-modal.html', {
	    scope: $scope,
	    animation: 'slide-in-up'
	  }).then(function(modal) {
	    $scope.modal = modal;
	  });
 	})
 	.controller('MyEnvoyCtrl', function($scope, ActivityApi, userConfig) {
 		$scope.balance = {};

 		ActivityApi.getEnvoyInfo(userConfig.getSessionId())
 			.success(function(data) {
 				if(data.flag === 1) {
 					console.log('success');
 					$scope.balance.total = data.data.all;
 					
 					$scope.envoyList = data.data.details.map(function(obj) {
 						return {
 							phone: obj.phone.substr(0,3) + '****' + obj.phone.substr(-4),
 							invested: +obj.priceall,
 							reward: +obj.notpay + +obj.payed,
 							settled: +obj.payed
 						};
 					});
 				} else if(data.flag === 2) {

 				}
 			})
 	})