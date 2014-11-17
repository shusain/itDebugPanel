#IT-Debug-Panel

##Introduction

###[Demo](http://shusain.github.io/itDebugPanel/dist/)

**IT-Debug-Panel** is meant to make modifying model objects on the fly for manual testing and tweaking purposes possible.  Allows you to target an element visually and see the associated scope as a tree view with the ability to search the tree for a given key or value.  When the search is done all nodes in the tree built from the object being inspected that are parents or children of a key or value that matches the search text will be marked active and the remaining nodes will be marked inactive and hidden from view.

----------------------
## Install
Note this project requires Bootstrap CSS for some basic icons and other styling elements.  You can either include some bootstrap CSS 3.x from your project or use the bootstrap included as a dependency of this project (relied on a Bootstrap CSS only github repo to avoid unnecessarily including jQuery)

### Bower
```
bower install https://github.com/shusain/itDebugPanel.git#develop --save
```
If using **wiredep** you *should* be ready to use the component.  If not using wiredep grunt task or gulp plugin if not just include the bower_components/it-debug-panel/dist/itDebugPanel.js and bower_components/it-debug-panel/dist/styles/optimized.css files.


### Manual Install
Download the contents of the dist folder and put them in your project include the files as described.

### Usage
As the first child of the body element add the following, note that both the attributes are optional.  The panel-visible attribute expects some boolean and is used to give you a way to hook a button to toggle the debug panel within your app.  The watch-model attribute just sets a default object to show in the panel.

#### Super complex usage
    <debug-panel
      watch-model="myModel"
      panel-visible="myModel.someBool">
    </debug-panel>

#### Simple complex usage
    <debug-panel>
    </debug-panel>
    
Use <big>**Alt+Shift+D**</big> to toggle, if no toggle boolean is provided.