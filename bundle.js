/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/ 		var executeModules = data[2];
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(Object.prototype.hasOwnProperty.call(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 		// add entry modules from loaded chunk to deferred list
/******/ 		deferredModules.push.apply(deferredModules, executeModules || []);
/******/
/******/ 		// run deferred modules when all chunks ready
/******/ 		return checkDeferredModules();
/******/ 	};
/******/ 	function checkDeferredModules() {
/******/ 		var result;
/******/ 		for(var i = 0; i < deferredModules.length; i++) {
/******/ 			var deferredModule = deferredModules[i];
/******/ 			var fulfilled = true;
/******/ 			for(var j = 1; j < deferredModule.length; j++) {
/******/ 				var depId = deferredModule[j];
/******/ 				if(installedChunks[depId] !== 0) fulfilled = false;
/******/ 			}
/******/ 			if(fulfilled) {
/******/ 				deferredModules.splice(i--, 1);
/******/ 				result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 			}
/******/ 		}
/******/
/******/ 		return result;
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		"main": 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
/******/
/******/ 	// script path function
/******/ 	function jsonpScriptSrc(chunkId) {
/******/ 		return __webpack_require__.p + "" + ({"vendors~wca":"vendors~wca","wca":"wca"}[chunkId]||chunkId) + ".bundle.js"
/******/ 	}
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = function requireEnsure(chunkId) {
/******/ 		var promises = [];
/******/
/******/
/******/ 		// JSONP chunk loading for javascript
/******/
/******/ 		var installedChunkData = installedChunks[chunkId];
/******/ 		if(installedChunkData !== 0) { // 0 means "already installed".
/******/
/******/ 			// a Promise means "currently loading".
/******/ 			if(installedChunkData) {
/******/ 				promises.push(installedChunkData[2]);
/******/ 			} else {
/******/ 				// setup Promise in chunk cache
/******/ 				var promise = new Promise(function(resolve, reject) {
/******/ 					installedChunkData = installedChunks[chunkId] = [resolve, reject];
/******/ 				});
/******/ 				promises.push(installedChunkData[2] = promise);
/******/
/******/ 				// start chunk loading
/******/ 				var script = document.createElement('script');
/******/ 				var onScriptComplete;
/******/
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.src = jsonpScriptSrc(chunkId);
/******/
/******/ 				// create error before stack unwound to get useful stacktrace later
/******/ 				var error = new Error();
/******/ 				onScriptComplete = function (event) {
/******/ 					// avoid mem leaks in IE.
/******/ 					script.onerror = script.onload = null;
/******/ 					clearTimeout(timeout);
/******/ 					var chunk = installedChunks[chunkId];
/******/ 					if(chunk !== 0) {
/******/ 						if(chunk) {
/******/ 							var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 							var realSrc = event && event.target && event.target.src;
/******/ 							error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 							error.name = 'ChunkLoadError';
/******/ 							error.type = errorType;
/******/ 							error.request = realSrc;
/******/ 							chunk[1](error);
/******/ 						}
/******/ 						installedChunks[chunkId] = undefined;
/******/ 					}
/******/ 				};
/******/ 				var timeout = setTimeout(function(){
/******/ 					onScriptComplete({ type: 'timeout', target: script });
/******/ 				}, 120000);
/******/ 				script.onerror = script.onload = onScriptComplete;
/******/ 				document.head.appendChild(script);
/******/ 			}
/******/ 		}
/******/ 		return Promise.all(promises);
/******/ 	};
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// on error function for async loading
/******/ 	__webpack_require__.oe = function(err) { console.error(err); throw err; };
/******/
/******/ 	var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
/******/ 	deferredModules.push(["./src/index.ts","vendors~main"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/code-editor-dark-theme.ts":
/*!***************************************!*\
  !*** ./src/code-editor-dark-theme.ts ***!
  \***************************************/
/*! exports provided: codeEditorDarkTheme */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"codeEditorDarkTheme\", function() { return codeEditorDarkTheme; });\n/* harmony import */ var lit_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lit-element */ \"./node_modules/lit-element/lit-element.js\");\n\nconst codeEditorDarkTheme = lit_element__WEBPACK_IMPORTED_MODULE_0__[\"css\"] `\n  .dark .codeflask {\n    background-image: initial;\n    background-color: #383e49;\n    color: #c1c2c2;\n  }\n\n  .dark .codeflask__textarea {\n    caret-color: #fffffb;\n    cursor: text;\n  }\n\n  .dark .token.comment,\n  .dark .token.prolog,\n  .dark .token.doctype,\n  .dark .token.cdata {\n    color: #5c6370;\n  }\n\n  .dark .token.punctuation {\n    color: #abb2bf;\n  }\n\n  .dark .token.selector,\n  .dark .token.tag {\n    color: #e06c75;\n  }\n\n  .dark .token.property,\n  .dark .token.boolean,\n  .dark .token.number,\n  .dark .token.constant,\n  .dark .token.symbol,\n  .dark .token.attr-name,\n  .dark .token.deleted {\n    color: #d19a66;\n  }\n\n  .dark .token.string,\n  .dark .token.char,\n  .dark .token.attr-value,\n  .dark .token.builtin,\n  .dark .token.inserted {\n    color: #98c379;\n  }\n\n  .dark .token.operator,\n  .dark .token.entity,\n  .dark .token.url,\n  .dark .language-css .token.string,\n  .dark .style .token.string {\n    color: #56b6c2;\n  }\n\n  .dark .token.atrule,\n  .dark .token.keyword {\n    color: #c678dd;\n  }\n\n  .dark .token.function {\n    color: #61afef;\n  }\n\n  .dark .token.regex,\n  .dark .token.important,\n  .dark .token.variable {\n    color: #c678dd;\n  }\n\n  .dark .token.important,\n  .dark .token.bold {\n    font-weight: bold;\n  }\n\n  .dark .token.italic {\n    font-style: italic;\n  }\n\n  .dark .token.entity {\n    cursor: help;\n  }\n`;\n\n\n//# sourceURL=webpack:///./src/code-editor-dark-theme.ts?");

/***/ }),

/***/ "./src/code-editor-light-theme.ts":
/*!****************************************!*\
  !*** ./src/code-editor-light-theme.ts ***!
  \****************************************/
/*! exports provided: codeEditorLightTheme */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"codeEditorLightTheme\", function() { return codeEditorLightTheme; });\n/* harmony import */ var lit_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lit-element */ \"./node_modules/lit-element/lit-element.js\");\n\nconst codeEditorLightTheme = lit_element__WEBPACK_IMPORTED_MODULE_0__[\"css\"] `\n  .light .codeflask {\n    background: #fff;\n    color: #4f559c;\n  }\n\n  .light .codeflask .token.punctuation {\n    color: #4a4a4a;\n  }\n\n  .light .codeflask .token.keyword {\n    color: #8500ff;\n  }\n\n  .light .codeflask .token.operator {\n    color: #ff5598;\n  }\n\n  .light .codeflask .token.string {\n    color: #41ad8f;\n  }\n\n  .light .codeflask .token.comment {\n    color: #9badb7;\n  }\n\n  .light .codeflask .token.function {\n    color: #8500ff;\n  }\n\n  .light .codeflask .token.boolean {\n    color: #8500ff;\n  }\n\n  .light .codeflask .token.number {\n    color: #8500ff;\n  }\n\n  .light .codeflask .token.selector {\n    color: #8500ff;\n  }\n\n  .light .codeflask .token.property {\n    color: #8500ff;\n  }\n\n  .light .codeflask .token.tag {\n    color: #8500ff;\n  }\n\n  .light .codeflask .token.attr-value {\n    color: #8500ff;\n  }\n`;\n\n\n//# sourceURL=webpack:///./src/code-editor-light-theme.ts?");

