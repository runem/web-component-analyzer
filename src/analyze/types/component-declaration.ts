import { Node } from "typescript";
import { ComponentCSSProperty } from "./component-css-property";
import { ComponentMember } from "./component-member";
import { ComponentSlot } from "./component-slot";
import { EventDeclaration } from "./event-types";
import { JsDoc } from "./js-doc";

export interface ComponentDeclaration {
	node: Node;
	inheritNodes: Node[];
	inherits: string[];
	members: ComponentMember[];
	events: EventDeclaration[];
	slots: ComponentSlot[];
	cssProperties: ComponentCSSProperty[];
	deprecated?: boolean | string;
	name?: string;
	jsDoc?: JsDoc;
}
