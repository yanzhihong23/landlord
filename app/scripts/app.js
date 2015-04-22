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
  .constant('serverConfig', {
    url: 'https://m-test.nonobank.com/msapi'
  })
  .constant('$ionicLoadingConfig', {
    template: '<ion-spinner icon="bubbles" class="spinner-accent"></ion-spinner>'
  })
  .config(function($httpProvider) {
    $httpProvider.defaults.timeout = 5000;
    $httpProvider.interceptors.push('httpInterceptor');
  })
  // service inits when involved
  .run(function($rootScope, $ionicSlideBoxDelegate, $state, $ionicHistory, userConfig, $ionicPlatform, utils, $timeout, bankService) {
  	$rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      if($rootScope.modal && $rootScope.modal._isShown) {
        $rootScope.modal.hide();
      }

      if($rootScope.alertModal && $rootScope.alertModal._isShown) {
        $rootScope.alertModal.hide();
      }

  		switch(toState.name) {
        case 'tabs.startup':
          if(fromState.name === 'tabs.home') {
            // event.preventDefault();
          }
          break;
        case 'account.info':
          if(!userConfig.isLogined()) {
            event.preventDefault(); 

            var callMeOffFn = $rootScope.$on('loginSuc', function() {
              utils.disableBack();
              $state.go(toState.name);
              callMeOffFn();
            });

            utils.disableBack();
            $state.go('account.phone');
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
            $state.go('account.phone');
          }
          break;
        case 'account.phone':
        case 'account.login':
        case 'account.register':
        case 'account.retrievePassword':
          if(userConfig.isLogined()) {
            event.preventDefault();
            if(fromState.name !== 'account.setPayPassword') {
              utils.disableBack();
              $state.go('tabs.home');
            }
          }
          break;
        case 'account.setPayPassword':
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

    .state('tabs', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html",
      controller: 'MainCtrl'
    })
    .state('tabs.startup', {
      url: "/startup",
      views: {
        'home-tab': {
          templateUrl: "views/startup.html",
          controller: 'StartupCtrl'
        }
      }
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
          templateUrl: "views/interest-coupon.html",
          controller: 'InterestCouponCtrl'
        }
      }
    })
    .state('account', {
    	url: "/account",
    	abstract: true,
    	templateUrl: "templates/account.html",
      controller: 'AccountCtrl'
    })
    .state('account.info', {
    	url: "/info",
    	views: {
    		'home-tab': {
    			templateUrl: "views/info.html",
    			controller: 'InfoCtrl'
    		}
    	}
    })
    .state('account.phone', {
    	url: "/phone",
    	views: {
    		'home-tab': {
    			templateUrl: "views/phone.html"
    		}
    	}
    })
    .state('account.login', {
    	url: "/login",
    	views: {
    		'home-tab': {
    			templateUrl: "views/login.html"
    		}
    	}
    })
    .state('account.register', {
      url: "/register",
      views: {
        'home-tab': {
          templateUrl: "views/register.html"
        }
      }
    })
    .state('account.setPayPassword', {
      url: "/setPayPassword",
      views: {
        'home-tab': {
          templateUrl: "views/set-pay-password.html"
        }
      }
    })
    .state('account.retrievePassword', {
      url: '/retrievePassword',
      views: {
        'home-tab': {
          templateUrl: 'views/retrieve-password.html',
          controller: 'RetrievePasswordCtrl'
        }
      }
    })
    .state('account.recharge', {
      url: '/recharge',
      views: {
        'home-tab': {
          templateUrl: 'views/recharge.html',
          controller: 'RechargeCtrl'
        }
      }
    })
    .state('account.rechargeNew', {
      url: '/rechargeNew',
      views: {
        'home-tab': {
          templateUrl: 'views/recharge-new.html',
          controller: 'RechargeCtrl'
        }
      }
    })

    
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/tab/startup');
  });
