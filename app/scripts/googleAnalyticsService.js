(function(angular) { 

  angular.module('google-analytics', ['ng']).service('analytics', [
    '$rootScope', '$window', '$location', function($rootScope, $window, $location) {
      var track = function() {
        console.log($location.path());
        ga('send', 'pageview', {'page': $location.path()});
      };
      $rootScope.$on('$routeChangeSuccess', track);
    }
  ]);

}(window.angular));