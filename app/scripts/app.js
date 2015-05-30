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
    url: 'https://m-test.nonobank.com/msapi'
  })
  .constant('$ionicLoadingConfig', {
    template: '<ion-spinner icon="bubbles" class="spinner-accent"></ion-spinner>'
  })
  .config(function($httpProvider, $ionicConfigProvider) {
    $httpProvider.defaults.timeout = 5000;
    $httpProvider.interceptors.push('httpInterceptor');

    $ionicConfigProvider.tabs.position('bottom').style('standard');
  })
  // service inits when involved
  .run(function($rootScope, $ionicSlideBoxDelegate, $state, $ionicHistory, version, appConfig, userConfig, $ionicPlatform, utils, $timeout, bankService) {
    if(appConfig.getVersion() != version) {
      appConfig.setVersion(version);
    }

  	$rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      $rootScope.isLogined = userConfig.isLogined();
      
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
        case 'tabs.info':
        case 'tabs.more':
          if(!userConfig.isLogined()) {
            event.preventDefault(); 

            var callMeOffFn = $rootScope.$on('loginSuc', function() {
              utils.disableBack();
              $state.go(toState.name);
              callMeOffFn();
            });

            utils.disableBack();
            $state.go('tabs.phone');
          }
          break;
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
  		}
  	});

    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
      if(!/tabs.home|tabs.history|tabs.info|tabs.more/.test(toState.name)) {
        angular.element(document.querySelector('.tab-nav.tabs')).addClass('hidden');
        // $rootScope.$on('$ionicView.enter', function() {
          // angular.element(document.querySelectorAll('ion-content.has-tabs')).removeClass('has-tabs');
        // })
      } else {
        angular.element(document.querySelector('.tab-nav.tabs')).removeClass('hidden');
      }

      $timeout(function() {
        $ionicSlideBoxDelegate.update();
      }, 50);
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
    .state('tabs.history', {
      url: "/history",
      views: {
        'history-tab': {
          templateUrl: "views/history.html",
          controller: 'HistoryCtrl'
        }
      }
    })
    .state('tabs.more', {
      url: "/more",
      views: {
        'more-tab': {
          templateUrl: "views/more.html",
          controller: 'MoreCtrl'
        }
      }
    })
    // ************* main tabs end **************

    // ************* views in more tab start **************
    .state('tabs.setting', {
      url: "/setting",
      views: {
        'more-tab': {
          templateUrl: "views/setting.html",
          controller: 'SettingCtrl'
        }
      }
    })
    .state('tabs.about', {
      url: "/about",
      views: {
        'more-tab': {
          templateUrl: "views/about.html",
          // controller: 'SettingCtrl'
        }
      }
    })
    .state('tabs.feedback', {
      url: "/feedback",
      views: {
        'more-tab': {
          templateUrl: "views/feedback.html",
          // controller: 'SettingCtrl'
        }
      }
    })
    .state('tabs.myCards', {
      url: "/myCards",
      views: {
        'more-tab': {
          templateUrl: "views/my-cards.html",
          controller: 'MyCardsCtrl'
        }
      }
    })
    .state('tabs.addCard', {
      url: "/addCard",
      views: {
        'more-tab': {
          templateUrl: "views/add-card.html",
          controller: 'AddCardCtrl'
        }
      }
    })
    // ************* views in more tab end **************

    .state('tabs.orders', {
      url: "/orders",
      views: {
        'info-tab': {
          templateUrl: "views/order-list.html",
          controller: 'OrdersCtrl'
        }
      }
    })
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
    		'home-tab': {
    			templateUrl: "views/login.html",
          controller: 'LoginCtrl'
    		}
    	}
    })
    .state('tabs.register', {
      url: "/register?phone&sessionId",
      views: {
        'home-tab': {
          templateUrl: "views/register.html",
          controller: 'RegisterCtrl'
        }
      }
    })
    .state('tabs.setPayPassword', {
      url: "/setPayPassword",
      views: {
        'home-tab': {
          templateUrl: "views/set-pay-password.html",
          controller: 'SetPayPasswordCtrl'
        }
      }
    })
    .state('tabs.retrievePassword', {
      url: '/retrievePassword?phone',
      views: {
        'home-tab': {
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
    .state('tabs.rechargeInfo', {
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
        'more-tab': {
          templateUrl: 'views/kyc.html',
          controller: 'KycCtrl'
        }
      }
    })
    .state('tabs.gesture', {
      url: '/gesture?action',
      views: {
        'more-tab': {
          templateUrl: 'views/gesture.html',
          controller: 'GestureCtrl'
        }
      }
    })
    .state('tabs.changePassword', {
      url: '/changePassword',
      views: {
        'more-tab': {
          templateUrl: 'views/change-password.html',
          controller: 'ChangePasswordCtrl'
        }
      }
    })
    .state('tabs.changePayPassword', {
      url: '/changePayPassword',
      views: {
        'more-tab': {
          templateUrl: 'views/change-password.html',
          controller: 'ChangePayPasswordCtrl'
        }
      }
    })

    
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/tab/home');
  });
