import { Node } from "typescript";
import { AnalyzerVisitContext } from "../analyzer-visit-context";
import { AnalyzerDeclarationVisitContext, ComponentFeatureCollection } from "../flavors/analyzer-flavor";
import { ComponentDeclaration } from "../types/component-declaration";
import { getNodeName, getSymbol, resolveDeclarations } from "../util/ast-util";
import { getJsDoc } from "../util/js-doc-util";
import { discoverFeatures } from "./discover-features";
import { discoverInheritance } from "./discover-inheritance";
import { excludeNode } from "./flavor/exclude-node";
import { refineDeclaration } from "./flavor/refine-declaration";
import { mergeFeatures } from "./merge/merge-features";

/**
 * Discovers features on component declaration nodes
 * @param initialDeclarationNodes
 * @param baseContext
 * @param options
 */
export function analyzeComponentDeclaration(
	initialDeclarationNodes: Node[],
	baseContext: AnalyzerVisitContext,
	options: { visitedNodes?: Set<Node> } = {}
): ComponentDeclaration {
	const mainDeclarationNode = initialDeclarationNodes[0];
	if (mainDeclarationNode == null) {
		throw new Error("Couldn't find main declaration node");
	}

	// Return right away from the cache if any
	// TODO: better handle invalidating this cache.
	if (baseContext.cache.componentDeclaration.has(mainDeclarationNode)) {
		return baseContext.cache.componentDeclaration.get(mainDeclarationNode)!;
	}

	options.visitedNodes = options.visitedNodes || new Set();

	// Discover inheritance
	const { declarationKind, declarationNodes, heritageClauses } = discoverInheritance(initialDeclarationNodes, options.visitedNodes, baseContext);

	// Expand all heritage clauses with the component declaration
	for (const heritageClause of heritageClauses) {
		// Only resolve declarations we haven't yet seen and shouldn't be excluded
		const declarations = resolveDeclarations(heritageClause.identifier, baseContext).filter(
			n => !options.visitedNodes?.has(n) && !shouldExcludeNode(n, baseContext)
		);

		if (declarations.length > 0) {
			heritageClause.declaration = analyzeComponentDeclaration(declarations, baseContext, options);
		}
	}

	// Get symbol of main declaration node
	const symbol = getSymbol(mainDeclarationNode, baseContext);

	const baseDeclaration: ComponentDeclaration = {
		node: mainDeclarationNode,
		declarationNodes: new Set(declarationNodes),
		symbol,
		heritageClauses,
		kind: declarationKind || "class",
		events: [],
		cssParts: [],
		cssProperties: [],
		members: [],
		methods: [],
		slots: [],
		jsDoc: getJsDoc(mainDeclarationNode, baseContext.ts)
	};

	// Add the "get declaration" hook to the context
	const context: AnalyzerDeclarationVisitContext = {
		...baseContext,
		declarationNode: mainDeclarationNode,
		getDeclaration: () => baseDeclaration,
		sourceFile: mainDeclarationNode.getSourceFile()
	};

	// Find features on all declaration nodes
	const featureCollections: ComponentFeatureCollection[] = [];

	for (const node of declarationNodes) {
		if (shouldExcludeNode(node, context)) {
			continue;
		}

		// Discover component features using flavors
		featureCollections.push(discoverFeatures(node, { ...context, declarationNode: node }));
	}

	// Add all inherited features to the feature collections array
	for (const heritageClause of heritageClauses) {
		if (heritageClause.declaration != null) {
			featureCollections.push({
				...heritageClause.declaration,
				members: heritageClause.declaration.members
			});
		}
	}

	// If all nodes were excluded, return empty declaration
	if (featureCollections.length === 0) {
		return baseDeclaration;
	}

	// Merge all features into one single collection prioritizing features found in first
	const mergedFeatureCollection = mergeFeatures(featureCollections, context);

	// Refine the declaration and return the result
	const refinedDeclaration = refineDeclaration(
		{
			...baseDeclaration,
			cssParts: mergedFeatureCollection.cssParts,
			cssProperties: mergedFeatureCollection.cssProperties,
			events: mergedFeatureCollection.events,
			methods: mergedFeatureCollection.methods,
			members: mergedFeatureCollection.members,
			slots: mergedFeatureCollection.slots
		},
		context
	);

	Object.assign(baseDeclaration, refinedDeclaration);

	baseContext.cache.componentDeclaration.set(mainDeclarationNode, baseDeclaration);

	return baseDeclaration;
}

/**
 * Returns if a node should be excluded from the analyzing
 * @param node
 * @param context
 */
function shouldExcludeNode(node: Node, context: AnalyzerVisitContext): boolean {
	// Uses flavors to determine if the node should be excluded
	if (excludeNode(node, context)) {
		return true;
	}

	// It's possible to exclude declaration names
	const name = getNodeName(node, context);

	if (name != null && context.config.excludedDeclarationNames?.includes(name)) {
		return true;
	}

	return false;
}
