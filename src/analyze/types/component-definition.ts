import { Node } from "typescript";
import { ComponentDeclaration } from "./component-declaration";

export interface ComponentDefinition {
	identifierNodes: Set<Node>;
	tagNameNodes: Set<Node>;

	tagName: string;
	declaration: () => ComponentDeclaration;
}
