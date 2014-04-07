var mainApp = angular.module("mainApp", [
  "ngRoute",
  "ngAnimate",
  "ngSanitize",
  "ui.bootstrap",
  "vcRecaptcha",
  "videosharing-embed",
  "google-maps",
  "FacebookPluginDirectives",
  "google-analytics"]);

mainApp.controller("NavigationCtrl", function ($scope, $location, $anchorScroll, $modal, analytics) {

  var ModalInstanceCtrl = function ($scope, $modalInstance) {

    $scope.ok = function () {
      $modalInstance.close();
    };
  };

  $scope.model = {isCollapsed: true};
	$scope.currentPage = "home";
  $scope.pages = [
          {label:'Home', location:'home'},
          {label:'Bio', location:'bio'},
          {label:'Contact', location:'contact'},
          ];
	$scope.gotoPage = function(item) {
    if(item.location)
    {
  		$scope.currentPage = item.location;
  		$location.path("/"+item.location);
    }
    else
    {
      $scope.currentPage = item;
      $location.path("/"+item);
    }
    $scope.model.isCollapsed=!$scope.model.isCollapsed;
	};

  $scope.showDisclosure = function() {
    var modalInstance = $modal.open({
      templateUrl: 'views/disclosureModal.html',
      controller: ModalInstanceCtrl
    });
  }

	$scope.initialize = function() {
 		$scope.currentPage = $location.path().substring(1);
	}();


	$scope.goHome = function() {
		$scope.currentPage = "home";
		$location.path("/home")
	};

    $scope.itemClass = function(item) {
        return item.location === $scope.currentPage ? 'active' : undefined;
    };
}).controller("ServicesCtrl", function($scope) {
  $scope.servicePages = [
          {label:'Individual, Joint, and Trust Accounts', location:'indivJointAndTrust'},
          {label:'IRA Rollovers', location:'ourServices'},
          {label:'Traditional and Roth IRA\'s', location:'resources'},
          {label:'Annuity Contracts and Life Insurance', location:'aboutUs'},
          {label:'Company 401K Plans', location:'company401Kplans'}
          ];
}).directive("twitterTimeline", function() {
  return {
    //C means class E means element A means attribute, this is where this directive should be found
    restrict: 'C',
    link: function(scope, element, attributes) {

        !function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+"://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");
    }
  };
}).controller("ContactCtrl", function($scope, $http, vcRecaptchaService) {
  $scope.model = {
    mapOpts: {
      center: new google.maps.LatLng(39.9378290,-91.3677205),
      draggable:false,
      markers: [  
                  {
                    latitude:39.9374193,
                    longitude:-91.3677205,
                    infoWindow:"<div id='infoWindowWrapper'><h3>Shankland Financial Advisors</h3><a href=\"http://maps.google.com?daddr=520 North 30th, Quincy, IL 82301\">Get Directions</a><br/><br/>Or Call<br/><a href=\"tel:6309154490\">217-224-2808</a><br/><br/>M-F 8AM-5PM</div>",
                    infoWindowOpen:true,
                    icon:"http://www.clker.com/cliparts/W/0/g/a/W/E/map-pin-red.svg"}], // an array of markers,
      markersSelected:[],
      zoom: 18, // the zoom level
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }
  };

  $scope.submit = function (subject, name, email, phone, comment) {
    //packaging up data in JSON object to send to server for easy parsing.
    var contactInfo = {subject:subject, name:name, email:email, phone:phone, comment:comment};


    var enteredData = vcRecaptchaService.data()
    console.log('sending the captcha response to the server', enteredData);

    // You need to implement your server side validation here.
    // Send the model.captcha object to the server and use some of the server side APIs to validate it
    // See https://developers.google.com/recaptcha/docs/

    $http.post("php/recaptcha/verify.php", enteredData).success(function(data){
        console.log('Success');

        $http.post("php/contact.php", contactInfo).success(function(data) {
          alert('Message sent, thank you!');
        }).error(function(data) {
          alert('Could not send message please supply an e-mail and try again.')
        });
    }).error(function(data) {

        alert('Captcha failed please try again.');
        console.log('Failed validation');

        // In case of a failed validation you need to reload the captcha because each challenge can be checked just once
        vcRecaptchaService.reload();
    })
  };
}).controller("VideoCtrl", function($scope) {
  $scope.videos = ["https://www.youtube.com/watch?v=4AivEQmfPpk", "https://www.youtube.com/watch?v=y5UT04p5f7U"];
  $scope.currentVideoIndex = 0;
  $scope.selectedVideo = $scope.videos[0];

  $scope.loadNextVideo = function()
  {
    if($scope.currentVideoIndex+1<$scope.videos.length)
      $scope.currentVideoIndex++;
    else
      $scope.currentVideoIndex=0;
    $scope.selectedVideo = $scope.videos[$scope.currentVideoIndex];
  }
  $scope.loadPreviousVideo = function()
  {
    if($scope.currentVideoIndex-1>=0)
      $scope.currentVideoIndex--;
    else
      $scope.currentVideoIndex=$scope.videos.length-1;
    $scope.selectedVideo = $scope.videos[$scope.currentVideoIndex];
  }
});

mainApp.config(function($routeProvider){
	$routeProvider.
		when("/", {templateUrl:'views/home.html'}).
    when("/home", {templateUrl:'views/home.html'}).
    when("/howWeWork", {templateUrl:'views/howWeWork.html'}).
    when("/clientStories", {templateUrl:'views/clientStories.html'}).
    when("/attorneysAndCPAs", {templateUrl:'views/attorneysAndCPAs.html'}).
    when("/individuals", {templateUrl:'views/individuals.html'}).
    when("/resources", {templateUrl:'views/resources.html'}).
    when("/bio", {templateUrl:'views/bio.html'}).
    when("/contact", {templateUrl:'views/contact.html'}).
		otherwise({redirectTo:"/"});
});