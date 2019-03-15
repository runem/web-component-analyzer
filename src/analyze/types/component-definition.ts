import { Node } from "typescript";
import { ComponentDeclaration } from "./component-declaration";

export interface ComponentDefinition {
	fromLib: boolean;
	node: Node;
	tagName: string;
	declaration: ComponentDeclaration;
}
