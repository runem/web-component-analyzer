import { analyzeText } from "web-component-analyzer";
import { transformAnalyzerResult } from "web-component-analyzer";

const code = `/**
   * A text field web component
   * @attr {Boolean} disabled - Disables this element
   * @fires change - Dispatched when the text of the text field changes
   * @slot - Default content placed inside of the text field
   * @slot header - Content placed in the header of the text field
   * @cssprop --placeholder-color - Controls the color of the placeholder
   * @csspart placeholder - Placeholder css shadow part
   */
  export class TextField extends HTMLElement {
      /**
       * Size of the text field
       * @attr
       * @type {"small"|"large"}
       * @slot
       */
      size = "large";
      constructor() {
        super();
        this.value = "";
      }
      static get observedAttributes() {
        return ["placeholder"];
      }
      onEnterKey() {
        /**
         * Dispatched when the enter key is pressed
         */
        this.dispatchEvent(new CustomEvent("enter"));
      }
    }
    customElements.define("text-field", TextField);`;

const { result, program } = analyzeText(code);

const format = "markdown";

const output = transformAnalyzerResult(format, result, program);
