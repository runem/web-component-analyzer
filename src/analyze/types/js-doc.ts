import { JSDocTag } from "typescript";

export interface JsDocTag {
	node: JSDocTag;
	tag: string;
	comment?: string;
}

export interface JsDoc {
	comment?: string;
	tags?: JsDocTag[];
}
