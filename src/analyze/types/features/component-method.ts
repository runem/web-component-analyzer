import { JsDoc } from "../js-doc";
import { Node } from "typescript";
import { VisibilityKind } from "../visibility-kind";

export interface ComponentMethod {
	name: string;
	jsDoc: JsDoc | undefined;
	node?: Node;
	visibility?: VisibilityKind;
}
