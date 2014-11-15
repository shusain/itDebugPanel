/**
* componentModule Module
*
* Description
*/

angular.module('itDebugTemplates', []);

angular.module('itDebugPanel', ['itDebugTemplates'])

  .factory('RecursionHelper', ['$compile', function($compile){
    return {
      /**
       * Manually compiles the element, fixing the recursion loop.
       * @param element
       * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
       * @returns An object containing the linking functions.
       */
      compile: function(element, link){
        // Normalize the link parameter
        if(angular.isFunction(link)){
          link = { post: link };
        }

        // Break the recursion loop by removing the contents
        var contents = element.contents().remove();
        var compiledContents;
        return {
          pre: (link && link.pre) ? link.pre : null,
          /**
           * Compiles and re-adds the contents
           */
          post: function(scope, element){
            // Compile the contents
            if(!compiledContents){
              compiledContents = $compile(contents);
            }
            // Re-add the compiled contents to the element
            compiledContents(scope, function(clone){
              element.append(clone);
            });

            // Call the post-linking function, if any
            if(link && link.post){
              link.post.apply(null, arguments);
            }
          }
        };
      }
    };
  }])

  .directive('debugPanel', ['$document', function($document){
    return {
      restrict:'E',
      scope: { options: '=', panelVisible: '=?' },
      templateUrl:'component/templates/debugPanel.tpl.html',
      link:function(scope){
        $document.bind('keydown', function(event){
          if(event.keyCode == 68 && event.shiftKey && event.altKey){
            scope.panelVisible = !scope.panelVisible;
            scope.$apply();
          }

        })
      }
    };
  }])

  .directive('optionsForm', ['RecursionHelper', function(RecursionHelper){
    
    return {
      restrict:'E',
      scope: {
        options:'='
      },
      templateUrl:'component/templates/optionsForm.tpl.html',
      compile: function(element){
        return RecursionHelper.compile(element, function(scope){
          scope.isObject = function(thingToCheck){
            return angular.isObject(thingToCheck);
          };
          scope.getType = function(thingToCheck){
            if(angular.isArray(thingToCheck))
              return 'Array';
            if(angular.isObject(thingToCheck))
              return 'Object';
            if(angular.isNumber(thingToCheck))
              return 'Number';
            if(typeof thingToCheck === 'boolean')
              return 'Boolean';
            return 'Default';
          };
        });
      }
    };
  }])
  // From the docs
  .directive('myDraggable', ['$document', function($document) {
    return function(scope, element) {
      var startX = 0, startY = 0, x = 0, y = 0;

      element.css({
       position: 'relative',
       border: '1px solid red',
       padding:'10px',
       cursor: 'pointer'
      });

      element.on('mousedown', function(event) {
        // Prevent default dragging of selected content
        event.preventDefault();
        startX = event.pageX - x;
        startY = event.pageY - y;
        $document.on('mousemove', mousemove);
        $document.on('mouseup', mouseup);
      });

      function mousemove(event) {
        y = event.pageY - startY;
        x = event.pageX - startX;
        element.css({
          top: y + 'px',
          left:  x + 'px'
        });
      }

      function mouseup() {
        $document.off('mousemove', mousemove);
        $document.off('mouseup', mouseup);
      }
    };
  }]).directive('blockMouseDown', function(){
    return {
      restrict:'A',
      link:function(scope, iElem){
        iElem.on('mousedown', function(event){
          event.stopImmediatePropagation();
        });
      }
    };
  });;angular.module('itDebugTemplates', ['component/templates/debugPanel.tpl.html', 'component/templates/optionsForm.tpl.html']);

angular.module("component/templates/debugPanel.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("component/templates/debugPanel.tpl.html",
    "<div class=\"debugPanelWrapper\" ng-show=\"panelVisible\">\n" +
    "  <div class=\"debugPanel panel panel-default\" my-draggable>\n" +
    "    <div class=\"panel-heading\">\n" +
    "      <span class=\"pull-right\" ng-click=\"panelVisible=false\">\n" +
    "        <i class=\"glyphicon glyphicon-remove\"></i>\n" +
    "      </span>\n" +
    "      <h3 class=\"panel-title\">Debug Panel</h3>\n" +
    "    </div>\n" +
    "    <options-form options=\"options\">\n" +
    "    </options-form>\n" +
    "  </div>\n" +
    "</div>");
}]);

angular.module("component/templates/optionsForm.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("component/templates/optionsForm.tpl.html",
    "<div ng-show=\"getType(options) == 'Array'\">\n" +
    "  <div ng-click=\"arrayVisible=!arrayVisible\" class=\"elementRow\" ng-class=\"{'selected':arrayVisible}\">\n" +
    "    Array\n" +
    "  </div>\n" +
    "</div>\n" +
    "<div ng-show=\"getType(options) != 'Array'||arrayVisible\" ng-repeat=\"(key, value) in options track by $index\" style=\"max-width:400px;\">\n" +
    "  <div ng-if=\"isObject(options[key])\" class=\"well well-sm\">\n" +
    "    <div ng-click=\"visible=!visible\" class=\"elementRow\" ng-class=\"{'selected':visible}\">Object: {{key}}</div>\n" +
    "    <options-form ng-show=\"visible\" options=\"options[key]\">\n" +
    "    </options-form>\n" +
    "    <br/>\n" +
    "  </div>\n" +
    "  <div class=\"container-fluid\" ng-if=\"getType(options[key])!='Array'&&getType(options[key])!='Object'\">\n" +
    "    <div class=\"row\">\n" +
    "      <div class=\"col-xs-8\">\n" +
    "        {{key}}:\n" +
    "      </div>\n" +
    "      <div ng-switch=\"getType(value)\">\n" +
    "        <input ng-switch-when=\"Boolean\" block-mouse-down class=\"col-xs-4\" type=\"checkbox\" ng-model=\"options[key]\">\n" +
    "        <input ng-switch-when=\"Number\" block-mouse-down class=\"col-xs-4\" type=\"number\" ng-model=\"options[key]\">\n" +
    "        <input ng-switch-default block-mouse-down class=\"col-xs-4\" type=\"text\" ng-model=\"options[key]\">\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>");
}]);
