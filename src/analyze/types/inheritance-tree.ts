import { Identifier, Node } from "typescript";

export interface InheritanceTreeClause {
	kind: "mixin" | "interface" | "class";
	identifier: Identifier;
	horizontalInherits?: InheritanceTreeClause[];
	resolved?: InheritanceTreeNode[];
}

export interface InheritanceTreeNode {
	node: Node;
	identifier: Identifier | undefined;
	inherits?: InheritanceTreeClause[];
}
