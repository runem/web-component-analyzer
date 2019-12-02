import { JsDoc } from "../js-doc";

export interface ComponentCssProperty {
	name: string;
	jsDoc: JsDoc | undefined;
	typeHint?: string;
	default?: any;
}
