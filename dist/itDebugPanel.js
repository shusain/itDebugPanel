(function(){
  'use strict';
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

    .directive('code', ['$sce', function($sce){
      return {
        restrict:'A',
        priority:10000,
        link: function(scope,iElem,attrs){

          console.log(iElem[0].innerHTML);
          var replaced = iElem[0].innerHTML.trim();
          replaced = replaced.replace(/&/g, '&amp;')
          replaced = replaced.replace(/</g,'&lt;');
          replaced = replaced.replace(/>/g,'&gt;');
          replaced = replaced.replace(/\s/g,'<br>&nbsp;&nbsp;')
          replaced = replaced.replace(/&gt;&lt;/g,'&gt;<br>&lt;');
          iElem.replaceWith(replaced);
          // scope.display = $sce.trustAsHtml(replaced);
        }
      }
    }])

    .directive('debugPanel', ['$document', '$filter', function($document, $filter){
      return {
        restrict:'E',
        scope: { watchModel: '=', panelVisible: '=?' },
        templateUrl:'component/templates/debugPanel.tpl.html',
        link:function(scope, iElem){
          scope.$watch('watchModel', function(newVal){
            scope.filteredOptions = $filter('objectFilter')(newVal, scope.filterText);
          }, true);
          var targetOptions;

          scope.$watch(function(){return targetOptions}, function(newVal){
            if(!newVal)
              return;
            scope.filteredOptions = $filter('objectFilter')(newVal, scope.filterText);
          })

          scope.$watch('filterText', function(){
            if(targetOptions)
              scope.filteredOptions = $filter('objectFilter')(targetOptions, scope.filterText);  
            else
              scope.filteredOptions = $filter('objectFilter')(scope.watchModel, scope.filterText);
          });

          scope.targetElement = function(){
            var angHovElem;
            var initalBackgroundColor;
            $document.bind('mousemove', function handler(event){
              function mouseOutHandler(){
                hoveredElem.style.backgroundColor = initalBackgroundColor;
                angHovElem.unbind('mouseout', mouseOutHandler);
                angHovElem.unbind('click', clickHandler);
                angHovElem = null;
              }
              function clickHandler(){
                hoveredElem.style.backgroundColor = initalBackgroundColor;
                angHovElem.unbind('mouseout', mouseOutHandler);
                angHovElem.unbind('click', clickHandler);
                $document.unbind('mousemove', handler);
                targetOptions = angHovElem.scope();
                scope.$apply();
                angHovElem = null;
              }
              var hoveredElem = document.elementFromPoint(event.clientX,event.clientY);
              if(iElem[0].contains(hoveredElem))
                hoveredElem = null;
              if(!angHovElem && hoveredElem)
              {
                initalBackgroundColor = hoveredElem.style.backgroundColor;
                hoveredElem.style.backgroundColor = 'blue';
              
                angHovElem = angular.element(hoveredElem);

                angHovElem.bind('mouseout', mouseOutHandler);
                angHovElem.bind('click', clickHandler);
              }



            })
          }

          $document.bind('keydown', function(event){
            if(event.keyCode == 68 && event.shiftKey && event.altKey){
              scope.panelVisible = !scope.panelVisible;
              scope.$apply();
            }

          });
        }
      };
    }])
    .filter('objectFilter', function () {

      function getType(thingToCheck){
        if(angular.isFunction(thingToCheck))
          return 'Function'
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
      
      function TreeNode(obj,isActive,key,parent){
        this.isActive = isActive;
        this.children = [];
        this.obj = obj;
        this.key = key;
        this.value = obj[key];
        this.parent = parent;
        this.type = getType(this.value);
      }

      TreeNode.prototype.addChild = function(childNode){
        this.children.push(childNode);
      };

      TreeNode.prototype.matches = function(searchText){
        return (this.key&&this.key.indexOf&&this.key.indexOf(searchText)!=-1)||(this.value&&this.value.indexOf&&this.value.indexOf(searchText)!=-1)||(this.value==searchText);
      };

      function buildTree(obj,parent, isActive){
        angular.forEach(obj, function(value,key){
          if(key&&key.indexOf&&(key.indexOf("$")!=-1 || key === "this"))
            return;
          var newNode = new TreeNode(obj,isActive,key,parent);
          parent.addChild(newNode);
          if(angular.isObject(value)){
            buildTree(value,newNode, isActive);
          }
        })
      }

      function markParentsActive(node){
        var nodesParent = node.parent;
        while(nodesParent){
          nodesParent.isActive = true;
          nodesParent = nodesParent.parent;
        }
      }
      function markChildrenActive(node){
        angular.forEach(node.children, function(childNode, index){
          childNode.isActive = true;
          markChildrenActive(childNode);
        })
      }

      function findTextInTree(treeNode, searchText){
        angular.forEach(treeNode.children, function(node,index){
          if(node.matches(searchText)){
            markParentsActive(node);
            markChildrenActive(node);
            node.isActive = true;
          }
          else
          {
            findTextInTree(node,searchText);
          }
        });
      }

      return function (input, searchText) {
        if(!input)
          return;
        var rootNode = new TreeNode(input);
        
        if(!searchText||searchText == ''){
          buildTree(input, rootNode, true);
        }
        else{
          buildTree(input,rootNode, false)
          findTextInTree(rootNode,searchText);
        }
        
        return rootNode;
      };
    })

    .directive('optionsForm', ['RecursionHelper', function(RecursionHelper){
      
      return {
        restrict:'E',
        scope: {
          treeNode:'='
        },
        templateUrl:'component/templates/optionsForm.tpl.html',
        compile: function(element){
          return RecursionHelper.compile(element, function(scope){
            scope.arrayVisible=true;
            scope.isObject = function(thingToCheck){
              return angular.isObject(thingToCheck);
            };
          });
        }
      };
    }])
    // From the docs
    .directive('myDraggable', ['$document', function($document) {
      return function(scope, element) {
        var startX = 0, startY = 0, x = 0, y = 0;

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
    });
  
})();;angular.module('itDebugTemplates', ['component/templates/debugPanel.tpl.html', 'component/templates/optionsForm.tpl.html']);

angular.module("component/templates/debugPanel.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("component/templates/debugPanel.tpl.html",
    "<div class=\"debugPanelWrapper\" ng-show=\"panelVisible\">\n" +
    "  <div class=\"debugPanel panel panel-default\" my-draggable>\n" +
    "    <div class=\"panel-heading\">\n" +
    "      <span class=\"pull-right\" ng-click=\"panelVisible=false\">\n" +
    "        <i class=\"glyphicon glyphicon-remove\"></i>\n" +
    "      </span>\n" +
    "      <h3 class=\"panel-title pull-left\">Debug Panel</h3>\n" +
    "      <div>\n" +
    "        <button ng-click=\"targetElement()\" class=\"btn btn-primary\">\n" +
    "          <i ng-click=\"filterText = ''\" class=\"glyphicon glyphicon-screenshot\"></i>\n" +
    "          Inspect\n" +
    "        </button>\n" +
    "        <h6>After clicking click<br> the target element</h6>\n" +
    "      </div>\n" +
    "      <div class=\"hRule\"></div>\n" +
    "      \n" +
    "      <div>\n" +
    "        <input placeholder=\"Filter\" type=\"text\" block-mouse-down ng-model=\"filterText\" >\n" +
    "        <i ng-click=\"filterText = ''\" class=\"glyphicon glyphicon-remove-circle\"></i>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <br><br>\n" +
    "    <options-form tree-node=\"filteredOptions\">\n" +
    "    </options-form>\n" +
    "  </div>\n" +
    "</div>");
}]);

