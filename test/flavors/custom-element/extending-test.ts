import test from "ava";
import { analyzeText } from "../../../src/analyze/analyze-text";
import { getComponentProp } from "../../helpers/util";

test("Correctly extends interface with interface from different file", t => {
	const { result } = analyzeText([
		{
			fileName: "base.ts",
			text: `
export interface Checked {
  checked: boolean;
}`
		},
		{
			fileName: "main.ts",
			entry: true,
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

	const { members } = result.componentDefinitions[0]?.declaration();

	t.is(1, members.length);
	t.truthy(getComponentProp(members, "checked"));
});

test("Correctly extends interface with interface+value from different file", t => {
	const { result } = analyzeText([
		{
			fileName: "base.ts",
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
			entry: true,
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

	const { members } = result.componentDefinitions[0]?.declaration();

	t.is(1, members.length);
	t.truthy(getComponentProp(members, "checked"));
});

test("Correctly extends class with class from different file", t => {
	const { result } = analyzeText([
		{
			fileName: "base.ts",
			text: `
export class Checked {
  checked: boolean;
}`
		},
		{
			fileName: "main.ts",
			entry: true,
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

	const { members } = result.componentDefinitions[0]?.declaration();

	t.is(1, members.length);
	t.truthy(getComponentProp(members, "checked"));
});

test("Correctly extends interface with interface from same file", t => {
	const { result } = analyzeText([
		{
			fileName: "main.ts",
			entry: true,
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

	const { members } = result.componentDefinitions[0]?.declaration();

	t.is(1, members.length);
	t.truthy(getComponentProp(members, "checked"));
});

test("Correctly extends class with class from same file", t => {
	const { result } = analyzeText([
		{
			fileName: "main.ts",
			entry: true,
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

	const { members } = result.componentDefinitions[0]?.declaration();

	t.is(1, members.length);
	t.truthy(getComponentProp(members, "checked"));
});
