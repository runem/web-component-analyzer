import { SourceFile } from "typescript";
import { makeContextFromConfig } from "./make-context-from-config";
import { analyzeComponentDeclaration } from "./stages/analyze-declaration";
import { discoverDefinitions } from "./stages/discover-definitions";
import { discoverGlobalFeatures } from "./stages/discover-global-features";
import { AnalyzerOptions } from "./types/analyzer-options";
import { AnalyzerResult } from "./types/analyzer-result";
import { ComponentFeatures } from "./types/component-declaration";

/**
 * Analyzes all components in a source file.
 * @param sourceFile
 * @param options
 */
export function analyzeSourceFile(sourceFile: SourceFile, options: AnalyzerOptions): AnalyzerResult {
	const context = makeContextFromConfig(options);

	// Parse all components
	const componentDefinitions = discoverDefinitions(sourceFile, context, (definition, declarationNodes) =>
		analyzeComponentDeclaration(Array.from(declarationNodes)[0], {
			...context,
			getDeclaration: definition.declaration,
			getDefinition: () => definition
		})
	);

	let globalFeatures: ComponentFeatures | undefined = undefined;
	if (context.config.analyzeGlobalFeatures) {
		globalFeatures = discoverGlobalFeatures(sourceFile, context);
	}

	return {
		sourceFile,
		componentDefinitions,
		globalFeatures
	};
}
