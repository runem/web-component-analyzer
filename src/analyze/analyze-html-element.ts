import * as tsModule from "typescript";
import { Node, Program } from "typescript";
import { AnalyzerVisitContext } from "./analyzer-visit-context";
import { DEFAULT_COMPONENT_DECLARATION_CACHE, DEFAULT_FEATURE_COLLECTION_CACHE } from "./constants";
import { CustomElementFlavor } from "./flavors/custom-element/custom-element-flavor";
import { makeContextFromConfig } from "./make-context-from-config";
import { analyzeComponentDeclaration } from "./stages/analyze-declaration";
import { ComponentDeclaration } from "./types/component-declaration";
import { ALL_COMPONENT_FEATURES } from "./types/features/component-feature";

/**
 * This function only analyzes the HTMLElement declaration found in "lib.dom.d.ts" source file provided by Typescript.
 * @param program
 * @param ts
 */
export function analyzeHTMLElement(program: Program, ts: typeof tsModule = tsModule): ComponentDeclaration | undefined {
	const endsWithLibDom = "lib.dom.d.ts";

	const domLibSourceFile = program.getSourceFiles().find(sf => sf.fileName.endsWith(endsWithLibDom));
	if (domLibSourceFile == null) {
		return undefined;
		//throw new Error(`Couldn't find '${endsWith}'. Have you included the 'dom' lib in your tsconfig?`);
	}

	return visit(domLibSourceFile, {
		...makeContextFromConfig({
			program,
			ts,
			flavors: [new CustomElementFlavor()],
			config: {
				analyzeDefaultLib: true,
				features: ALL_COMPONENT_FEATURES
			}
		}),
		cache: {
			featureCollection: DEFAULT_FEATURE_COLLECTION_CACHE,
			componentDeclarationCache: DEFAULT_COMPONENT_DECLARATION_CACHE,
			general: new Map()
		}
	});
}

function visit(node: Node, context: AnalyzerVisitContext): ComponentDeclaration | undefined {
	if (context.ts.isInterfaceDeclaration(node) && node.name != null && node.name.text === "HTMLElement") {
		return analyzeComponentDeclaration([node], context);
	}

	return node.forEachChild(child => {
		return visit(child, context);
	});
}