/***/ }),

/***/ "./src/code-editor.ts":
/*!****************************!*\
  !*** ./src/code-editor.ts ***!
  \****************************/
/*! exports provided: CodeEditor */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"CodeEditor\", function() { return CodeEditor; });\n/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ \"./node_modules/tslib/tslib.es6.js\");\n/* harmony import */ var lit_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lit-element */ \"./node_modules/lit-element/lit-element.js\");\n/* harmony import */ var lit_html_directives_class_map__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! lit-html/directives/class-map */ \"./node_modules/lit-html/directives/class-map.js\");\n/* harmony import */ var codeflask__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! codeflask */ \"./node_modules/codeflask/build/codeflask.module.js\");\n/* harmony import */ var _code_editor_dark_theme__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./code-editor-dark-theme */ \"./src/code-editor-dark-theme.ts\");\n/* harmony import */ var _code_editor_light_theme__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./code-editor-light-theme */ \"./src/code-editor-light-theme.ts\");\n\n\n\n\n\n\nconst userAgent = window.navigator.userAgent;\nconst isIOSSafari = userAgent.match(/iPad/i) || userAgent.match(/iPhone/i);\nlet CodeEditor = class CodeEditor extends lit_element__WEBPACK_IMPORTED_MODULE_1__[\"LitElement\"] {\n    constructor() {\n        super(...arguments);\n        this.readonly = false;\n        this.lineNumbers = false;\n        this.value = \"\";\n        this.theme = \"dark\";\n        this.language = \"javascript\";\n    }\n    /*connectedCallback() {\n      super.connectedCallback();\n      //this.setCode(this.value);\n    }*/\n    /*protected firstUpdated() {\n    }*/\n    update(changedProperties) {\n        super.update(changedProperties);\n        const themeChanged = changedProperties.has(\"theme\") && changedProperties.get(\"theme\") !== this.theme;\n        const languageChanged = changedProperties.has(\"language\") && changedProperties.get(\"language\") !== this.language;\n        const valueChanged = changedProperties.has(\"value\") && changedProperties.get(\"value\") !== this.value;\n        const readonlyChanged = changedProperties.has(\"readonly\") && changedProperties.get(\"readonly\") !== this.readonly;\n        const lineNumbersChanged = changedProperties.has(\"lineNumbers\") && changedProperties.get(\"lineNumbers\") !== this.lineNumbers;\n        if (themeChanged || languageChanged || readonlyChanged || lineNumbersChanged) {\n            this.setupFlask();\n        }\n        else if (valueChanged) {\n            this.flask.updateCode(this.value);\n        }\n    }\n    static get styles() {\n        return [\n            lit_element__WEBPACK_IMPORTED_MODULE_1__[\"css\"] `\n        :host {\n          position: relative;\n          display: block;\n          overflow: hidden;\n          min-height: 40px;\n          --code-editor-padding: 10px;\n        }\n\n        .codeflask {\n          overflow: hidden;\n        }\n\n        textarea {\n          overflow: visible !important;\n          color: transparent !important;\n        }\n\n        .codeflask__textarea,\n        .codeflask__pre {\n          padding: var(--code-editor-padding, 0);\n        }\n\n        .light.moving .codeflask__textarea {\n          color: black !important;\n        }\n\n        .dark.moving .codeflask__textarea {\n          color: white !important;\n        }\n\n        .moving .codeflask__pre {\n          opacity: 0 !important;\n        }\n      `\n        ];\n    }\n    render() {\n        return lit_element__WEBPACK_IMPORTED_MODULE_1__[\"html\"] `\n      <style></style>\n      <div\n        id=\"flask-container\"\n        class=\"${Object(lit_html_directives_class_map__WEBPACK_IMPORTED_MODULE_2__[\"classMap\"])({ dark: this.theme === \"dark\", light: this.theme === \"light\" })}\"\n      ></div>\n    `;\n    }\n    didChangeTextField(code) {\n        if (this.value != code) {\n            this.value = code;\n            this.dispatchEvent(new CustomEvent(\"change\"));\n            this.requestUpdate().then();\n        }\n    }\n    setupFlask() {\n        // @ts-ignore\n        this.flask = new codeflask__WEBPACK_IMPORTED_MODULE_3__[\"default\"](this.$flaskContainer, {\n            language: this.language,\n            readonly: this.readonly,\n            lineNumbers: this.lineNumbers\n        });\n        const flaskStyle = document.head.querySelector(\"style[id=codeflask-style]\");\n        if (flaskStyle != null) {\n            this.$style.appendChild(flaskStyle.cloneNode(true));\n            flaskStyle.remove();\n        }\n        const flaskStyleTheme = document.head.querySelector(\"style[id=theme-default]\");\n        if (flaskStyleTheme) {\n            flaskStyleTheme.remove();\n        }\n        const themeStyle = document.createElement(\"style\");\n        switch (this.theme) {\n            case \"dark\":\n                themeStyle.innerHTML = _code_editor_dark_theme__WEBPACK_IMPORTED_MODULE_4__[\"codeEditorDarkTheme\"].cssText;\n                break;\n            case \"light\":\n                themeStyle.innerHTML = _code_editor_light_theme__WEBPACK_IMPORTED_MODULE_5__[\"codeEditorLightTheme\"].cssText;\n                break;\n        }\n        this.$style.appendChild(themeStyle);\n        this.flask.onUpdate(this.didChangeTextField.bind(this));\n        this.flask.updateCode(this.value);\n        // Safari fix, where the text field would wrap\n        requestAnimationFrame(() => {\n            const $textArea = this.shadowRoot.querySelector(\".codeflask__textarea\");\n            if ($textArea != null) {\n                $textArea.setAttribute(\"wrap\", \"off\");\n                if (isIOSSafari) {\n                    let timeout;\n                    $textArea.addEventListener(\"scroll\", () => {\n                        if (timeout != null)\n                            clearTimeout(timeout);\n                        timeout = setTimeout(() => {\n                            this.$flaskContainer.classList.remove(\"moving\");\n                        }, 500);\n                    });\n                    $textArea.addEventListener(\"touchstart\", () => {\n                        this.$flaskContainer.classList.add(\"moving\");\n                    });\n                    $textArea.addEventListener(\"touchend\", () => {\n                        if (timeout != null)\n                            clearTimeout(timeout);\n                        timeout = setTimeout(() => {\n                            this.$flaskContainer.classList.remove(\"moving\");\n                        }, 500);\n                    });\n                }\n            }\n        });\n    }\n};\nObject(tslib__WEBPACK_IMPORTED_MODULE_0__[\"__decorate\"])([\n    Object(lit_element__WEBPACK_IMPORTED_MODULE_1__[\"property\"])({ type: Boolean })\n], CodeEditor.prototype, \"readonly\", void 0);\nObject(tslib__WEBPACK_IMPORTED_MODULE_0__[\"__decorate\"])([\n    Object(lit_element__WEBPACK_IMPORTED_MODULE_1__[\"property\"])({ type: Boolean })\n], CodeEditor.prototype, \"lineNumbers\", void 0);\nObject(tslib__WEBPACK_IMPORTED_MODULE_0__[\"__decorate\"])([\n    Object(lit_element__WEBPACK_IMPORTED_MODULE_1__[\"property\"])({ type: String })\n], CodeEditor.prototype, \"value\", void 0);\nObject(tslib__WEBPACK_IMPORTED_MODULE_0__[\"__decorate\"])([\n    Object(lit_element__WEBPACK_IMPORTED_MODULE_1__[\"property\"])({ type: String })\n], CodeEditor.prototype, \"theme\", void 0);\nObject(tslib__WEBPACK_IMPORTED_MODULE_0__[\"__decorate\"])([\n    Object(lit_element__WEBPACK_IMPORTED_MODULE_1__[\"property\"])({ type: String })\n], CodeEditor.prototype, \"language\", void 0);\nObject(tslib__WEBPACK_IMPORTED_MODULE_0__[\"__decorate\"])([\n    Object(lit_element__WEBPACK_IMPORTED_MODULE_1__[\"query\"])(\"#flask-container\")\n], CodeEditor.prototype, \"$flaskContainer\", void 0);\nObject(tslib__WEBPACK_IMPORTED_MODULE_0__[\"__decorate\"])([\n    Object(lit_element__WEBPACK_IMPORTED_MODULE_1__[\"query\"])(\"style\")\n], CodeEditor.prototype, \"$style\", void 0);\nCodeEditor = Object(tslib__WEBPACK_IMPORTED_MODULE_0__[\"__decorate\"])([\n    Object(lit_element__WEBPACK_IMPORTED_MODULE_1__[\"customElement\"])(\"code-editor\")\n], CodeEditor);\n\n\n\n//# sourceURL=webpack:///./src/code-editor.ts?");

