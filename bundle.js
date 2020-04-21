!function(e){function t(t){for(var n,i,l=t[0],s=t[1],d=t[2],u=0,p=[];u<l.length;u++)i=l[u],Object.prototype.hasOwnProperty.call(r,i)&&r[i]&&p.push(r[i][0]),r[i]=0;for(n in s)Object.prototype.hasOwnProperty.call(s,n)&&(e[n]=s[n]);for(c&&c(t);p.length;)p.shift()();return a.push.apply(a,d||[]),o()}function o(){for(var e,t=0;t<a.length;t++){for(var o=a[t],n=!0,l=1;l<o.length;l++){var s=o[l];0!==r[s]&&(n=!1)}n&&(a.splice(t--,1),e=i(i.s=o[0]))}return e}var n={},r={0:0},a=[];function i(t){if(n[t])return n[t].exports;var o=n[t]={i:t,l:!1,exports:{}};return e[t].call(o.exports,o,o.exports,i),o.l=!0,o.exports}i.e=function(e){var t=[],o=r[e];if(0!==o)if(o)t.push(o[2]);else{var n=new Promise((function(t,n){o=r[e]=[t,n]}));t.push(o[2]=n);var a,l=document.createElement("script");l.charset="utf-8",l.timeout=120,i.nc&&l.setAttribute("nonce",i.nc),l.src=function(e){return i.p+""+({2:"vendors~wca",3:"wca"}[e]||e)+".bundle.js"}(e);var s=new Error;a=function(t){l.onerror=l.onload=null,clearTimeout(d);var o=r[e];if(0!==o){if(o){var n=t&&("load"===t.type?"missing":t.type),a=t&&t.target&&t.target.src;s.message="Loading chunk "+e+" failed.\n("+n+": "+a+")",s.name="ChunkLoadError",s.type=n,s.request=a,o[1](s)}r[e]=void 0}};var d=setTimeout((function(){a({type:"timeout",target:l})}),12e4);l.onerror=l.onload=a,document.head.appendChild(l)}return Promise.all(t)},i.m=e,i.c=n,i.d=function(e,t,o){i.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:o})},i.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,t){if(1&t&&(e=i(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(i.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)i.d(o,n,function(t){return e[t]}.bind(null,n));return o},i.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="./web-component-analyzer/",i.oe=function(e){throw console.error(e),e};var l=window.webpackJsonp=window.webpackJsonp||[],s=l.push.bind(l);l.push=t,l=l.slice();for(var d=0;d<l.length;d++)t(l[d]);var c=s;a.push([30,1]),o()}({30:function(e,t,o){"use strict";o.r(t);var n=o(0),r=o(1),a=o(27),i=o(28);const l=r.b`
  .dark .codeflask {
    background-image: initial;
    background-color: #383e49;
    color: #c1c2c2;
  }

  .dark .codeflask__textarea {
    caret-color: #fffffb;
    cursor: text;
  }

  .dark .token.comment,
  .dark .token.prolog,
  .dark .token.doctype,
  .dark .token.cdata {
    color: #5c6370;
  }

  .dark .token.punctuation {
    color: #abb2bf;
  }

  .dark .token.selector,
  .dark .token.tag {
    color: #e06c75;
  }

  .dark .token.property,
  .dark .token.boolean,
  .dark .token.number,
  .dark .token.constant,
  .dark .token.symbol,
  .dark .token.attr-name,
  .dark .token.deleted {
    color: #d19a66;
  }

  .dark .token.string,
  .dark .token.char,
  .dark .token.attr-value,
  .dark .token.builtin,
  .dark .token.inserted {
    color: #98c379;
  }

  .dark .token.operator,
  .dark .token.entity,
  .dark .token.url,
  .dark .language-css .token.string,
  .dark .style .token.string {
    color: #56b6c2;
  }

  .dark .token.atrule,
  .dark .token.keyword {
    color: #c678dd;
  }

  .dark .token.function {
    color: #61afef;
  }

  .dark .token.regex,
  .dark .token.important,
  .dark .token.variable {
    color: #c678dd;
  }

  .dark .token.important,
  .dark .token.bold {
    font-weight: bold;
  }

  .dark .token.italic {
    font-style: italic;
  }

  .dark .token.entity {
    cursor: help;
  }
`,s=r.b`
  .light .codeflask {
    background: #fff;
    color: #4f559c;
  }

  .light .codeflask .token.punctuation {
    color: #4a4a4a;
  }

  .light .codeflask .token.keyword {
    color: #8500ff;
  }

  .light .codeflask .token.operator {
    color: #ff5598;
  }

  .light .codeflask .token.string {
    color: #41ad8f;
  }

  .light .codeflask .token.comment {
    color: #9badb7;
  }

  .light .codeflask .token.function {
    color: #8500ff;
  }

  .light .codeflask .token.boolean {
    color: #8500ff;
  }

  .light .codeflask .token.number {
    color: #8500ff;
  }

  .light .codeflask .token.selector {
    color: #8500ff;
  }

  .light .codeflask .token.property {
    color: #8500ff;
  }

  .light .codeflask .token.tag {
    color: #8500ff;
  }

  .light .codeflask .token.attr-value {
    color: #8500ff;
  }
`,d=window.navigator.userAgent,c=d.match(/iPad/i)||d.match(/iPhone/i);let u=class extends r.a{constructor(){super(...arguments),this.readonly=!1,this.lineNumbers=!1,this.value="",this.theme="dark",this.language="javascript"}update(e){super.update(e);const t=e.has("theme")&&e.get("theme")!==this.theme,o=e.has("language")&&e.get("language")!==this.language,n=e.has("value")&&e.get("value")!==this.value,r=e.has("readonly")&&e.get("readonly")!==this.readonly,a=e.has("lineNumbers")&&e.get("lineNumbers")!==this.lineNumbers;t||o||r||a?this.setupFlask():n&&this.flask.updateCode(this.value)}static get styles(){return[r.b`
        :host {
          position: relative;
          display: block;
          overflow: hidden;
          min-height: 40px;
          --code-editor-padding: 10px;
        }

        .codeflask {
          overflow: hidden;
        }

        textarea {
          overflow: visible !important;
          color: transparent !important;
        }

        .codeflask__textarea,
        .codeflask__pre {
          padding: var(--code-editor-padding, 0);
        }

        .light.moving .codeflask__textarea {
          color: black !important;
        }

        .dark.moving .codeflask__textarea {
          color: white !important;
        }

        .moving .codeflask__pre {
          opacity: 0 !important;
        }
      `]}render(){return r.d`
      <style></style>
      <div
        id="flask-container"
        class="${Object(a.a)({dark:"dark"===this.theme,light:"light"===this.theme})}"
      ></div>
    `}didChangeTextField(e){this.value!=e&&(this.value=e,this.dispatchEvent(new CustomEvent("change")),this.requestUpdate().then())}setupFlask(){this.flask=new i.a(this.$flaskContainer,{language:this.language,readonly:this.readonly,lineNumbers:this.lineNumbers});const e=document.head.querySelector("style[id=codeflask-style]");null!=e&&(this.$style.appendChild(e.cloneNode(!0)),e.remove());const t=document.head.querySelector("style[id=theme-default]");t&&t.remove();const o=document.createElement("style");switch(this.theme){case"dark":o.innerHTML=l.cssText;break;case"light":o.innerHTML=s.cssText}this.$style.appendChild(o),this.flask.onUpdate(this.didChangeTextField.bind(this)),this.flask.updateCode(this.value),requestAnimationFrame(()=>{const e=this.shadowRoot.querySelector(".codeflask__textarea");if(null!=e&&(e.setAttribute("wrap","off"),c)){let t;e.addEventListener("scroll",()=>{null!=t&&clearTimeout(t),t=setTimeout(()=>{this.$flaskContainer.classList.remove("moving")},500)}),e.addEventListener("touchstart",()=>{this.$flaskContainer.classList.add("moving")}),e.addEventListener("touchend",()=>{null!=t&&clearTimeout(t),t=setTimeout(()=>{this.$flaskContainer.classList.remove("moving")},500)})}})}};Object(n.b)([Object(r.e)({type:Boolean})],u.prototype,"readonly",void 0),Object(n.b)([Object(r.e)({type:Boolean})],u.prototype,"lineNumbers",void 0),Object(n.b)([Object(r.e)({type:String})],u.prototype,"value",void 0),Object(n.b)([Object(r.e)({type:String})],u.prototype,"theme",void 0),Object(n.b)([Object(r.e)({type:String})],u.prototype,"language",void 0),Object(n.b)([Object(r.f)("#flask-container")],u.prototype,"$flaskContainer",void 0),Object(n.b)([Object(r.f)("style")],u.prototype,"$style",void 0),u=Object(n.b)([Object(r.c)("code-editor")],u);o(33),o(31),o(34),o(32),o(25),o(35);var p=o(23);function h(e){history.pushState(null,"",location.pathname+function(e){const t=Object.entries(e).filter(([,e])=>null!=e).map(([e,t])=>`${e}=${encodeURIComponent(String(t))}`).join("&");return 0===t.length?"":`?${t}`}(e))}function m(){return(location.search||"").split("&").map(e=>{const t=e.split("=");return[t[0].replace("?",""),decodeURIComponent(t[1])]}).reduce((e,[t,o])=>(e[t]=o,e),{})}const f=new Map;function b(e,t,o){f.has(e)&&clearTimeout(f.get(e)),f.set(e,setTimeout(o,t))}const g={blank:{title:"Blank",code:""},vanilla:{title:"Vanilla",code:'/**\n * A text field web component\n * @attr {Boolean} disabled - Disables this element\n * @fires change - Dispatched when the text of the text field changes\n * @slot - Default content placed inside of the text field\n * @slot header - Content placed in the header of the text field\n * @cssprop --placeholder-color - Controls the color of the placeholder\n * @csspart placeholder - Placeholder css shadow part\n */\nexport class TextField extends HTMLElement {\n  /**\n   * Size of the text field\n   * @attr\n   * @type {"small"|"large"}\n   */\n  size = "large";\n\n  constructor() {\n    super();\n    this.value = "";\n  }\n\n  static get observedAttributes() {\n    return ["placeholder"];\n  }\n\n  onEnterKey() {\n    /**\n     * Dispatched when the enter key is pressed\n     */\n    this.dispatchEvent(new CustomEvent("enter"));\n  }\n}\n\ncustomElements.define("text-field", TextField);\n\n\n\n'},"lit-element":{title:"LitElement",code:'import { customElement, LitElement, property } from "lit-element";\n\n/**\n * A text field web component\n */\n@customElement("text-field")\nexport class TextField extends LitElement {\n  /**\n   * The value of the text field\n   * @attr\n   */\n  value = "default value";\n  \n  @property({ attribute: "max-length" }) maxLength = 100;\n  \n  @property({ attribute: false }) errorObject = {description: "error"};\n  \n  /**\n   * Disables this element\n   */\n  @property({ type: Boolean }) disabled = false;\n\n  static get properties() {\n    return {\n      /**\n       * Size of the text field\n       * @type {"small"|"large"}\n       */\n      size: {\n        type: String\n      }\n    };\n  }\n\n  static get observedAttributes() {\n    return ["value"];\n  }\n}\n\n\n\n'}},k="blank",y="vanilla";let v=class extends r.a{constructor(){super(...arguments),this.code="",this.output="",this.outputKind="markdown",this.selectedPreset=y,this.outputKindSelections=[{icon:"library_books",kind:"markdown",title:"Markdown"},{icon:"code",kind:"json",title:"custom-elements.json"},{icon:"code",kind:"json2",title:"custom-elements.json"}]}static get styles(){return[r.b`
        * {
          box-sizing: border-box;
        }

        :host {
          display: flex;
        }

        #editor-container,
        #result-container {
          flex-grow: 1;
          display: flex;
          position: relative;
          flex-direction: column;
        }

        #result-container {
          max-width: 40%;
        }

        #editor,
        #result {
          flex-grow: 1;
          --code-editor-padding: 20px;
        }

        #select {
          position: absolute;
          bottom: 20px;
          left: 20px;
          min-width: 200px;
          --input-bg: white;
          z-index: 123;
        }

        #info {
          position: absolute;
          top: 20px;
          right: 20px;
          --primary-lightness: 70%;
          --primary-saturation: 10%;
          z-index: 123;
        }

        @media only screen and (max-width: 900px) {
          :host {
            flex-direction: column;
          }

          #select {
            left: unset;
            right: 20px;
          }

          #result-container,
          #editor-container {
            width: 100%;
            max-width: unset;
          }
        }

        @media only screen and (max-width: 500px) {
          #select {
            min-width: 100px;
          }

          #result-container wl-tab-group wl-tab wl-icon {
            display: none;
          }

          #banner {
            font-size: 10px;
            --button-font-size: 10px;
            padding: 0;
            --banner-content-padding: 0 5px;
          }
        }

        a {
          text-decoration: none;
        }

        @media only screen and (min-width: 1200px) {
          #result-container {
            max-width: 720px;
          }
        }
      `]}connectedCallback(){super.connectedCallback(),this.loadState()}loadState(){const e=m();this.outputKind=e.format||"markdown","code"in e?(this.selectedPreset=k,this.code=e.code):(this.selectedPreset=e.preset||y,this.code=e.code||g[this.selectedPreset].code)}saveState(){b("saveState",1e3,()=>{h({format:"markdown"===this.outputKind?void 0:this.outputKind,preset:[y,k].includes(this.selectedPreset)?void 0:this.selectedPreset,code:this.selectedPreset!==k?void 0:this.code})})}update(e){(e.has("code")||e.has("outputKind"))&&this.refreshOutput(),(e.has("code")||e.has("outputKind")||e.has("selectedPreset"))&&this.saveState(),super.update(e)}render(){return r.d`
      <div id="editor-container">
        <code-editor id="editor" @change="${this.changeCode}" .value="${this.code}"></code-editor>
        <wl-select
          id="select"
          outlined
          label="Preset"
          value="${this.selectedPreset}"
          @input="${e=>this.changeSelectedPreset(e.target.value)}"
        >
          ${Object.entries(g).map(([e,t])=>r.d`
              <option value="${e}">${t.title}</option>
            `)}
        </wl-select>
        <wl-button id="info" fab flat inverted outlined @click="${this.showInfo}">
          <wl-icon>info</wl-icon>
        </wl-button>
      </div>
      <div id="result-container">
        <wl-tab-group>
          ${this.outputKindSelections.map(({kind:e,icon:t,title:o})=>r.d`
              <wl-tab
                vertical
                ?checked="${this.outputKind===e}"
                @change="${t=>this.changeOutputKindSelection(t,e)}"
              >
                <wl-icon slot="before">${t}</wl-icon>
                <span>${o}</span>
              </wl-tab>
            `)}
        </wl-tab-group>
        ${"json"===this.outputKind?r.d`
              <wl-banner id="banner">
                <wl-icon slot="icon">warning</wl-icon>
                <span>This format is experimental</span>
                <a slot="action" href="https://github.com/webcomponents/custom-elements-json" target="_blank">
                  <wl-button slot="action" flat inverted>Learn more</wl-button>
                </a>
              </wl-banner>
            `:void 0}
        ${"json2"===this.outputKind?r.d`
              <wl-banner id="banner">
                <wl-icon slot="icon">warning</wl-icon>
                <span>This format is experimental</span>
                <a slot="action" href="https://github.com/webcomponents/custom-elements-json/pull/9" target="_blank">
                  <wl-button slot="action" flat inverted>Learn more</wl-button>
                </a>
              </wl-banner>
            `:void 0}

        <code-editor id="result" language="javascript" readonly theme="light" .value="${this.output}"></code-editor>
      </div>
    `}changeOutputKindSelection(e,t){e.detail&&(this.outputKind=t,this.output="",this.refreshOutput())}changeSelectedPreset(e){const t=g[e];null!=t&&(this.code=t.code,this.selectedPreset=e)}changeCode(){this.code=this.codeEditor.value,this.selectedPreset="blank",this.refreshOutput()}showInfo(){Object(p.b)({fixed:!0,backdrop:!0,blockScrolling:!0,container:document.body,size:p.a.LARGE,template:r.d`
        <style>
          table {
            border-collapse: collapse;
            text-align: left;
          }

          h4 {
            margin-bottom: 10px;
          }

          thead,
          tr:first-child {
            font-weight: bold;
          }
          td,
          th {
            border: 1px solid black;
            padding: 10px;
          }
        </style>
        <div slot="content">
          <p>
            This playground uses
            <a href="https://github.com/runem/web-component-analyzer" target="_blank">web-component-analyzer</a> to
            analyze your web components. The playground supports Typescript.
          </p>
          <p>
            The analyzer only analyzes the structure or your components, - not your templates/html. Therefore you will
            have to use JSDoc in order to document <b>events</b>, <b>slots</b>, <b>css custom properties</b> and
            <b>css shadow parts</b>. Sometimes the analyzer can't staticially analyze your <b>properties</b>
            <b>attributes</b> or <b>events</b> so in that case you will also have to use JSDoc.
          </p>
          <table>
            <thead>
              <tr>
                <th>JSDoc Tag</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>@element</td>
                <td>
                  Gives your component a tag name. This JSDoc tag is useful if your 'customElements.define\` is called
                  dynamically eg. using a custom function.
                  <h4>Example:</h4>
                  <code-editor language="html" value="@element my-element"></code-editor>
                </td>
              </tr>
              <tr>
                <td>@fires</td>
                <td>
                  Documents events.
                  <h4>Example:</h4>
                  <code-editor
                    language="html"
                    value="@fires change - Fires when the value of this element changes"
                  ></code-editor>
                </td>
              </tr>
              <tr>
                <td>@slot</td>
                <td>
                  Documents slots. Using an empty name here documents the unnamed (default) slot.
                  <h4>Example:</h4>
                  <code-editor language="html" value="@slot header - The content of the header"></code-editor>
                </td>
              </tr>
              <tr>
                <td>@attr @attribute</td>
                <td>
                  Documents an attribute on your component.
                  <h4>Example:</h4>
                  <code-editor language="html" value="@attr {Boolean} disabled - This button is disabled"></code-editor>
                </td>
              </tr>
              <tr>
                <td>@prop @property</td>
                <td>
                  Documents a property on your component.
                  <h4>Example:</h4>
                  <code-editor language="html" value="@prop {Array} orders - An array of orders"></code-editor>
                </td>
              </tr>
              <tr>
                <td>@cssprop @cssproperty</td>
                <td>
                  Documents a css custom property on your component.
                  <h4>Example:</h4>
                  <code-editor
                    language="html"
                    value="@cssprop --element-color - The color of this element"
                  ></code-editor>
                </td>
              </tr>
              <tr>
                <td>@csspart</td>
                <td>
                  Documents a css shadow part on your component.
                  <h4>Example:</h4>
                  <code-editor language="html" value="@csspart placeholder - The placeholder element"></code-editor>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `})}refreshOutput(){b("refreshOutput",100,()=>Object(n.a)(this,void 0,void 0,(function*(){const{transformAnalyzerResult:e,analyzeText:t}=yield Promise.all([o.e(2),o.e(3)]).then(o.bind(null,49)),{results:n,program:r}=t({fileName:"web-component-analyzer.ts",text:this.code},{config:{analyzeAllDeclarations:!0}});switch(this.outputKind){case"markdown":this.output=e("markdown",n,r,{visibility:"protected"});break;case"json":this.output=e("json",n,r);break;case"json2":this.output=e("json2",n,r)}})))}};Object(n.b)([Object(r.e)()],v.prototype,"code",void 0),Object(n.b)([Object(r.e)()],v.prototype,"output",void 0),Object(n.b)([Object(r.e)()],v.prototype,"outputKind",void 0),Object(n.b)([Object(r.e)()],v.prototype,"selectedPreset",void 0),Object(n.b)([Object(r.f)("#editor")],v.prototype,"codeEditor",void 0),v=Object(n.b)([Object(r.c)("wca-playground")],v)}});