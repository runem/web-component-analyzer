import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";
import { getComponentProp } from "../../helpers/util";

tsTest("Correctly extends interface with interface from different file", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule([
		{
			fileName: "base.ts",
			analyze: false,
			text: `
export interface Checked {
  checked: boolean;
}`
		},
		{
			fileName: "main.ts",
			text: `
import {Checked} from "./base";

interface CheckableElement extends HTMLElement, Checked {
}

declare global {
  interface HTMLElementTagNameMap {
    "checkable-element": CheckableElement;
  }
}`
		}
	]);

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	t.is(1, members.length);
	t.truthy(getComponentProp(members, "checked"));
});

tsTest("Correctly extends interface with interface+value from different file", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule([
		{
			fileName: "base.ts",
			analyze: false,
			text: `
interface Checked {
  checked: boolean;
}
declare const Checked: Checked;
export {Checked};
`
		},
		{
			fileName: "main.ts",
			text: `
import {Checked} from "./base";

interface CheckableElement extends HTMLElement, Checked {
}

declare global {
  interface HTMLElementTagNameMap {
    "checkable-element-with-value": CheckableElement;
  }
}`
		}
	]);

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	t.is(1, members.length);
	t.truthy(getComponentProp(members, "checked"));
});

tsTest("Correctly extends class with class from different file", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule([
		{
			fileName: "base.ts",
			analyze: false,
			text: `
export class Checked {
  checked: boolean;
}`
		},
		{
			fileName: "main.ts",
			text: `
import {Checked} from "./base";

class CheckableElement extends Checked {
}

declare global {
  interface HTMLElementTagNameMap {
    "checkable-element": CheckableElement;
  }
}`
		}
	]);

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	t.is(1, members.length);
	t.truthy(getComponentProp(members, "checked"));
});

tsTest("Correctly extends interface with interface from same file", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule([
		{
			fileName: "main.ts",
			text: `
interface Checked {
	checked: boolean;
}

interface CheckableElement extends HTMLElement, Checked {
}

declare global {
  interface HTMLElementTagNameMap {
    "checkable-element": CheckableElement;
  }
}`
		}
	]);

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	t.is(1, members.length);
	t.truthy(getComponentProp(members, "checked"));
});

tsTest("Correctly extends class with class from same file", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule([
		{
			fileName: "main.ts",
			text: `
class Checked {
	checked: boolean;
}

class CheckableElement extends HTMLElement, Checked {
}

declare global {
  interface HTMLElementTagNameMap {
    "checkable-element": CheckableElement;
  }
}`
		}
	]);

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	t.is(1, members.length);
	t.truthy(getComponentProp(members, "checked"));
});
