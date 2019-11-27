import { Node } from "typescript";
import { ComponentCssPart } from "./component-css-part";
import { ComponentCssProperty } from "./component-css-property";
import { ComponentEvent } from "./component-event";
import { ComponentMember } from "./component-member";
import { ComponentMethod } from "./component-method";
import { ComponentSlot } from "./component-slot";
import { InheritanceTreeNode } from "../inheritance-tree";
import { JsDoc } from "../js-doc";

export interface ComponentDeclaration {
	inheritanceTree: InheritanceTreeNode;
	declarationNodes: Set<Node>;
	jsDoc: JsDoc | undefined;

	members: ComponentMember[];
	methods: ComponentMethod[];
	events: ComponentEvent[];
	slots: ComponentSlot[];
	cssProperties: ComponentCssProperty[];
	cssParts: ComponentCssPart[];

	deprecated?: boolean | string;
}
