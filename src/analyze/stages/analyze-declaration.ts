import { Node } from "typescript";
import { AnalyzerVisitContext } from "../analyzer-visit-context";
import { AnalyzerDeclarationVisitContext, ComponentFeatureCollection } from "../flavors/analyzer-flavor";
import { ComponentDeclaration } from "../types/component-declaration";
import { getUniqueResolvedNodeForInheritanceTree } from "../util/inheritance-tree-util";
import { getJsDoc } from "../util/js-doc-util";
import { discoverFeatures } from "./discover-features";
import { discoverInheritance } from "./discover-inheritance";
import { excludeNode } from "./flavor/exclude-node";
import { refineDeclaration } from "./flavor/refine-declaration";
import { mergeFeatures } from "./merge/merge-features";

export function analyzeComponentDeclaration(declarationNode: Node, context: AnalyzerDeclarationVisitContext): ComponentDeclaration {
	const inheritanceTree = discoverInheritance(declarationNode, context);

	const declarationNodes = getUniqueResolvedNodeForInheritanceTree(inheritanceTree);

	/*console.dir(
		Array.from(declarationNodes).map(n => n.getText()),
		{ depth: 3 }
	);*/

	const featureCollections: ComponentFeatureCollection[] = [];

	const baseDeclaration: ComponentDeclaration = {
		events: [],
		cssParts: [],
		cssProperties: [],
		members: [],
		methods: [],
		slots: [],
		jsDoc: getJsDoc(declarationNode, context.ts),
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
	if (!context.config.analyzeLibDom && excludeNode(node.getSourceFile(), context)) {
		return true;
	}

	const name = getDeclarationName(node, context);

	if (name != null && context.config.excludedDeclarationNames?.includes(name)) {
		return true;
	}

	return false;
}

function getDeclarationName(node: Node, context: AnalyzerVisitContext): string | undefined {
	if (context.ts.isClassLike(node) || context.ts.isInterfaceDeclaration(node)) {
		return node.name?.text;
	} else if (context.ts.isVariableDeclaration(node)) {
		return node.name?.getText();
	}

	return undefined;
}
