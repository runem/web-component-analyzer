import { ComponentCssPart } from "../../types/features/component-css-part";
import { ComponentCssProperty } from "../../types/features/component-css-property";
import { ComponentEvent } from "../../types/features/component-event";
import { ComponentMethod } from "../../types/features/component-method";
import { ComponentSlot } from "../../types/features/component-slot";
import { mergeJsDocIntoJsDoc, mergeNamedEntries } from "./merge-util";

export function mergeSlots(slots: ComponentSlot[]): ComponentSlot[] {
	return mergeNamedEntries(slots, slot => slot.name || "");
}

export function mergeCssParts(cssParts: ComponentCssPart[]): ComponentCssPart[] {
	return mergeNamedEntries(cssParts, cssPart => cssPart.name);
}

export function mergeCssProperties(cssProps: ComponentCssProperty[]): ComponentCssProperty[] {
	return mergeNamedEntries(cssProps, cssProp => cssProp.name);
}

export function mergeMethods(methods: ComponentMethod[]): ComponentMethod[] {
	return mergeNamedEntries(
		methods,
		method => method.name,
		(left, right) => ({
			...left,
			jsDoc: mergeJsDocIntoJsDoc(left.jsDoc, right.jsDoc)
		})
	);
}

export function mergeEvents(events: ComponentEvent[]): ComponentEvent[] {
	return mergeNamedEntries(
		events,
		event => event.name,
		(left, right) => ({
			...left,
			jsDoc: mergeJsDocIntoJsDoc(left.jsDoc, right.jsDoc)
		})
	);
}
