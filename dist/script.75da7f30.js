// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"node_modules/deepmerge/dist/cjs.js":[function(require,module,exports) {
'use strict';

var isMergeableObject = function isMergeableObject(value) {
  return isNonNullObject(value) && !isSpecial(value);
};

function isNonNullObject(value) {
  return !!value && typeof value === 'object';
}

function isSpecial(value) {
  var stringValue = Object.prototype.toString.call(value);
  return stringValue === '[object RegExp]' || stringValue === '[object Date]' || isReactElement(value);
} // see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25


var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

function isReactElement(value) {
  return value.$$typeof === REACT_ELEMENT_TYPE;
}

function emptyTarget(val) {
  return Array.isArray(val) ? [] : {};
}

function cloneUnlessOtherwiseSpecified(value, options) {
  return options.clone !== false && options.isMergeableObject(value) ? deepmerge(emptyTarget(value), value, options) : value;
}

function defaultArrayMerge(target, source, options) {
  return target.concat(source).map(function (element) {
    return cloneUnlessOtherwiseSpecified(element, options);
  });
}

function getMergeFunction(key, options) {
  if (!options.customMerge) {
    return deepmerge;
  }

  var customMerge = options.customMerge(key);
  return typeof customMerge === 'function' ? customMerge : deepmerge;
}

function getEnumerableOwnPropertySymbols(target) {
  return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function (symbol) {
    return target.propertyIsEnumerable(symbol);
  }) : [];
}

function getKeys(target) {
  return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
}

function propertyIsOnObject(object, property) {
  try {
    return property in object;
  } catch (_) {
    return false;
  }
} // Protects from prototype poisoning and unexpected merging up the prototype chain.


function propertyIsUnsafe(target, key) {
  return propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
  && !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
  && Object.propertyIsEnumerable.call(target, key)); // and also unsafe if they're nonenumerable.
}

function mergeObject(target, source, options) {
  var destination = {};

  if (options.isMergeableObject(target)) {
    getKeys(target).forEach(function (key) {
      destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
    });
  }

  getKeys(source).forEach(function (key) {
    if (propertyIsUnsafe(target, key)) {
      return;
    }

    if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
      destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
    } else {
      destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
    }
  });
  return destination;
}

function deepmerge(target, source, options) {
  options = options || {};
  options.arrayMerge = options.arrayMerge || defaultArrayMerge;
  options.isMergeableObject = options.isMergeableObject || isMergeableObject; // cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
  // implementations can use it. The caller may not replace it.

  options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
  var sourceIsArray = Array.isArray(source);
  var targetIsArray = Array.isArray(target);
  var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

  if (!sourceAndTargetTypesMatch) {
    return cloneUnlessOtherwiseSpecified(source, options);
  } else if (sourceIsArray) {
    return options.arrayMerge(target, source, options);
  } else {
    return mergeObject(target, source, options);
  }
}

deepmerge.all = function deepmergeAll(array, options) {
  if (!Array.isArray(array)) {
    throw new Error('first argument should be an array');
  }

  return array.reduce(function (prev, next) {
    return deepmerge(prev, next, options);
  }, {});
};

var deepmerge_1 = deepmerge;
module.exports = deepmerge_1;
},{}],"NestedMenu.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = NestedMenu;

