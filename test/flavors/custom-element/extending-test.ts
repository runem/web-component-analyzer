import test from "ava";
import { analyzeComponentsInCode } from "../../helpers/analyze-text";
import { getComponentProp } from "../../helpers/util";

test("Correctly extends interface with interface from different file", t => {
	const { result } = analyzeComponentsInCode([
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

	const {
		componentDefinitions: [
			{
				declaration: { members }
			}
		]
	} = result;

	t.truthy(getComponentProp(members, "checked"));
});

test("Correctly extends class with class from different file", t => {
	const { result } = analyzeComponentsInCode([
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

	const {
		componentDefinitions: [
			{
				declaration: { members }
			}
		]
	} = result;

	t.truthy(getComponentProp(members, "checked"));
});

test("Correctly extends interface with interface from same file", t => {
	const { result } = analyzeComponentsInCode([
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

	const {
		componentDefinitions: [
			{
				declaration: { members }
			}
		]
	} = result;

	t.truthy(getComponentProp(members, "checked"));
});

test("Correctly extends class with class from same file", t => {
	const { result } = analyzeComponentsInCode([
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

	const {
		componentDefinitions: [
			{
				declaration: { members }
			}
		]
	} = result;

	t.truthy(getComponentProp(members, "checked"));
});
