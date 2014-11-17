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

    .directive('code', function($sce){
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
    })

    .directive('debugPanel', function($document, $filter){
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
    })
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

    .directive('optionsForm', function(RecursionHelper){
      
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
    })
    // From the docs
    .directive('myDraggable', function($document) {
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
  
})();