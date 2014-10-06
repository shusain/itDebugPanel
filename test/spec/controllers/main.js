'use strict';

describe('Controller: MainCtrl', function () {

  // load the controller's module
  beforeEach(module('mainApp'));

  var MainCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    MainCtrl = $controller('TestCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of pages to the scope', function () {
    expect(scope.pages.length).toBe(3);
  });
});
