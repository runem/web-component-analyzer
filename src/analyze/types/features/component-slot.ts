import { JsDoc } from "../js-doc";

export interface ComponentSlot {
	name?: string;
	jsDoc: JsDoc | undefined;
	permittedTagNames?: string[];
}
