import { Node } from "typescript";
import { AnalyzerVisitContext } from "../analyzer-visit-context";
import { ComponentDeclaration } from "../types/component-declaration";
import { ComponentDefinition } from "../types/component-definition";
import { ComponentCssPart } from "../types/features/component-css-part";
import { ComponentCssProperty } from "../types/features/component-css-property";
import { ComponentEvent } from "../types/features/component-event";
import { ComponentFeature } from "../types/features/component-feature";
import { ComponentMember } from "../types/features/component-member";
import { ComponentMethod } from "../types/features/component-method";
import { ComponentSlot } from "../types/features/component-slot";
import { InheritanceTreeClause } from "../types/inheritance-tree";

export type PriorityKind = "low" | "medium" | "high";

export interface DefinitionNodeResult {
	tagName: string;
	declarationNode: Node; // Where to find the node that contains the "meat" of the component
	identifierNode?: Node; // Where to find the node that refers to the declaration node
	tagNameNode?: Node; // Where to find the node that contains the name of the component
	analyzerFlavor?: AnalyzerFlavor;
}

export interface ComponentMemberResult {
	priority: PriorityKind;
	member: ComponentMember;
}

export interface FeatureVisitReturnTypeMap {
	member: ComponentMemberResult;
	method: ComponentMethod;
	cssproperty: ComponentCssProperty;
	csspart: ComponentCssPart;
	event: ComponentEvent;
	slot: ComponentSlot;
}

export interface ComponentFeatureCollection {
	memberResults: ComponentMemberResult[];
	methods: ComponentMethod[];
	events: ComponentEvent[];
	slots: ComponentSlot[];
	cssProperties: ComponentCssProperty[];
	cssParts: ComponentCssPart[];
}

export interface AnalyzerDeclarationVisitContext extends AnalyzerVisitContext {
	getDefinition: () => ComponentDefinition;
	getDeclaration: () => ComponentDeclaration;
}

export type FeatureDiscoverVisitMap<Context extends AnalyzerVisitContext> = {
	[K in ComponentFeature]: (node: Node, context: Context) => FeatureVisitReturnTypeMap[K][] | undefined;
};

export type FeatureRefineVisitMap = {
	[K in ComponentFeature]: (
		feature: FeatureVisitReturnTypeMap[K],
		context: AnalyzerVisitContext
	) => FeatureVisitReturnTypeMap[K] | FeatureVisitReturnTypeMap[K][] | undefined;
};

export interface AnalyzerFlavor {
	excludeNode?(node: Node, context: AnalyzerVisitContext): boolean | undefined;
	discoverDefinitions?(node: Node, context: AnalyzerVisitContext): DefinitionNodeResult[] | undefined;
	discoverInheritance?(node: Node, context: AnalyzerVisitContext): InheritanceTreeClause[] | undefined;
	discoverFeatures?: Partial<FeatureDiscoverVisitMap<AnalyzerDeclarationVisitContext>>;
	discoverGlobalFeatures?: Partial<FeatureDiscoverVisitMap<AnalyzerVisitContext>>;
	refineFeature?: Partial<FeatureRefineVisitMap>;
	refineDeclaration?(declaration: ComponentDeclaration, context: AnalyzerDeclarationVisitContext): ComponentDeclaration | undefined;
}
