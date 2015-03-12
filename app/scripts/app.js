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
  .run(function($rootScope, $ionicNavBarDelegate, $ionicHistory, userConfig) {
  	$rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
  		switch(toState.name) {
  			case 'tabs.home':
  			case 'account.info':
        case 'account.phone':
        case 'account.setPayPassword':
  				$ionicNavBarDelegate.showBackButton(false);
  				break;
				default:
					$ionicNavBarDelegate.showBackButton(true);
  		}
  	});

    // auto login
    if(userConfig.isLogined) {
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
    .state('tabs.forgotTxPwd', {
      url: "/forgotTxPwd",
      views: {
        'home-tab': {
          templateUrl: "views/forgotTxPwd.html",
          controller: 'RetrieveTxPwdCtrl'
        }
      }
    })
    .state('tabs.tos', {
      url: "/tos",
      views: {
        'home-tab': {
          templateUrl: "views/tos.html"
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
    			templateUrl: "views/phone.html",
    			controller: 'LoginCtrl'
    		}
    	}
    })
    .state('account.login', {
    	url: "/login",
    	views: {
    		'home-tab': {
    			templateUrl: "views/login.html",
    			controller: 'LoginCtrl'
    		}
    	}
    })
    .state('account.register', {
      url: "/register",
      views: {
        'home-tab': {
          templateUrl: "views/register.html",
          controller: 'LoginCtrl'
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

    
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/tab/home');
  });
