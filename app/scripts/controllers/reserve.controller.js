'use strict';

angular.module('landlordApp')
	.controller('ReserveCtrl', function($scope, $state, $timeout, $ionicSlideBoxDelegate, LandlordApi, orderService) {
		orderService.order = null;

		$scope.calender = {};
		$scope.order = {};
		$scope.showCalender = false;
		$scope.$watch('showCalender', function(val) {
			$timeout(function() {
				$ionicSlideBoxDelegate.$getByHandle('calender').update();
			}, 50);
		});

		$scope.showCalenderFn = function() {
			$scope.showCalender = true;
		};

		$scope.previousMonth = function() {
			$ionicSlideBoxDelegate.previous();
		};

		$scope.nextMonth = function() {
			$ionicSlideBoxDelegate.next();
		};

		$scope.select = function(month, index) {
			$scope.order.selected = $scope.calender[month][index];
			$scope.showCalender = false;
		};

		$scope.reserve = function() {
			orderService.order = $scope.order;
			$state.go('tabs.reserveConfirm');
		};

		var localWeek = function(index) {
			switch(index) {
				case 1:
					return '周一';
				case 2:
					return '周二';
				case 3:
					return '周三';
				case 4:
					return '周四';
				case 5:
					return '周五';
				case 6:
					return '周六';
				case 0:
					return '周日';
			}
		}

		LandlordApi.reserveList().success(function(data) {
			if(data.flag === 1) {
				data.data.list.forEach(function(obj) {
					var year = moment(obj.date).year(),
							month = moment(obj.date).month() + 1,
							day = moment(obj.date).date();

					obj.year = year;
					obj.localDate = month + '月' + day + '日';
					obj.localWeek = localWeek(moment(obj.date).day());

					if(!$scope.calender[month]) {
						$scope.calender[month] = [];
					}

					$scope.calender[month].push(obj);

					if(!$scope.order.selected) {
						$scope.order.selected = obj;
					}
				});


				console.log($scope.calender);
			}
		})
	})
	.controller('ReserveConfirmCtrl', function($scope, orderService, accountService, bankService, utils) {
		$scope.balance = accountService.balance;
		$scope.order = orderService.order;
		$scope.order.pay = 200;
		$scope.order.volume = $scope.order.amount;
		$scope.order.type = 5;
		orderService.subject = {
			subject: {
				id: orderService.order.selected.subject_id
			}
		};

		$scope.showEarnestDesc = function() {
			utils.alert({
				title: '定金说明',
				cssClass: 'popup-large',
				contentUrl: 'templates/earnest.html',
				okType: 'button-balanced'
			});
		};

		$scope.confirm = function() {
			if($scope.order.pay > $scope.balance.available) {
				$scope.bankCards = bankService.getBoundBankList();
				if($scope.bankCards.length){
					$scope.order.card = $scope.bankCards[$scope.bankCards.length - 1];
					$scope.order.payMode = 3;
				}
			} else {
				$scope.order.payMode = 2;
			}

			orderService.purchase($scope);
		};

		$scope.$on('purchaseSuc', function() {
			$state.go('tabs.reserveSuc');
		});
	})
	.controller('ReserveSucCtrl', function($scope, orderService) {

	})