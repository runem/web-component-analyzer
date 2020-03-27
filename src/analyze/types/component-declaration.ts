import { Node } from "typescript";
import { ComponentCssPart } from "./features/component-css-part";
import { ComponentCssProperty } from "./features/component-css-property";
import { ComponentEvent } from "./features/component-event";
import { ComponentMember } from "./features/component-member";
import { ComponentMethod } from "./features/component-method";
import { ComponentSlot } from "./features/component-slot";
import { InheritanceTreeNode } from "./inheritance-tree";
import { JsDoc } from "./js-doc";

export interface ComponentFeatures {
	members: ComponentMember[];
	methods: ComponentMethod[];
	events: ComponentEvent[];
	slots: ComponentSlot[];
	cssProperties: ComponentCssProperty[];
	cssParts: ComponentCssPart[];
}

export interface ComponentDeclaration extends ComponentFeatures {
	node: Node;
	inheritanceTree: InheritanceTreeNode;
	declarationNodes: Set<Node>;
	jsDoc: JsDoc | undefined;

	deprecated?: boolean | string;
}
