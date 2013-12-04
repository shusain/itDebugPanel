/**!
 * The MIT License
 * 
 * Copyright (c) 2010-2012 Google, Inc. http://angularjs.org
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * angular-google-maps
 * https://github.com/nlaplante/angular-google-maps
 * 
 * @author Nicolas Laplante https://plus.google.com/108189012221374960701
 */

(function () {
  
  "use strict";
  
  /*
   * Utility functions
   */
  
  /**
   * Check if 2 floating point numbers are equal
   * 
   * @see http://stackoverflow.com/a/588014
   */
  function floatEqual (f1, f2) {
    return (Math.abs(f1 - f2) < 0.000001);
  }
  
  /* 
   * Create the model in a self-contained class where map-specific logic is 
   * done. This model will be used in the directive.
   */
  
  var MapModel = (function () {
    
    /**
     * 
     */
    function PrivateMapModel(opts, selectedMarkersChanged) {
      
      //locally scoped variables
      //var somePrivateLocalVar = 'someValue';

      var _instance = null,
        _rectangle = null,      // used to show a selection region
        _markers = [],          // caches the instances of google.maps.Marker
        _handlers = [],         // event handlers
        _windows = [],          // InfoWindow objects
        currentInfoWindow = null,
        markersShown = [],
        markersSelected = [],
        dragging=false,
        selector = opts.container,
        markers = [],
        that = this;
        //that = this Creates a reference to the PrivateMapModel instance so regardless
        //of function execution context any variable references to that will refer to
        //variables/functions of the PrivateMapModel defined herein whereas this may vary


      //Public instance variables/functions
      //this.something = 'someValue';

      //MapOpts is being left accessible so when the properties (zoom/center) are changed
      //those changes can be watched on the incoming model
      this.mapOpts = opts;
      this.shiftIsDown = false;
      this.selectionBounds = null;
      this.startPos = null;
      this.endPos = null;
      

      //When the center or zoom are changed programatically the draw function is triggered
      //(also once to initialize the map)
      this.draw = function () {

        if (that.mapOpts == null) {
          console.log("No map opts found");
          return;
        }
        
        if (_instance == null) {
          
          // Create a new map instance
          
          _instance = new google.maps.Map(selector, that.mapOpts);
          
          google.maps.event.addListener(_instance, "dragstart",
              
              function () {
                that.dragging = true;
              }
          );
          
          google.maps.event.addListener(_instance, "idle",
              
              function () {
                that.dragging = false;
              }
          );
          
          google.maps.event.addListener(_instance, "drag",
              
              function () {
                that.dragging = true;   
              }
          );  
          
          google.maps.event.addListener(_instance, "zoom_changed",
              
              function () {
                that.mapOpts.zoom = _instance.getZoom();
                that.mapOpts.center = _instance.getCenter();
              }
          );
          
          google.maps.event.addListener(_instance, "center_changed",
              
              function () {
                that.mapOpts.center = _instance.getCenter();
              }
          );
          
          // Attach additional event listeners if needed
          if (_handlers.length) {
            
            angular.forEach(_handlers, function (h, i) {
              
              google.maps.event.addListener(_instance, 
                  h.on, h.handler);
            });
          }
        }
        else {
          
          // Refresh the existing instance
          google.maps.event.trigger(_instance, "resize");
          
          var instanceCenter = _instance.getCenter();
          if (!floatEqual(instanceCenter.lat(), that.mapOpts.center.lat())
            || !floatEqual(instanceCenter.lng(), that.mapOpts.center.lng())) {
              _instance.setCenter(that.mapOpts.center);
          }
        
          if (_instance.getZoom() != that.mapOpts.zoom) {
            _instance.setZoom(that.zoom);
          }          
        }
      };
      
      this.on = function(event, handler) {
        _handlers.push({
          "on": event,
          "handler": handler
        });
      };
      
      this.addMarker = function (lat, lng, icon, infoWindowContent, infoWindowOpen, label, url, thumbnail) {
        if (that.findMarker(lat, lng) != null) {
          return;
        }
        
        var marker = new google.maps.Marker({
          position: new google.maps.LatLng(lat, lng),
          map: _instance
        });
        
        if (label) {
          
        }
        
        if (url) {
          
        }

        if (infoWindowContent != null) {
          var infoWindow = new google.maps.InfoWindow({
            content: infoWindowContent
          });

          google.maps.event.addListener(marker, 'click', function() {
            if (currentInfoWindow != null) {
              currentInfoWindow.close();
            }
            infoWindow.open(_instance, marker);
            currentInfoWindow = infoWindow;
          });

          if(infoWindowOpen)
          {
            infoWindow.open(_instance, marker);
            currentInfoWindow=infoWindow;
          }
        }
        
        // Cache marker 
        _markers.unshift(marker);
        
        // Cache instance of our marker for scope purposes
        markers.unshift({
          "lat": lat,
          "lng": lng,
          "draggable": false,
          "icon": icon,
          "infoWindowContent": infoWindowContent,
          "label": label,
          "url": url,
          "thumbnail": thumbnail
        });
        
        // Return marker instance
        return marker;
      };

      this.resetMapIcons = function()
      {
        for (var i = 0; i < _markers.length; i++) {
          _markers[i].setIcon("images/mapIcons/blue-dot-icon.png");
        }
      }
      this.findSelected = function() {
        if(!that.selectionBounds)
          return;
        for (var i = 0; i < _markers.length; i++) {
          if(that.selectionBounds.contains(_markers[i].getPosition()))
          {
            if(markersSelected.indexOf(_markers[i])==-1)
              markersSelected.push(_markers[i]);
          }
        };
        
        that.listSelectedMarkers();
        
        //_instance.fitBounds(that.selectionBounds);
        that.selectionBounds = null;
      }


      this.resetSelected = function() {
          markersSelected = [];

          for (var i = 0; i < _markers.length; i++) {
              _markers[i].setIcon("assets/img/blue-dot-icon.png");
          }
      };
        
      this.disableMarkers = function()
      {
        for (var i = 0; i < _markers.length; i++) {
          var curMarker = _markers[i];
          curMarker.setClickable(false);
        };
      }
      this.enableMarkers = function()
      {
        for (var i = 0; i < _markers.length; i++) {
          var curMarker = _markers[i];
          curMarker.setClickable(true);
        };
      }
      this.findMarker = function (lat, lng) {
        for (var i = 0; i < _markers.length; i++) {
          var pos = _markers[i].getPosition();
          
          if (floatEqual(pos.lat(), lat) && floatEqual(pos.lng(), lng)) {
            return _markers[i];
          }
        }
        
        return null;
      };  
      
      this.findMarkerIndex = function (lat, lng) {
        for (var i = 0; i < _markers.length; i++) {
          var pos = _markers[i].getPosition();
          
          if (floatEqual(pos.lat(), lat) && floatEqual(pos.lng(), lng)) {
            return i;
          }
        }
        
        return -1;
      };
      
      this.addInfoWindow = function (lat, lng, html) {
        var win = new google.maps.InfoWindow({
          content: html,
          position: new google.maps.LatLng(lat, lng)
        });
        
        _windows.push(win);
        
        return win;
      };
      
      this.hasMarker = function (lat, lng) {
        return that.findMarker(lat, lng) !== null;
      };  
      
      this.getMarkerInstances = function () {
        return _markers;
      };
      
      this.removeMarkers = function (markerInstances) {
        
        var s = this;
        
        angular.forEach(markerInstances, function (v, i) {
          var pos = v.getPosition(),
            lat = pos.lat(),
            lng = pos.lng(),
            index = s.findMarkerIndex(lat, lng);
          
          // Remove from local arrays
          _markers.splice(index, 1);
          //s.markers.splice(index, 1);
          
          // Remove from map
          v.setMap(null);
        });
      };
    }
    
    // Done
    return PrivateMapModel;
  }());
  
  // End model
  
  // Start Angular directive
  
  var googleMapsModule = angular.module("google-maps", []);

  /**
   * Map directive
   */
  googleMapsModule.directive("googleMap", ["$log", "$timeout", "$filter", function ($log, $timeout, 
      $filter) {

    var controller = function ($scope, $element) {
      
      var _m = $scope.map;
      
      self.addInfoWindow = function (lat, lng, content) {
        _m.addInfoWindow(lat, lng, content);
      };
    };

    controller.$inject = ['$scope', '$element'];
    
    return {
      restrict: "ECA",
      priority: 100,
      transclude: true,
      template: "<div class='angular-google-map' ng-transclude></div>",
      replace: false,
      scope: {
        mapOpts: "=", // required
        markers: "=", // optional
        selectedMarkers: "=", // optional
        refresh: "&", // optional
        windows: "=" // optional
      },
      controller: controller,      
      link: function (scope, element, attrs, ctrl) {
        
        angular.element(element).addClass("angular-google-map");
        if (!angular.isDefined(scope.mapOpts)) {
        	$log.error("angular-google-maps: options not set");
        	return;
        }
        // Create our model
        var opts = angular.extend({}, scope.mapOpts, {
          container: element[0],        
          center: scope.mapOpts.center,              
          draggable: scope.mapOpts.draggable,
          scrollwheel: false,
          zoom: scope.mapOpts.zoom,
          mapTypeId: google.maps.MapTypeId.SATELLITE
        });
        var _m = new MapModel(opts,function(data){
          $timeout(function () {
            
            scope.selectedMarkers = data;
            
          });
        });

        _m.on("drag", function () {
          
          var c = _m.mapOpts.center;
        
          $timeout(function () {
            
            scope.$apply(function (s) {
              scope.mapOpts.center = c;
            });
          });
        });
      
        _m.on("zoom_changed", function () {
          
          if (scope.zoom != _m.zoom) {
            
            $timeout(function () {
              
              scope.$apply(function (s) {
                scope.zoom = _m.zoom;
              });
            });
          }
        });
      
        _m.on("center_changed", function () {
          var c = _m.center;
        
          $timeout(function () {
            
            scope.$apply(function (s) {
              
              if (!_m.dragging) {
                scope.mapOpts.center = c;
              }
            });
          });
        });
        
        // Put the map into the scope
        scope.map = _m;
        
        // Check if we need to refresh the map
        if (angular.isUndefined(scope.refresh())) {
          // No refresh property given; draw the map immediately
          _m.draw();
        }
        else {
          scope.$watch("refresh()", function (newValue, oldValue) {
            if (newValue && !oldValue) {
              _m.draw();
            }
          }); 
        }
        
        // Markers
        scope.$watch("mapOpts.markers", function (newValue, oldValue) {
          
          $timeout(function () {
            
            angular.forEach(newValue, function (v, i) {
              if (!_m.hasMarker(v.latitude, v.longitude)) {
                _m.addMarker(v.latitude, v.longitude, v.icon, v.infoWindow, v.infoWindowOpen);
              }
            });
            
            // Clear orphaned markers
            var orphaned = [];
            
            angular.forEach(_m.getMarkerInstances(), function (v, i) {
              // Check our scope if a marker with equal latitude and longitude. 
              // If not found, then that marker has been removed form the scope.
              
              var pos = v.getPosition(),
                lat = pos.lat(),
                lng = pos.lng(),
                found = false;
              
              // Test against each marker in the scope
              for (var si = 0; si < scope.mapOpts.markers.length; si++) {
                
                var sm = scope.mapOpts.markers[si];
                
                if (floatEqual(sm.latitude, lat) && floatEqual(sm.longitude, lng)) {
                  // Map marker is present in scope too, don't remove
                  found = true;
                }
              }
              
              // Marker in map has not been found in scope. Remove.
              if (!found) {
                orphaned.push(v);
              }
            });

            orphaned.length && _m.removeMarkers(orphaned);           
            
            // Fit map when there are more than one marker. 
            // This will change the map center coordinates
            if (attrs.fit == "true" && newValue) {
              _m.fit();
            }
          });
          
        }, true);
        
        
        // Update map when center coordinates change
        scope.$watch("mapOpts.center", function (newValue, oldValue) {
          if(!newValue || isNaN(newValue.lat())||isNaN(newValue.lng())||newValue === _m.center)
          {
            return;
          }
          
          if (!_m.dragging) {
            _m.mapOpts.center = newValue;
            _m.draw();
          }
        }, true);
        
        scope.$watch("zoom", function (newValue, oldValue) {
          if (newValue === oldValue) {
            return;
          }
          
          _m.zoom = newValue;
          _m.draw();
        }, true);
      }
    };
  }]);  
}());