/***/ }),

/***/ "./src/code-presets.ts":
/*!*****************************!*\
  !*** ./src/code-presets.ts ***!
  \*****************************/
/*! exports provided: codePresets */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"codePresets\", function() { return codePresets; });\nconst codePresets = {\n    blank: {\n        title: \"Blank\",\n        code: \"\"\n    },\n    vanilla: {\n        title: \"Vanilla\",\n        code: `/**\n * A text field web component\n * @attr {Boolean} disabled - Disables this element\n * @fires change - Dispatched when the text of the text field changes\n * @slot - Default content placed inside of the text field\n * @slot header - Content placed in the header of the text field\n * @cssprop --placeholder-color - Controls the color of the placeholder\n * @csspart placeholder - Placeholder css shadow part\n */\nexport class TextField extends HTMLElement {\n  /**\n   * Size of the text field\n   * @attr\n   * @type {\"small\"|\"large\"}\n   */\n  size = \"large\";\n\n  constructor() {\n    super();\n    this.value = \"\";\n  }\n\n  static get observedAttributes() {\n    return [\"placeholder\"];\n  }\n\n  onEnterKey() {\n    /**\n     * Dispatched when the enter key is pressed\n     */\n    this.dispatchEvent(new CustomEvent(\"enter\"));\n  }\n}\n\ncustomElements.define(\"text-field\", TextField);\n\n\n\n`\n    },\n    \"lit-element\": {\n        title: \"LitElement\",\n        code: `import { customElement, LitElement, property } from \"lit-element\";\n\n/**\n * A text field web component\n */\n@customElement(\"text-field\")\nexport class TextField extends LitElement {\n  /**\n   * The value of the text field\n   * @attr\n   */\n  value = \"default value\";\n  \n  @property({ attribute: \"max-length\" }) maxLength = 100;\n  \n  @property({ attribute: false }) errorObject = {description: \"error\"};\n  \n  /**\n   * Disables this element\n   */\n  @property({ type: Boolean }) disabled = false;\n\n  static get properties() {\n    return {\n      /**\n       * Size of the text field\n       * @type {\"small\"|\"large\"}\n       */\n      size: {\n        type: String\n      }\n    };\n  }\n\n  static get observedAttributes() {\n    return [\"value\"];\n  }\n}\n\n\n\n`\n    }\n};\n\n\n//# sourceURL=webpack:///./src/code-presets.ts?");

