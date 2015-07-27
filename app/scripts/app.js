'use strict';

/**
 * @ngdoc overview
 * @name landlordApp
 * @description
 * # landlordApp
 *
 * Main module of the application.
 */
angular
  .module('landlordApp', [
    'ngAnimate',
    'ngTouch',
    'ionic',
    'angular-md5',
    'LocalStorageModule',
    'toaster'
  ])
  .constant('version', '1.0')
  .constant('serverConfig', {
    url: 'http://m.test.nonobank.com/msapi'
    // url: 'https://m.nonobank.com/msapi'
  })
  .constant('$ionicLoadingConfig', {
    template: '<ion-spinner icon="bubbles" class="spinner-energized"></ion-spinner>'
  })
  .config(function($httpProvider, $ionicConfigProvider, $provide) {
    $httpProvider.defaults.timeout = 5000;
    $httpProvider.interceptors.push(function($rootScope) {
      return {
        request: function(config) {
          return config;
        },
        response: function(response) {
          $rootScope.$broadcast('loading:hide')
          return response;
        }
      }
    });

    $ionicConfigProvider.tabs.position('bottom').style('standard');
    $ionicConfigProvider.backButton.text('').icon('ion-ios-arrow-left').previousTitleText(false);
    // $ionicConfigProvider.backButton.previousTitleText(false);

    $provide.decorator('$locale', ['$delegate', function($delegate) {
      if($delegate.id == 'en-us') {
        $delegate.NUMBER_FORMATS.PATTERNS[1].negPre = '-\u00A4';
        $delegate.NUMBER_FORMATS.PATTERNS[1].negSuf = '';
      }
      return $delegate;
    }]);
  })
  // service inits when involved
  .run(function($rootScope, $ionicSlideBoxDelegate, $state, $ionicHistory, $ionicLoading, version, appConfig, userConfig, $ionicPlatform, utils, $timeout, bankService) {
    $rootScope.passwordPattern = /^(?!\d+$|[a-zA-Z]+$|[\W-_]+$)[\s\S]{6,16}$/;

    if(appConfig.getVersion() != version) {
      appConfig.setVersion(version);
    }

    $rootScope.$on('loading:hide', function() {
      $ionicLoading.hide();
    })

  	$rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      $rootScope.isLogined = userConfig.isLogined();
      $rootScope.showHomeTabs = toState.name === 'tabs.home';

      // close modal and popup 
      if($rootScope.modal && $rootScope.modal._isShown) {
        $rootScope.modal.hide();
      }

      if($rootScope.alertModal && $rootScope.alertModal._isShown) {
        $rootScope.alertModal.hide();
      }

      if($rootScope.popup) {
        $rootScope.popup.close();
      }

  		switch(toState.name) {
        case 'startup':
          if(fromState.name === 'tabs.home') {
            event.preventDefault();
          }
          break;
        // case 'tabs.info':
        // case 'tabs.more':
        //   if(!userConfig.isLogined()) {
        //     event.preventDefault(); 

        //     var callMeOffFn = $rootScope.$on('loginSuc', function() {
        //       utils.disableBack();
        //       $state.go(toState.name);
        //       callMeOffFn();
        //     });

        //     utils.disableBack();
        //     $state.go('tabs.login');
        //   }
        //   break;
        case 'tabs.buy': 
          if(!userConfig.isLogined()) {
            event.preventDefault(); 

            var callMeOffFn = $rootScope.$on('loginSuc', function() {
              utils.disableBack();
              $state.go('tabs.home');

              $timeout(function() {
                $state.go(toState.name);
              }, 100);
              callMeOffFn();
            });

            utils.disableBack();
            $state.go('tabs.phone');
          }
          break;
        case 'tabs.phone':
        case 'tabs.login':
        case 'tabs.register':
        case 'tabs.retrievePassword':
          if(userConfig.isLogined()) {
            event.preventDefault();
            if(fromState.name !== 'tabs.setPayPassword') {
              utils.disableBack();
              $state.go('tabs.home');
            }
          }
          break;
        case 'tabs.setPayPassword':
          var accountInfo = userConfig.getAccountInfo();
          if(accountInfo && accountInfo.is_pay_password) {
            event.preventDefault();
            utils.disableBack();
            $state.go('tabs.home');
          }
          break;
        case 'tabs.order':
          if(fromState.name === 'tabs.selectCard') {
            console.log('xxxxxxxxx')
            $rootScope.$broadcast('backFromSeclecCard');
          }
          break;
  		}
  	});

    // auto login
    if(userConfig.isLogined()) {
      userConfig.autoLogin();
    }
  })
  .config(function($stateProvider, $urlRouterProvider) {
    $stateProvider

    .state('startup', {
      url: "/startup",
      templateUrl: "views/startup.html",
      controller: 'StartupCtrl'
    })

    // ************* main tabs start **************
    .state('tabs', { 
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html",
      controller: 'MainCtrl'
    })
    .state('tabs.home', {
      url: "/home",
      views: {
        'home-tab': {
          templateUrl: "views/home.html",
          controller: 'HomeCtrl'
        }
      }
    })
    .state('tabs.info', {
      url: "/info",
      views: {
        'info-tab': {
          templateUrl: "views/info.html",
          controller: 'InfoCtrl'
        }
      }
    })
    .state('tabs.welfare', {
      url: "/welfare",
      views: {
        'welfare-tab': {
          templateUrl: "views/welfare.html",
          controller: 'WelfareCtrl'
        }
      }
    })
    .state('tabs.more', {
      url: "/more",
      views: {
        'info-tab': {
          templateUrl: "views/more.html",
          controller: 'MoreCtrl'
        }
      }
    })
    // ************* main tabs end **************

    .state('tabs.subject', {
      url: "/subject",
      views: {
        'home-tab': {
          templateUrl: "views/subject.html",
          controller: 'SubjectCtrl'
        }
      }
    })
    .state('tabs.preview', {
      url: "/preview",
      views: {
        'home-tab': {
          templateUrl: "views/preview.html",
          controller: 'SubjectCtrl'
        }
      }
    })
    .state('tabs.rule', {
      url: "/rule",
      views: {
        'home-tab': {
          templateUrl: "views/rule.html",
          controller: 'SubjectCtrl'
        }
      }
    })
    .state('tabs.saleRecords', {
      url: "/saleRecords",
      views: {
        'home-tab': {
          templateUrl: "views/sale-records.html",
          controller: 'SubjectCtrl'
        }
      }
    })
    .state('tabs.coupons', {
      url: "/coupons?type",
      views: {
        'home-tab': {
          templateUrl: "views/my-coupons.html",
          controller: 'CouponCtrl'
        }
      }
    })
    .state('tabs.selectCard', {
      url: "/selectCard",
      views: {
        'home-tab': {
          templateUrl: "views/select-card.html",
          controller: 'SeclectCardCtrl'
        }
      }
    })
    .state('tabs.purchaseSuc', {
      url: "/purchaseSuc",
      views: {
        'home-tab': {
          templateUrl: "views/purchase-suc.html",
          controller: 'PurchaseSucCtrl'
        }
      }
    })

    // ************* views in more tab start **************
    .state('tabs.setting', {
      url: "/setting",
      views: {
        'info-tab': {
          templateUrl: "views/setting.html",
          controller: 'SettingCtrl'
        }
      }
    })
    .state('tabs.about', {
      url: "/about",
      views: {
        'info-tab': {
          templateUrl: "views/about.html",
          // controller: 'SettingCtrl'
        }
      }
    })
    
    .state('tabs.myCards', {
      url: "/myCards",
      views: {
        'info-tab': {
          templateUrl: "views/my-cards.html",
          controller: 'MyCardsCtrl'
        }
      }
    })
    .state('tabs.addCard', {
      url: "/addCard",
      views: {
        'info-tab': {
          templateUrl: "views/add-card.html",
          controller: 'AddCardCtrl'
        }
      }
    })
    .state('tabs.investRecords', {
      url: "/investRecords",
      views: {
        'info-tab': {
          templateUrl: "views/invest-records.html",
          controller: 'InvestRecordsCtrl'
        }
      }
    })
    .state('tabs.earnings', {
      url: "/earnings",
      views: {
        'info-tab': {
          templateUrl: "views/earnings.html",
          controller: 'EarningsCtrl'
        }
      }
    })
    .state('tabs.availableBalance', {
      url: "/availableBalance",
      views: {
        'info-tab': {
          templateUrl: "views/available-balance.html",
          controller: 'InfoCtrl'
        }
      }
    })
    .state('tabs.balanceRecords', {
      url: "/balanceRecords",
      views: {
        'info-tab': {
          templateUrl: "views/balance-records.html",
          controller: 'BalanceRecordsCtrl'
        }
      }
    })
    // ************* views in more tab end **************

    .state('tabs.feedback', {
      url: "/feedback",
      views: {
        'info-tab': {
          templateUrl: "views/feedback.html",
          // controller: 'SettingCtrl'
        }
      }
    })
    // .state('tabs.orders', {
    //   url: "/orders",
    //   views: {
    //     'info-tab': {
    //       templateUrl: "views/order-list.html",
    //       controller: 'OrdersCtrl'
    //     }
    //   }
    // })
    .state('tabs.house', {
      url: "/house",
      views: {
        'info-tab': {
          templateUrl: "views/house-detail.html",
          controller: 'HouseDetailCtrl'
        }
      }
    })
    .state('tabs.refund', {
      url: "/refund",
      views: {
        'info-tab': {
          templateUrl: "views/refund.html",
          controller: 'RefundCtrl'
        }
      }
    })
    .state('tabs.withdraw', {
      url: "/withdraw",
      views: {
        'info-tab': {
          templateUrl: "views/withdraw.html",
          controller: 'WithdrawCtrl'
        }
      }
    })
    .state('tabs.product', {
      url: "/product",
      views: {
        'info-tab': {
          templateUrl: "views/product.html",
          controller: 'ProductCtrl'
        }
      }
    })

    .state('tabs.buy', {
      url: "/buy",
      views: {
        'home-tab': {
          templateUrl: "views/buy.html",
          controller: 'BuyCtrl'
        }
      }
    })
    .state('tabs.order', {
      url: "/order",
      views: {
        'home-tab': {
          templateUrl: "views/order.html",
          controller: 'OrderCtrl'
        }
      }
    })
    .state('tabs.pay', {
      url: "/pay",
      views: {
        'home-tab': {
          templateUrl: "views/pay.html",
          controller: 'PayCtrl'
        }
      }
    })
    .state('tabs.retrievePayPassword', {
      url: "/retrievePayPassword",
      views: {
        'home-tab': {
          templateUrl: "views/retrieve-pay-password.html",
          controller: 'RetrieveTxPwdCtrl'
        }
      }
    })
    .state('tabs.tos', {
      url: "/tos",
      views: {
        'home-tab': {
          templateUrl: "views/tos.html",
          controller: 'TosCtrl'
        }
      }
    })
    .state('tabs.tosInfo', {
      url: "/tosInfo",
      views: {
        'info-tab': {
          templateUrl: "views/tos.html",
          controller: 'TosCtrl'
        }
      }
    })
    .state('tabs.QuickPayTos', {
      url: "/quickPayTos",
      views: {
        'home-tab': {
          templateUrl: "views/tos-quickpay.html",
          controller: 'TosCtrl'
        }
      }
    })
    .state('tabs.interestCoupon', {
      url: "/interestCoupon",
      views: {
        'home-tab': {
          templateUrl: 'views/interest-coupon.html',
          controller: 'InterestCouponCtrl'
        }
      }
    })
    .state('tabs.reserve', {
      url: "/reserve",
      views: {
        'home-tab': {
          templateUrl: 'views/reserve.html',
          controller: 'ReserveCtrl'
        }
      }
    })
    .state('tabs.reserveConfirm', {
      url: "/reserveConfirm",
      views: {
        'home-tab': {
          templateUrl: 'views/reserve-confirm.html',
          controller: 'ReserveConfirmCtrl'
        }
      }
    })
 // ************* account tabs start **************   
    .state('tabs.phone', {
    	url: "/phone",
    	views: {
    		'home-tab': {
    			templateUrl: "views/phone.html",
          controller: 'PhoneCtrl'
    		}
    	}
    })
    .state('tabs.login', {
    	url: "/login?phone",
    	views: {
    		'info-tab': {
    			templateUrl: "views/login.html",
          controller: 'LoginCtrl'
    		}
    	}
    })
    .state('tabs.register', {
      url: "/register?phone&sessionId",
      views: {
        'info-tab': {
          templateUrl: "views/register.html",
          controller: 'RegisterCtrl'
        }
      }
    })
    .state('tabs.setPayPassword', {
      url: "/setPayPassword",
      views: {
        'info-tab': {
          templateUrl: "views/set-pay-password.html",
          controller: 'SetPayPasswordCtrl'
        }
      }
    })
    .state('tabs.retrievePassword', {
      url: '/retrievePassword?phone',
      views: {
        'info-tab': {
          templateUrl: 'views/retrieve-password.html',
          controller: 'RetrievePasswordCtrl'
        }
      }
    })
// ************* account tabs end **************   
    .state('tabs.recharge', {
      url: '/recharge',
      views: {
        'home-tab': {
          templateUrl: 'views/recharge.html',
          controller: 'RechargeCtrl'
        }
      }
    })
    .state('tabs.rechargeNew', {
      url: '/rechargeNew',
      views: {
        'home-tab': {
          templateUrl: 'views/recharge-new.html',
          controller: 'RechargeCtrl'
        }
      }
    })
    .state('tabs.recharge:info', {
      url: '/rechargeInfo',
      views: {
        'info-tab': {
          templateUrl: 'views/recharge.html',
          controller: 'RechargeCtrl'
        }
      }
    })
    .state('tabs.rechargeNewInfo', {
      url: '/rechargeNewInfo',
      views: {
        'info-tab': {
          templateUrl: 'views/recharge-new.html',
          controller: 'RechargeCtrl'
        }
      }
    })
    .state('tabs.kyc', {
      url: '/kyc',
      views: {
        'info-tab': {
          templateUrl: 'views/kyc.html',
          controller: 'KycCtrl'
        }
      }
    })
    .state('tabs.gesture', {
      url: '/gesture?action',
      views: {
        'info-tab': {
          templateUrl: 'views/gesture.html',
          controller: 'GestureCtrl'
        }
      }
    })
    .state('tabs.changePassword', {
      url: '/changePassword',
      views: {
        'info-tab': {
          templateUrl: 'views/change-password.html',
          controller: 'ChangePasswordCtrl'
        }
      }
    })
    .state('tabs.changePayPassword', {
      url: '/changePayPassword',
      views: {
        'info-tab': {
          templateUrl: 'views/change-password.html',
          controller: 'ChangePayPasswordCtrl'
        }
      }
    })

    
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/tab/home');
  });
