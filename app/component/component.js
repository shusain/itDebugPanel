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

  .directive('debugPanel', function($document){
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
  })

  .directive('optionsForm', function(RecursionHelper){
    
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
  })
  // From the docs
  .directive('myDraggable', function($document) {
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
  }).directive('blockMouseDown', function(){
    return {
      restrict:'A',
      link:function(scope, iElem){
        iElem.on('mousedown', function(event){
          event.stopImmediatePropagation();
        });
      }
    };
  });