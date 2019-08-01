import { JSDocTag, JSDoc } from "typescript";

export interface JsDocTag {
	node: JSDocTag;
	tag: string;
	comment?: string;
}

export interface JsDoc {
	node?: JSDoc;
	comment?: string;
	tags?: JsDocTag[];
}
