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

export function analyzeComponentDeclaration(initialDeclarationNodes: Node[], context: AnalyzerDeclarationVisitContext): ComponentDeclaration {
	const mainDeclarationNode = initialDeclarationNodes[0];
	if (mainDeclarationNode == null) {
		throw new Error("Couldn't find main declaration node");
	}

	const inheritanceTree = discoverInheritance(initialDeclarationNodes, context);

	const declarationNodes = getUniqueResolvedNodeForInheritanceTree(inheritanceTree);

	// Add initial declaration nodes to the set (nodes that aren't the main declaration node)
	for (const node of initialDeclarationNodes) {
		if (node !== mainDeclarationNode) {
			declarationNodes.add(node);
		}
	}

	//console.log(Array.from(declarationNodes).map(n => n.getText().substr(0, 20)));

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

	context = {
		...context,
		getDeclaration: () => baseDeclaration
	};

	for (const node of declarationNodes) {
		if (shouldExcludeNode(node, context)) {
			continue;
		}

		featureCollections.push(discoverFeatures(node, context));
	}

	//console.dir(featureCollections, { depth: 4 });

	// If all nodes were excluded, return empty declaration
	if (featureCollections.length === 0) {
		return baseDeclaration;
	}

	const mergedFeatureCollection = featureCollections.length > 1 ? mergeFeatures(featureCollections, context) : featureCollections[0];

	//console.dir(mergedFeatureCollection, { depth: 3 });

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

function shouldExcludeNode(node: Node, context: AnalyzerVisitContext): boolean {
	if (!context.config.analyzeLibDom && excludeNode(node, context)) {
		return true;
	}

	const name = getDeclarationName(node, context);

	if (name != null && context.config.excludedDeclarationNames?.includes(name)) {
		return true;
	}

	return false;
}