/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _wca_playground__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./wca-playground */ \"./src/wca-playground.ts\");\n/*import * as monaco from \"monaco-editor\";\n\nmonaco.editor.create(document.getElementById(\"container\")!, {\n  value: [\"function x() {\", '\\tconsole.log(\"Hello world!\");', \"}\"].join(\"\\n\"),\n  language: \"typescript\"\n});*/\n//import * as ts from \"typescript\";\n\n/*import { analyzeComponentsInCode } from \"./analyze-text\";\nimport \"weightless/textarea\";\nimport { jsonTransformer } from \"web-component-analyzer\";\nimport { Textarea } from \"weightless/textarea\";*/\n//import { analyzeComponents } from \"web-component-analyzer\";\n/*const source = \"let x: string  = 'string'\";\n\nlet result = ts.transpileModule(source, {\n  compilerOptions: { module: ts.ModuleKind.CommonJS }\n});\n\nconsole.log(JSON.stringify(result));\n\n*/\n/*const $input = document.querySelector<Textarea>(\"#input\")!;\nconst $output = document.querySelector(\"#output\")!;\n\nfunction refresh() {\n  const result = analyzeComponentsInCode($input.value);\n  $output.innerHTML = jsonTransformer([result.result], result.program, {});\n}\n\n$input.addEventListener(\"input\", () => {\n  refresh();\n});\n\n$input.value = `class MyElement extends HTMLElement {\\n\\n};\\ncustomElements.define(\"my-element\", MyElement);`;\nrefresh();\n*/\n\n\n//# sourceURL=webpack:///./src/index.ts?");

