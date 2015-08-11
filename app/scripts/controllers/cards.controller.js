'use strict';

angular.module('landlordApp')
	.controller('MyCardsCtrl', function($scope, $rootScope, $state, bankService, BankApi, utils, userConfig) {
		var init = function() {
			console.log('------------- init MyCardsCtrl --------------');
			$scope.cardList = bankService.getBoundBankList();
		};

		$scope.addNew = function() {
			var accountInfo = userConfig.getAccountInfo();
			if(accountInfo.realname && accountInfo.idnum) {
				$state.go('tabs.addCard');
			} else {
				$state.go('tabs.kyc', {flow: 'kycAddCard'});
			}
		};

		$scope.delete = function(index) {
			utils.confirm({
				content: '确定要删除这张银行卡吗？',
				okType: 'button-balanced',
				onOk: function() {
					var sessionId = userConfig.getSessionId(),
							bankId = $scope.cardList[index].id;
					BankApi.deleteCard(sessionId, bankId).success(function(data) {
						if(data.flag === 1) {
							$scope.cardList.splice(index, 1);
							bankService.updateBoundBankList();
						} else {
							utils.alert({content: data.msg});
						}
					});
				}
			})
		};

		$rootScope.$on('boundBankListUpdated', function(evt) {
			init();
		});

		init();
	})
	.controller('AddCardCtrl', function($scope, $stateParams, $rootScope, $state, userConfig, UserApi, PayApi, bankService, orderService, toaster, $ionicLoading, utils) {
		var accountInfo = userConfig.getAccountInfo(),
				sessionId = userConfig.getSessionId(),
				params = {
					sessionId: sessionId,
					realname: accountInfo.realname,
					idNo: accountInfo.idnum,
					mId: accountInfo.m_id,
					idType: 0,
					count: 1,
					key: null,
					type: null,
					payCode: 2,
					payMode: 1
				};

		$scope.order = bankService.order;
		$scope.clicked = false;
		$scope.bankList = bankService.getBankList();
		$scope.order.card = $scope.bankList[0];
		$scope.order.realname = accountInfo.realname; // for page display


		$scope.selectBank = function() {
			$state.go('tabs.selectCard:new');
		};

		$scope.sendSms = function(resend) {
			$scope.clicked = true;

			$ionicLoading.show();
			UserApi.generateOrderNo(sessionId).success(function(data) {
				if(data.flag === 1) {
					params.extRefNo = data.data;
					params.bankCardNo = $scope.order.cardNo;
					params.mobile = $scope.order.phone;

					$ionicLoading.show();
					PayApi.getPayVcode(params).success(function(data) {
						if(data.flag === 1) {
							params.storablePan = data.storablePan;
							params.token = data.token;
							params.bankCode = $scope.order.card.id;

							bankService.order.params = params;
							$state.go('tabs.addCard:sms', {flow: $stateParams.flow});
						} else {
							utils.alert({
								content: data.msg
							});
						}
					})
				}
			}).finally(function() {
				$scope.clicked = false;
			});
		};

		$scope.next = function() {
			$scope.sendSms();
		};
	})
	.controller('AddCardVerifyCtrl', function($scope, $stateParams, $rootScope, $state, userConfig, UserApi, PayApi, bankService, orderService, $ionicLoading, utils, md5) {
		var accountInfo = userConfig.getAccountInfo(),
				sessionId = userConfig.getSessionId(),
				resendCountdown = utils.resendCountdown($scope);

		$scope.order = bankService.order;

		var params = $scope.order.params;

		resendCountdown();

		$scope.sendSms = function() {
			$scope.clicked = true;

			$ionicLoading.show();

			PayApi.getPayVcode(params).success(function(data) {
				if(data.flag === 1) {
					params.storablePan = data.storablePan;
					params.token = data.token;
				} else {
					utils.alert({
						content: data.msg
					});
				}
			}).finally(function() {
				$scope.clicked = false;
			});
		};

		$scope.submit = function() {
			$ionicLoading.show();

			params.vcode = $scope.order.vcode;
			PayApi.bindAndPay(params).success(function(data) {
				if(data.flag === 1) {
					// update bankService
					bankService.updateBoundBankList();

					if(accountInfo.is_pay_password) {
						goBack();
					} else {
						setPayPassword();
					}
				} else {
					utils.alert({
						content: data.msg
					});
				}
			})
		};

		var goBack = function() {
			var backDeep = $stateParams.flow === 'kycAddCard' ? -3 : -2;
			utils.goBack(backDeep);
		};

		var setPayPassword = function() {
			$scope.passwordPattern = utils.passwordPattern;
			$scope.data = {};

			// An elaborate, custom popup
			var myPopup = $ionicPopup.show({
			  template: '<div class="item item-input"><input type="password" ng-model="data.payPassword" ng-pattern="passwordPattern" placeholder="支付密码"></div>',
			  title: '设置支付密码',
			  subTitle: '6-16位，至少包含数字、字母、符号中的2种',
			  scope: $scope,
			  cssClass: 'popup-large',
			  buttons: [
			    {
			      text: '<b>确定</b>',
			      type: 'button-balanced',
			      onTap: function(e) {
			        if (!$scope.data.payPassword) {
			          //don't allow the user to close unless he enters wifi password
			          e.preventDefault();
			        } else {
			          return $scope.data.payPassword;
			        }
			      }
			    }
			  ]
			});

			myPopup.then(function(res) {
			  console.log('Tapped!', res);
			  $ionicLoading.show();
			  UserApi.setPayPassword(sessionId, md5.createHash($scope.data.payPassword))
			  	.success(function(data) {
			  		if(data.flag === 1) {
			  			utils.alert({
			  				content: '支付密码设置成功',
			  				callback: function() {
			  					goBack();
			  				}
			  			});
			  		} else {
			  			utils.alert({content: data.msg});
			  		}
			  	})
			});
		};
	})