var _deepmerge = _interopRequireDefault(require("deepmerge"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* 
  Логика для всплывающего меню с несколькими уровнями вложенности

  В качестве параметров можно передавать:
  selector - селектор оснвного элемента-родителя
  url - ссылка с данными из которых будет формироваться меню, пример структуры можно посмотреть в файле /data.json
  classes - объект с классами для основных элементов, структуру можно увидеть ниже
  mobileMaxWidth - на каком максимальном разрешении меню будет работать в мобильном режиме
*/
function NestedMenu() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$selector = _ref.selector,
      selector = _ref$selector === void 0 ? '.bem-nested-menu' : _ref$selector,
      url = _ref.url,
      _ref$classes = _ref.classes,
      classes = _ref$classes === void 0 ? {} : _ref$classes,
      _ref$mobileMaxWidth = _ref.mobileMaxWidth,
      mobileMaxWidth = _ref$mobileMaxWidth === void 0 ? 767 : _ref$mobileMaxWidth,
      _ref$mouseMoveResetTi = _ref.mouseMoveResetTimeout,
      mouseMoveResetTimeout = _ref$mouseMoveResetTi === void 0 ? 3000 : _ref$mouseMoveResetTi;

  var menu = document.querySelector(selector);
  if (!menu) return;
  var data, button, nestedListEl, activeNestedListEl, isActive, menuWrapper, listWrapper, title, close, back, blackout, defaultMenuTitle, menuResetTimeout;
  var activated = false;
  downloadData();

  function downloadData() {
    fetch(url).then(function (response) {
      return response.json();
    }).then(function (json) {
      data = json;
      init();
    }).catch(function (e) {
      return console.error('Невозможно проинициализировать вложенное меню', e);
    });
  } // Первоначальная инициализация при загрузке страницы: поиск элементов, присвоение стандартных значений 


  function init() {
    activeNestedListEl = [];
    isActive = false;
    classes = getClasses(classes);
    menuWrapper = menu.querySelector(".".concat(classes.menuWrapper.base));
    listWrapper = menu.querySelector(".".concat(classes.listWrapper.base));
    button = menu.querySelector(".".concat(classes.button.base));
    button.addEventListener('click', onButtonClick);
    blackout = document.querySelector(".".concat(classes.blackout.base));
    title = menu.querySelector(".".concat(classes.title.base));
    defaultMenuTitle = title.innerText;
    close = menu.querySelector(".".concat(classes.close.base));
    back = menu.querySelector(".".concat(classes.back.base));
    close.addEventListener('click', reset);
    back.addEventListener('click', backToPrevious);
  } // при клике на кнопку-активатор


  function onButtonClick(e) {
    // если активируем в первый раз - генерируем html
    if (!activated) {
      generateTemplate();
      nestedListEl = menu.querySelectorAll(".".concat(classes.el.nested, " > .").concat(classes.elTitle.base));
      activated = true;
    }

    if (isActive) {
      reset();
    } else {
      isActive = true;
      button.classList.add(classes.button.active);
      menu.classList.add(classes.menu.active);
      window.requestAnimationFrame(function () {
        return window.addEventListener('click', onWindowClick);
      });
      window.addEventListener('resize', onResize);
      toggleBlackout('on');
      if (!isMobile()) window.addEventListener('mousemove', onMouseMove);
    }
  }

  function onNestedElClick(e) {
    var isNestedLink = e.target.closest(".".concat(classes.el.nested, " > .").concat(classes.elTitle.base));
    if (isNestedLink && isMobile()) e.preventDefault();
    enableEl(e.target.closest(".".concat(classes.el.base)));
  }

  function onMouseMove(e) {
    var isInsideMenu = e.target.closest(".".concat(classes.listWrapper.base));

    if (isInsideMenu) {
      var el = e.target.closest(".".concat(classes.el.base));
      resetMouseMoveTimer();
      if (el) enableEl(el);
    } else {
      if (!menuResetTimeout) menuResetTimeout = setTimeout(reset, mouseMoveResetTimeout);
    }
  }

  function onWindowClick(e) {
    var isInsideMenu = e.target.closest(".".concat(classes.list.base));
    var isMobileTop = e.target.closest(".".concat(classes.mobileTop.base));
    if (!isInsideMenu && !isMobileTop) reset();
  }

  function onResize() {
    if (isMobile()) {
      shiftListBy(activeNestedListEl.length);
      resetMouseMoveTimer();
      window.removeEventListener('mousemove', onMouseMove);
    } else {
      shiftListBy(0);
      window.addEventListener('mousemove', onMouseMove);
    }
  } // при активации элемента со вложенными пунктами


  function enableEl(el) {
    if (!el.classList.contains(classes.el.active) && el.classList.contains(classes.el.nested)) {
      activeNestedListEl.push(el);
      el.classList.add(classes.el.active);
      disableUnnecessaryEl(el);
      setTitle(el);
      back.classList.add(classes.back.active);

      if (isMobile()) {
        shiftListBy(activeNestedListEl.length);
      }

      log();
    } else if (!el.classList.contains(classes.el.nested)) {
      disableUnnecessaryEl(el);
      setTitle(activeNestedListEl[activeNestedListEl.length - 1]);
    }
  }

  function disableUnnecessaryEl(el) {
    var list = getAncestors(el);
    activeNestedListEl.forEach(function (active) {
      if (!list.some(function (x) {
        return x === active;
      })) {
        active.classList.remove(classes.el.active);
      }
    });
    activeNestedListEl = list;
    if (activeNestedListEl.length === 0) back.classList.remove(classes.back.active);
  } // получаем все активные элементы выше по уровню от определенного элемента


  function getAncestors(el) {
    var arr = [];
    var current = el;

    while (current.parentNode !== menu) {
      if (current.classList.contains(classes.el.nested)) {
        arr.push(current);
      }

      current = current.parentNode;
    }

    return arr.reverse();
  }

  function setTitle(el) {
    var text = defaultMenuTitle;
    if (el) text = el.querySelector(".".concat(classes.elTitle.base)).innerText;
    title.innerText = text;
  }

  function reset() {
    isActive = false;
    activeNestedListEl.forEach(function (el) {
      return el.classList.remove(classes.el.active);
    });
    activeNestedListEl = [];
    button.classList.remove(classes.button.active);
    menu.classList.remove(classes.menu.active);
    window.removeEventListener('click', onWindowClick);
    window.removeEventListener('resize', onResize);
    setTitle();
    shiftListBy(0);
    back.classList.remove(classes.back.active);
    toggleBlackout('off');
    resetMouseMoveTimer();

    if (!isMobile()) {
      window.removeEventListener('mousemove', onMouseMove);
    }

    log();
  }

  function resetMouseMoveTimer() {
    if (menuResetTimeout) {
      clearTimeout(menuResetTimeout);
      menuResetTimeout = null;
    }

    ;
  }

  function getClasses(obj) {
    return (0, _deepmerge.default)({
      blackout: {
        base: 'bem-blackout',
        active: 'bem-blackout_active'
      },
      menu: {
        base: 'bem-nested-menu',
        active: 'bem-nested-menu_active'
      },
      button: {
        base: 'bem-nested-menu__button',
        active: 'bem-nested-menu__button_active'
      },
      close: {
        base: 'bem-nested-menu__mobile-close'
      },
      back: {
        base: 'bem-nested-menu__mobile-back',
        active: 'bem-nested-menu__mobile-back_active'
      },
      title: {
        base: 'bem-nested-menu__mobile-title'
      },
      menuWrapper: {
        base: 'bem-nested-menu__menu-wrapper'
      },
      listWrapper: {
        base: 'bem-nested-menu__list-wrapper'
      },
      list: {
        base: 'bem-nested-menu__list',
        active: 'bem-nested-menu__list_active'
      },
      el: {
        base: 'bem-nested-menu__el',
        nested: 'bem-nested-menu__el_nested',
        active: 'bem-nested-menu__el_active'
      },
      elIcon: {
        base: 'bem-nested-menu__el-icon'
      },
      elTitle: {
        base: 'bem-nested-menu__el-title'
      },
      mobileTop: {
        base: 'bem-nested-menu__mobile-top'
      }
    }, obj);
  }

  function generateTemplate() {
    var el = createList(data);
    listWrapper.appendChild(el);
  }

  function createList(list) {
    var listEl = document.createElement('div');
    listEl.classList.add(classes.list.base);
    list.forEach(function (el) {
      var temp = document.createElement('div');
      temp.classList.add(classes.el.base);

      if (el.class && el.class.length > 0) {
        el.class.forEach(function (elClass) {
          return temp.classList.add(elClass);
        });
      }

      var title = document.createElement('a');
      title.innerText = el.title;
      title.setAttribute('href', el.link);
      title.classList.add(classes.elTitle.base);
      temp.appendChild(title);

      if (el.icon) {
        var icon = document.createElement('div');
        icon.classList.add(classes.elIcon.base);
        icon.style.backgroundImage = "url(".concat(el.icon, ")");
        title.prepend(icon);
      }

      if (el.child) {
        var childList = createList(el.child);
        temp.classList.add(classes.el.nested);
        temp.appendChild(childList);
        temp.addEventListener('click', onNestedElClick);
      }

      ;
      listEl.appendChild(temp);
    });
    return listEl;
  }

  function backToPrevious() {
    var el = activeNestedListEl.pop();
    el.classList.remove(classes.el.active);
    setTitle(activeNestedListEl[activeNestedListEl.length - 1]);
    shiftListBy(activeNestedListEl.length);

    if (activeNestedListEl.length === 0) {
      back.classList.remove(classes.back.active);
    }
  }

  function isMobile() {
    return window.innerWidth <= mobileMaxWidth;
  }

  function toggleBlackout() {
    var action = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'on';
    blackout.classList[action === 'on' ? 'add' : 'remove'](classes.blackout.active);
  }

  function shiftListBy(n) {
    listWrapper.querySelector(".".concat(classes.list.base)).style.transform = "translateX(-".concat(n * 100, "%)");
    listWrapper.scrollTop = 0;
  }

  function log() {
    console.log('Данные для дебага всплывающего меню:', {
      activeNestedListEl: activeNestedListEl
    });
  }

  return {
    reset: reset
  };
}
},{"deepmerge":"node_modules/deepmerge/dist/cjs.js"}],"script.js":[function(require,module,exports) {
"use strict";

var _NestedMenu = _interopRequireDefault(require("./NestedMenu"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _NestedMenu.default)({
  url: 'https://jsonp.afeld.me/?url=https%3A%2F%2Fartmizu.ru%2Fscreenshots%2Fdata.json'
});
},{"./NestedMenu":"NestedMenu.js"}],"../../../../../usr/local/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "55570" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../../../../../usr/local/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js","script.js"], null)
//# sourceMappingURL=/script.75da7f30.js.map