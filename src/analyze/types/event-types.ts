import { SimpleType } from "ts-simple-type";
import { Node, Type } from "typescript";
import { JsDoc } from "./js-doc";

export interface EventDeclaration {
	node: Node;
	type: SimpleType | Type;
	name: string;
	jsDoc?: JsDoc;
}
