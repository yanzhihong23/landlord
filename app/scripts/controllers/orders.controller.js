'use strict';

angular.module('landlordApp')
	.controller('OrdersCtrl', function($scope, $rootScope, $state, accountService, localStorageService, userConfig, LandlordApi, utils, $ionicSlideBoxDelegate, subjectService) {
		var ids = accountService.investingIds,
				sessionId = userConfig.getSessionId(),
				oItems = [];

		$scope.items = [];

		if(ids && ids.length) {
			for(var i=0, len = ids.length; i<len; i++) {
				LandlordApi.getLandlordProfitDetail(sessionId, ids[i])
					.success(function(data) {
						if(data.flag === 1) {
							data = data.data;

							var annualYield = data.finance_plan.fp_expect + '%';

							var refundPeriods = data.baList.map(function(obj) {
								return {
									index: obj.ba_expect,
									date: obj.ba_time_formate,
									amount: obj.ba_expect === data.baList.length ? obj.ba_price : obj.ba_price_l,
									status: obj.status
								};
							});

							var previews = data.landlord_atts.map(function(obj) {
								return obj.path;
							});

							var buyRecords = data.vipAccounts[0].vfInfo.map(function(obj) {
								if(obj.ir_p_type == '1') {
									annualYield += '(' + obj.value + '%)';
								}

								return {
									date: obj.vf_service_time,
									amount: obj.vf_amount,
									annualYield: annualYield
								};
							});

							$scope.items.push({
								title: data.finance_plan.fp_title,
								duration: data.finance_plan.fp_expect,
								buyRecords: buyRecords,
								refundPeriods: refundPeriods,
								previews: previews
							});
							oItems.push(data);
						}
					});
			}
		}

		$scope.showHouse = function(index) {
			subjectService.previews = $scope.items[index].previews;
			$state.go('tabs.house');
		};

		$scope.showRefund = function(index) {
			subjectService.refundPeriods = $scope.items[index].refundPeriods;
			$state.go('tabs.refund');
		}

		$scope.goToTos = function(index) {
			var item = oItems[index];
	    var records = item.vipAccounts[0].vfInfo.map(function(obj) {
	      return {
	        date: obj.vf_service_time,
	        amount: obj.vf_amount
	      }
	    })
			$rootScope.landlord = {
				total: item.invest,
				fp_title: item.finance_plan.fp_title,
				fp_price_max: item.finance_plan.fp_price_max,
				fp_start_date: item.finance_plan.fp_start_date,
				fp_end_date: utils.getDate(utils.addMonth(new Date(item.finance_plan.fp_start_date), ~~item.finance_plan.fp_expect)),
				fp_expect: item.finance_plan.fp_expect,
				fp_rate_min: item.finance_plan.fp_rate_min,
				fp_publish_date: utils.getDate(item.finance_plan.fp_publish_date.split(' ')[0]),
				va_extno: item.vipAccounts[0].va_extno,
	      records: records
			}
			$state.go('tabs.tosInfo');
		};
	})
	.controller('HouseDetailCtrl', function($scope, subjectService) {
		$scope.previews = subjectService.previews;
	})
	.controller('RefundCtrl', function($scope, subjectService) {
		$scope.refundPeriods = subjectService.refundPeriods;
	})