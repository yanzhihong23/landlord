'use strict';

angular.module('landlordApp')
	.service('orderService', function($rootScope, $state, $ionicModal, $ionicLoading, userConfig, md5, utils, UserApi, PayApi) {
		this.subject = null;
		this.order = null;

		var self = this;

		this.purchase = function($scope) {
			$scope.modalCancel = function() {
				$scope.purchaseModal.hide();
			};

			$scope.modalConfirm = function() {
				var accountInfo = userConfig.getAccountInfo(),
						sessionId = userConfig.getSessionId(),
						mId = accountInfo.m_id,
						payCode = 1, // buy
						payMode = $scope.order.payMode,
						payPassword = md5.createHash($scope.order.payPassword),
						extRefNo;

				$ionicLoading.show();

				UserApi.generateOrderNo(sessionId).success(function(data) {
					if(data.flag === 1) {
						extRefNo = data.data;

						var params = {
							mId: mId,
							sessionId: sessionId,
							extRefNo: extRefNo,
							storablePan: $scope.order.card && $scope.order.card.value, // todo
							bankId: $scope.order.card && $scope.order.card.id,
							count: $scope.order.volume,
							key: self.subject.subject.id,
							type: $scope.order.type || 1, // 1: buy, 5: reserve
							payMode: $scope.order.payMode,
							payCode: payCode,
							payPassword: payPassword,
							coupon: $scope.order.coupon && $scope.order.coupon.sum,
							interest: $scope.order.interest && $scope.order.interest.sum
						};

						$ionicLoading.show();
						PayApi.quickPay(params)
							.success(function(data) {
								if(data.flag === 1) {
									$scope.purchaseModal.hide();
									$scope.order.payPassword = null; // clear password
									// $rootScope.$broadcast('landlordUpdated');
									$scope.emit('purchaseSuc');
								} else if(/密码错误/.test(data.msg)) { // wrong password
									$scope.purchaseModal.hide();

									utils.confirm({
										content: '支付密码不正确',
										okText: '重新输入',
										onCancel: function() {
											$scope.purchaseModal.show();
										},
										onOk: function() {
											$scope.purchaseModal.show();
											$scope.order.payPassword = null;
										}
									})
								} else {
									$scope.purchaseModal.hide();
									utils.alert({content: data.msg});
								}
							});
					}
				});
			};

			$scope.selectCard = function() {
				$scope.purchaseModal.hide();
				$state.go('tabs.selectCard');
			};

			$rootScope.$on('backFromSeclecCard', function() {
				console.log('backFromSeclecCard');
				$scope.purchaseModal.show();
			});

			// open purchase modal
			$ionicModal.fromTemplateUrl('templates/purchase-modal.html', {
				scope: $scope,
				animation: 'slide-in-up'
			}).then(function(modal) {
		    $scope.purchaseModal = modal;
		    $scope.purchaseModal.show();
		  });

		}
	})