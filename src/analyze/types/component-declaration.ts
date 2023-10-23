import { Node, SourceFile, Symbol, Type } from "typescript";
import { ComponentCssPart } from "./features/component-css-part";
import { ComponentCssProperty } from "./features/component-css-property";
import { ComponentEvent } from "./features/component-event";
import { ComponentMember } from "./features/component-member";
import { ComponentMethod } from "./features/component-method";
import { ComponentSlot } from "./features/component-slot";
import { JsDoc } from "./js-doc";

export interface ComponentFeatures {
	members: ComponentMember[];
	methods: ComponentMethod[];
	events: ComponentEvent[];
	slots: ComponentSlot[];
	cssProperties: ComponentCssProperty[];
	cssParts: ComponentCssPart[];
}

export type ComponentHeritageClauseKind = "implements" | "extends" | "mixin";

export interface ComponentHeritageClause {
	kind: ComponentHeritageClauseKind;
	identifier: Node;
	declaration: ComponentDeclaration | undefined;
}

export type ComponentDeclarationKind = "mixin" | "interface" | "class";

export interface ComponentDeclaration extends ComponentFeatures {
	sourceFile: SourceFile;
	node: Node;
	declarationNodes: Set<Node>;

	kind: ComponentDeclarationKind;
	jsDoc?: JsDoc;
	symbol?: Symbol;
	deprecated?: boolean | string;
	heritageClauses: ComponentHeritageClause[];
	/**
	 * A map from declaration nodes of this declarations's ancestors to the types
	 * they generate in the base type tree of this component's type (i.e. with any
	 * known type arguments resolved).
	 */
	ancestorDeclarationNodeToType: Map<Node, Type>;
}