/***/ }),

/***/ "./src/state.ts":
/*!**********************!*\
  !*** ./src/state.ts ***!
  \**********************/
/*! exports provided: saveState, loadState */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"saveState\", function() { return saveState; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"loadState\", function() { return loadState; });\nfunction serialize(values) {\n    const serializedValues = Object.entries(values)\n        .filter(([, value]) => value != null)\n        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)\n        .join(\"&\");\n    return serializedValues.length === 0 ? \"\" : `?${serializedValues}`;\n}\nfunction deserialize(data) {\n    const values = data.split(\"&\").map(entry => {\n        const parts = entry.split(\"=\");\n        return [parts[0].replace(\"?\", \"\"), decodeURIComponent(parts[1])];\n    });\n    return values.reduce((acc, [key, value]) => {\n        acc[key] = value;\n        return acc;\n    }, {});\n}\nfunction saveState(values) {\n    history.pushState(null, \"\", location.pathname + serialize(values));\n}\nfunction loadState() {\n    return deserialize(location.search || \"\");\n}\n\n\n//# sourceURL=webpack:///./src/state.ts?");

/***/ }),

/***/ "./src/util.ts":
/*!*********************!*\
  !*** ./src/util.ts ***!
  \*********************/
/*! exports provided: debounce */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"debounce\", function() { return debounce; });\nconst debounceMap = new Map();\nfunction debounce(id, ms, cb) {\n    if (debounceMap.has(id)) {\n        clearTimeout(debounceMap.get(id));\n    }\n    debounceMap.set(id, setTimeout(cb, ms));\n}\n\n\n//# sourceURL=webpack:///./src/util.ts?");

/***/ }),

/***/ "./src/wca-playground.ts":
/*!*******************************!*\
  !*** ./src/wca-playground.ts ***!
  \*******************************/