angular.module("component/templates/optionsForm.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("component/templates/optionsForm.tpl.html",
    "<div ng-repeat=\"node in treeNode.children track by $index\">\n" +
    "  <div class=\"hRuleLight\"></div>\n" +
    "  <div ng-if=\"node.children.length>0&&node.isActive\" class=\"well well-sm\">\n" +
    "    <div block-mouse-down ng-click=\"visible=!visible\" class=\"elementRow\" ng-class=\"{'selected':visible}\">{{node.type}}: {{node.key}}</div>\n" +
    "    <options-form ng-show=\"visible\" tree-node=\"node\">\n" +
    "    </options-form>\n" +
    "    <br/>\n" +
    "  </div>\n" +
    "  <div class=\"container-fluid\" ng-if=\"node.children.length==0&&node.isActive\">\n" +
    "    <div class=\"row\">\n" +
    "      <div class=\"col-xs-8\">\n" +
    "        {{node.key}}:\n" +
    "      </div>\n" +
    "      <div ng-switch=\"node.type\" class=\"col-xs-4\">\n" +
    "        <input class=\"form-control\" ng-switch-when=\"Boolean\" block-mouse-down type=\"checkbox\" ng-model=\"node.obj[node.key]\">\n" +
    "        <input class=\"form-control\" ng-switch-when=\"Number\" block-mouse-down type=\"number\" ng-model=\"node.obj[node.key]\">\n" +
    "        <span ng-switch-when=\"Function\">\n" +
    "          Function\n" +
    "        </span>\n" +
    "        <input class=\"form-control\" ng-switch-default block-mouse-down type=\"text\" ng-model=\"node.obj[node.key]\">\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>");
}]);
