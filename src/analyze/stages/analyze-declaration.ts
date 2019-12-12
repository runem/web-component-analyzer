import { Node } from "typescript";
import { AnalyzerVisitContext } from "../analyzer-visit-context";
import { AnalyzerDeclarationVisitContext, ComponentFeatureCollection } from "../flavors/analyzer-flavor";
import { ComponentDeclaration } from "../types/component-declaration";
import { getDeclarationName } from "../util/ast-util";
import { getUniqueResolvedNodeForInheritanceTree } from "../util/inheritance-tree-util";
import { getJsDoc } from "../util/js-doc-util";
import { discoverFeatures } from "./discover-features";
import { discoverInheritance } from "./discover-inheritance";
import { excludeNode } from "./flavor/exclude-node";
import { refineDeclaration } from "./flavor/refine-declaration";
import { mergeFeatures } from "./merge/merge-features";

/**
 * Discovers features on component declaration nodes
 * @param initialDeclarationNodes
 * @param context
 */
export function analyzeComponentDeclaration(initialDeclarationNodes: Node[], context: AnalyzerDeclarationVisitContext): ComponentDeclaration {
	const mainDeclarationNode = initialDeclarationNodes[0];
	if (mainDeclarationNode == null) {
		throw new Error("Couldn't find main declaration node");
	}

	// Discover the inheritance tree
	const inheritanceTree = discoverInheritance(initialDeclarationNodes, context);

	// Find unique resolved nodes in the inheritance tree
	const declarationNodes = getUniqueResolvedNodeForInheritanceTree(inheritanceTree);

	// Add initial declaration nodes to the set (nodes that aren't the main declaration node)
	for (const node of initialDeclarationNodes) {
		if (node !== mainDeclarationNode) {
			declarationNodes.add(node);
		}
	}

	const featureCollections: ComponentFeatureCollection[] = [];

	const baseDeclaration: ComponentDeclaration = {
		events: [],
		cssParts: [],
		cssProperties: [],
		members: [],
		methods: [],
		slots: [],
		jsDoc: getJsDoc(mainDeclarationNode, context.ts),
		inheritanceTree,
		declarationNodes
	};

	// Add the "get declaration" hook to the context
	context = {
		...context,
		getDeclaration: () => baseDeclaration
	};

	// Find features on all declaration nodes
	for (const node of declarationNodes) {
		if (shouldExcludeNode(node, context)) {
			continue;
		}

		// Discover component features using flavors
		featureCollections.push(discoverFeatures(node, { ...context, declarationNode: node }));
	}

	// If all nodes were excluded, return empty declaration
	if (featureCollections.length === 0) {
		return baseDeclaration;
	}

	// Merge all features into one single collection prioritizing features found in first
	const mergedFeatureCollection = featureCollections.length > 1 ? mergeFeatures(featureCollections, context) : featureCollections[0];

	// Refine the declaration and return the result
	return refineDeclaration(
		{
			...baseDeclaration,
			cssParts: mergedFeatureCollection.cssParts,
			cssProperties: mergedFeatureCollection.cssProperties,
			events: mergedFeatureCollection.events,
			methods: mergedFeatureCollection.methods,
			members: mergedFeatureCollection.memberResults.map(({ member }) => member),
			slots: mergedFeatureCollection.slots
		},
		context
	);
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
	const name = getDeclarationName(node, context);

	if (name != null && context.config.excludedDeclarationNames?.includes(name)) {
		return true;
	}

	return false;
}