/*! exports provided: MyApp */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"MyApp\", function() { return MyApp; });\n/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ \"./node_modules/tslib/tslib.es6.js\");\n/* harmony import */ var lit_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lit-element */ \"./node_modules/lit-element/lit-element.js\");\n/* harmony import */ var _code_editor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./code-editor */ \"./src/code-editor.ts\");\n/* harmony import */ var weightless_tab_group__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! weightless/tab-group */ \"./node_modules/weightless/tab-group/index.js\");\n/* harmony import */ var weightless_tab__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! weightless/tab */ \"./node_modules/weightless/tab/index.js\");\n/* harmony import */ var weightless_icon__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! weightless/icon */ \"./node_modules/weightless/icon/index.js\");\n/* harmony import */ var weightless_select__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! weightless/select */ \"./node_modules/weightless/select/index.js\");\n/* harmony import */ var weightless_button__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! weightless/button */ \"./node_modules/weightless/button/index.js\");\n/* harmony import */ var weightless_banner__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! weightless/banner */ \"./node_modules/weightless/banner/index.js\");\n/* harmony import */ var weightless_dialog__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! weightless/dialog */ \"./node_modules/weightless/dialog/index.js\");\n/* harmony import */ var _state__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./state */ \"./src/state.ts\");\n/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./util */ \"./src/util.ts\");\n/* harmony import */ var _code_presets__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./code-presets */ \"./src/code-presets.ts\");\n\n\n\n\n\n\n\n\n\n\n\n\n\nconst DEFAULT_OUTPUT_KIND = \"markdown\";\nconst BLANK_PRESET_KIND = \"blank\";\nconst DEFAULT_PRESET_KIND = \"vanilla\";\nlet MyApp = class MyApp extends lit_element__WEBPACK_IMPORTED_MODULE_1__[\"LitElement\"] {\n    constructor() {\n        super(...arguments);\n        this.code = \"\";\n        this.output = \"\";\n        this.outputKind = DEFAULT_OUTPUT_KIND;\n        this.selectedPreset = DEFAULT_PRESET_KIND;\n        this.outputKindSelections = [\n            {\n                icon: \"library_books\",\n                kind: \"markdown\",\n                title: \"Markdown\"\n            },\n            {\n                icon: \"code\",\n                kind: \"json\",\n                title: \"custom-elements.json\"\n            },\n            {\n                icon: \"code\",\n                kind: \"json2\",\n                title: \"custom-elements.json\"\n            }\n        ];\n    }\n    static get styles() {\n        return [\n            lit_element__WEBPACK_IMPORTED_MODULE_1__[\"css\"] `\n        * {\n          box-sizing: border-box;\n        }\n\n        :host {\n          display: flex;\n        }\n\n        #editor-container,\n        #result-container {\n          flex-grow: 1;\n          display: flex;\n          position: relative;\n          flex-direction: column;\n        }\n\n        #result-container {\n          max-width: 40%;\n        }\n\n        #editor,\n        #result {\n          flex-grow: 1;\n          --code-editor-padding: 20px;\n        }\n\n        #select {\n          position: absolute;\n          bottom: 20px;\n          left: 20px;\n          min-width: 200px;\n          --input-bg: white;\n          z-index: 123;\n        }\n\n        #info {\n          position: absolute;\n          top: 20px;\n          right: 20px;\n          --primary-lightness: 70%;\n          --primary-saturation: 10%;\n          z-index: 123;\n        }\n\n        @media only screen and (max-width: 900px) {\n          :host {\n            flex-direction: column;\n          }\n\n          #select {\n            left: unset;\n            right: 20px;\n          }\n\n          #result-container,\n          #editor-container {\n            width: 100%;\n            max-width: unset;\n          }\n        }\n\n        @media only screen and (max-width: 500px) {\n          #select {\n            min-width: 100px;\n          }\n\n          #result-container wl-tab-group wl-tab wl-icon {\n            display: none;\n          }\n\n          #banner {\n            font-size: 10px;\n            --button-font-size: 10px;\n            padding: 0;\n            --banner-content-padding: 0 5px;\n          }\n        }\n\n        a {\n          text-decoration: none;\n        }\n\n        @media only screen and (min-width: 1200px) {\n          #result-container {\n            max-width: 720px;\n          }\n        }\n      `\n        ];\n    }\n    connectedCallback() {\n        super.connectedCallback();\n        this.loadState();\n    }\n    loadState() {\n        const state = Object(_state__WEBPACK_IMPORTED_MODULE_10__[\"loadState\"])();\n        this.outputKind = state.format || DEFAULT_OUTPUT_KIND;\n        if (\"code\" in state) {\n            this.selectedPreset = BLANK_PRESET_KIND;\n            this.code = state.code;\n        }\n        else {\n            this.selectedPreset = (state.preset || DEFAULT_PRESET_KIND);\n            this.code = state.code || _code_presets__WEBPACK_IMPORTED_MODULE_12__[\"codePresets\"][this.selectedPreset].code;\n        }\n    }\n    saveState() {\n        Object(_util__WEBPACK_IMPORTED_MODULE_11__[\"debounce\"])(\"saveState\", 1000, () => {\n            Object(_state__WEBPACK_IMPORTED_MODULE_10__[\"saveState\"])({\n                format: this.outputKind === DEFAULT_OUTPUT_KIND ? undefined : this.outputKind,\n                preset: [DEFAULT_PRESET_KIND, BLANK_PRESET_KIND].includes(this.selectedPreset)\n                    ? undefined\n                    : this.selectedPreset,\n                code: this.selectedPreset !== BLANK_PRESET_KIND ? undefined : this.code\n            });\n        });\n    }\n    update(changedProperties) {\n        if (changedProperties.has(\"code\") || changedProperties.has(\"outputKind\")) {\n            this.refreshOutput();\n        }\n        if (changedProperties.has(\"code\") ||\n            changedProperties.has(\"outputKind\") ||\n            changedProperties.has(\"selectedPreset\")) {\n            this.saveState();\n        }\n        super.update(changedProperties);\n    }\n    render() {\n        return lit_element__WEBPACK_IMPORTED_MODULE_1__[\"html\"] `\n      <div id=\"editor-container\">\n        <code-editor id=\"editor\" @change=\"${this.changeCode}\" .value=\"${this.code}\"></code-editor>\n        <wl-select\n          id=\"select\"\n          outlined\n          label=\"Preset\"\n          value=\"${this.selectedPreset}\"\n          @input=\"${(e) => this.changeSelectedPreset(e.target.value)}\"\n        >\n          ${Object.entries(_code_presets__WEBPACK_IMPORTED_MODULE_12__[\"codePresets\"]).map(([id, preset]) => lit_element__WEBPACK_IMPORTED_MODULE_1__[\"html\"] `\n              <option value=\"${id}\">${preset.title}</option>\n            `)}\n        </wl-select>\n        <wl-button id=\"info\" fab flat inverted outlined @click=\"${this.showInfo}\">\n          <wl-icon>info</wl-icon>\n        </wl-button>\n      </div>\n      <div id=\"result-container\">\n        <wl-tab-group>\n          ${this.outputKindSelections.map(({ kind, icon, title }) => lit_element__WEBPACK_IMPORTED_MODULE_1__[\"html\"] `\n              <wl-tab\n                vertical\n                ?checked=\"${this.outputKind === kind}\"\n                @change=\"${(evt) => this.changeOutputKindSelection(evt, kind)}\"\n              >\n                <wl-icon slot=\"before\">${icon}</wl-icon>\n                <span>${title}</span>\n              </wl-tab>\n            `)}\n        </wl-tab-group>\n        ${this.outputKind === \"json\"\n            ? lit_element__WEBPACK_IMPORTED_MODULE_1__[\"html\"] `\n              <wl-banner id=\"banner\">\n                <wl-icon slot=\"icon\">warning</wl-icon>\n                <span>This format is experimental</span>\n                <a slot=\"action\" href=\"https://github.com/webcomponents/custom-elements-json\" target=\"_blank\">\n                  <wl-button slot=\"action\" flat inverted>Learn more</wl-button>\n                </a>\n              </wl-banner>\n            `\n            : undefined}\n        ${this.outputKind === \"json2\"\n            ? lit_element__WEBPACK_IMPORTED_MODULE_1__[\"html\"] `\n              <wl-banner id=\"banner\">\n                <wl-icon slot=\"icon\">warning</wl-icon>\n                <span>This format is experimental</span>\n                <a slot=\"action\" href=\"https://github.com/webcomponents/custom-elements-json/pull/9\" target=\"_blank\">\n                  <wl-button slot=\"action\" flat inverted>Learn more</wl-button>\n                </a>\n              </wl-banner>\n            `\n            : undefined}\n\n        <code-editor id=\"result\" language=\"javascript\" readonly theme=\"light\" .value=\"${this.output}\"></code-editor>\n      </div>\n    `;\n    }\n    changeOutputKindSelection(evt, outputKind) {\n        if (evt.detail) {\n            this.outputKind = outputKind;\n            this.output = \"\";\n            this.refreshOutput();\n        }\n    }\n    changeSelectedPreset(id) {\n        const preset = _code_presets__WEBPACK_IMPORTED_MODULE_12__[\"codePresets\"][id];\n        if (preset != null) {\n            this.code = preset.code;\n            this.selectedPreset = id;\n        }\n    }\n    changeCode() {\n        this.code = this.codeEditor.value;\n        this.selectedPreset = \"blank\";\n        this.refreshOutput();\n    }\n    showInfo() {\n        Object(weightless_dialog__WEBPACK_IMPORTED_MODULE_9__[\"showDialog\"])({\n            fixed: true,\n            backdrop: true,\n            blockScrolling: true,\n            container: document.body,\n            size: weightless_dialog__WEBPACK_IMPORTED_MODULE_9__[\"DialogSize\"].LARGE,\n            template: lit_element__WEBPACK_IMPORTED_MODULE_1__[\"html\"] `\n        <style>\n          table {\n            border-collapse: collapse;\n            text-align: left;\n          }\n\n          h4 {\n            margin-bottom: 10px;\n          }\n\n          thead,\n          tr:first-child {\n            font-weight: bold;\n          }\n          td,\n          th {\n            border: 1px solid black;\n            padding: 10px;\n          }\n        </style>\n        <div slot=\"content\">\n          <p>\n            This playground uses\n            <a href=\"https://github.com/runem/web-component-analyzer\" target=\"_blank\">web-component-analyzer</a> to\n            analyze your web components. The playground supports Typescript.\n          </p>\n          <p>\n            The analyzer only analyzes the structure or your components, - not your templates/html. Therefore you will\n            have to use JSDoc in order to document <b>events</b>, <b>slots</b>, <b>css custom properties</b> and\n            <b>css shadow parts</b>. Sometimes the analyzer can't staticially analyze your <b>properties</b>\n            <b>attributes</b> or <b>events</b> so in that case you will also have to use JSDoc.\n          </p>\n          <table>\n            <thead>\n              <tr>\n                <th>JSDoc Tag</th>\n                <th>Description</th>\n              </tr>\n            </thead>\n            <tbody>\n              <tr>\n                <td>@element</td>\n                <td>\n                  Gives your component a tag name. This JSDoc tag is useful if your 'customElements.define\\` is called\n                  dynamically eg. using a custom function.\n                  <h4>Example:</h4>\n                  <code-editor language=\"html\" value=\"@element my-element\"></code-editor>\n                </td>\n              </tr>\n              <tr>\n                <td>@fires</td>\n                <td>\n                  Documents events.\n                  <h4>Example:</h4>\n                  <code-editor\n                    language=\"html\"\n                    value=\"@fires change - Fires when the value of this element changes\"\n                  ></code-editor>\n                </td>\n              </tr>\n              <tr>\n                <td>@slot</td>\n                <td>\n                  Documents slots. Using an empty name here documents the unnamed (default) slot.\n                  <h4>Example:</h4>\n                  <code-editor language=\"html\" value=\"@slot header - The content of the header\"></code-editor>\n                </td>\n              </tr>\n              <tr>\n                <td>@attr @attribute</td>\n                <td>\n                  Documents an attribute on your component.\n                  <h4>Example:</h4>\n                  <code-editor language=\"html\" value=\"@attr {Boolean} disabled - This button is disabled\"></code-editor>\n                </td>\n              </tr>\n              <tr>\n                <td>@prop @property</td>\n                <td>\n                  Documents a property on your component.\n                  <h4>Example:</h4>\n                  <code-editor language=\"html\" value=\"@prop {Array} orders - An array of orders\"></code-editor>\n                </td>\n              </tr>\n              <tr>\n                <td>@cssprop @cssproperty</td>\n                <td>\n                  Documents a css custom property on your component.\n                  <h4>Example:</h4>\n                  <code-editor\n                    language=\"html\"\n                    value=\"@cssprop --element-color - The color of this element\"\n                  ></code-editor>\n                </td>\n              </tr>\n              <tr>\n                <td>@csspart</td>\n                <td>\n                  Documents a css shadow part on your component.\n                  <h4>Example:</h4>\n                  <code-editor language=\"html\" value=\"@csspart placeholder - The placeholder element\"></code-editor>\n                </td>\n              </tr>\n            </tbody>\n          </table>\n        </div>\n      `\n        });\n    }\n    refreshOutput() {\n        Object(_util__WEBPACK_IMPORTED_MODULE_11__[\"debounce\"])(\"refreshOutput\", 100, () => Object(tslib__WEBPACK_IMPORTED_MODULE_0__[\"__awaiter\"])(this, void 0, void 0, function* () {\n            //const { analyzeComponentsInCode } = await import(/* webpackChunkName: \"typescript\" */ \"./analyze-text\"); // { analyzeComponentsInCode } from \"./analyze-text\";\n            //const { analyzeComponentsInCode } = await import(/* webpackChunkName: \"typescript\" */ \"./analyze-text\"); // { analyzeComponentsInCode } from \"./analyze-text\";\n            const { transformAnalyzerResult, analyzeText } = yield Promise.all(/*! import() | wca */[__webpack_require__.e(\"vendors~wca\"), __webpack_require__.e(\"wca\")]).then(__webpack_require__.bind(null, /*! web-component-analyzer */ \"../../web-component-analyzer/lib/esm/api.js\"));\n            const { results, program } = analyzeText({ fileName: \"web-component-analyzer.ts\", text: this.code }, { config: { analyzeAllDeclarations: true } });\n            switch (this.outputKind) {\n                case \"markdown\":\n                    this.output = transformAnalyzerResult(\"markdown\", results, program, { visibility: \"protected\" });\n                    break;\n                case \"json\":\n                    this.output = transformAnalyzerResult(\"json\", results, program);\n                    break;\n                case \"json2\":\n                    this.output = transformAnalyzerResult(\"json2\", results, program);\n                    break;\n            }\n        }));\n    }\n};\nObject(tslib__WEBPACK_IMPORTED_MODULE_0__[\"__decorate\"])([\n    Object(lit_element__WEBPACK_IMPORTED_MODULE_1__[\"property\"])()\n], MyApp.prototype, \"code\", void 0);\nObject(tslib__WEBPACK_IMPORTED_MODULE_0__[\"__decorate\"])([\n    Object(lit_element__WEBPACK_IMPORTED_MODULE_1__[\"property\"])()\n], MyApp.prototype, \"output\", void 0);\nObject(tslib__WEBPACK_IMPORTED_MODULE_0__[\"__decorate\"])([\n    Object(lit_element__WEBPACK_IMPORTED_MODULE_1__[\"property\"])()\n], MyApp.prototype, \"outputKind\", void 0);\nObject(tslib__WEBPACK_IMPORTED_MODULE_0__[\"__decorate\"])([\n    Object(lit_element__WEBPACK_IMPORTED_MODULE_1__[\"property\"])()\n], MyApp.prototype, \"selectedPreset\", void 0);\nObject(tslib__WEBPACK_IMPORTED_MODULE_0__[\"__decorate\"])([\n    Object(lit_element__WEBPACK_IMPORTED_MODULE_1__[\"query\"])(\"#editor\")\n], MyApp.prototype, \"codeEditor\", void 0);\nMyApp = Object(tslib__WEBPACK_IMPORTED_MODULE_0__[\"__decorate\"])([\n    Object(lit_element__WEBPACK_IMPORTED_MODULE_1__[\"customElement\"])(\"wca-playground\")\n], MyApp);\n\n\n\n//# sourceURL=webpack:///./src/wca-playground.ts?");

/***/ })

/******/ });