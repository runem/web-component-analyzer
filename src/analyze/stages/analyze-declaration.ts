import { Node } from "typescript";
import { ComponentDeclaration } from "../types/component-declaration";
import { isNodeInLibDom } from "../util/ast-util";
import { getUniqueResolvedNodeForInheritanceTree } from "../util/inheritance-tree-util";
import { getJsDoc } from "../util/js-doc-util";
import { AnalyzerVisitContext } from "../analyzer-visit-context";
import { ComponentFeatureCollection } from "../flavors/analyzer-flavor";
import { discoverFeatures } from "./discover-features";
import { discoverInheritance } from "./discover-inheritance";
import { refineDeclaration } from "./flavor/refine-declaration";
import { mergeFeatures } from "./merge/merge-features";

export function analyzeComponentDeclaration(declarationNode: Node, context: AnalyzerVisitContext): ComponentDeclaration {
	const inheritanceTree = discoverInheritance(declarationNode, context);

	const declarationNodes = getUniqueResolvedNodeForInheritanceTree(inheritanceTree);

	/*console.dir(
		Array.from(declarationNodes).map(n => n.getText()),
		{ depth: 3 }
	);*/

	const featureCollections: ComponentFeatureCollection[] = [];

	for (const node of declarationNodes) {
		if (!context.config.analyzeLibDom && isNodeInLibDom(node)) {
			continue;
		}

		featureCollections.push(discoverFeatures(node, context));
	}

	//console.dir(featureCollections, { depth: 4 });

	const mergedFeatureCollection = featureCollections.length > 1 ? mergeFeatures(featureCollections, context) : featureCollections[0];

	//console.dir(mergedFeatureCollection, { depth: 3 });

	return refineDeclaration(
		{
			cssParts: mergedFeatureCollection.cssParts,
			cssProperties: mergedFeatureCollection.cssProperties,
			events: mergedFeatureCollection.events,
			methods: mergedFeatureCollection.methods,
			members: mergedFeatureCollection.memberResults.map(({ member }) => member),
			slots: mergedFeatureCollection.slots,
			declarationNodes,
			inheritanceTree,
			jsDoc: getJsDoc(declarationNode, context.ts)
		},
		context
	);
}
