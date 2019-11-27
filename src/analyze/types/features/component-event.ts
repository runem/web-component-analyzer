import { SimpleType } from "ts-simple-type";
import { Node, Type } from "typescript";
import { JsDoc } from "../js-doc";
import { VisibilityKind } from "../visibility-kind";

export interface ComponentEvent {
	name: string;
	node: Node;
	jsDoc: JsDoc | undefined;
	type: () => SimpleType | Type;
	typeHint?: string;
	visibility?: VisibilityKind;
}
