import { SimpleType } from "ts-simple-type";
import { Node, Type } from "typescript";
import { JsDoc } from "../js-doc";
import { VisibilityKind } from "../visibility-kind";

export interface ComponentMethod {
	name: string;
	jsDoc: JsDoc | undefined;
	node?: Node;
	visibility?: VisibilityKind;
	type?: () => SimpleType | Type;
}
