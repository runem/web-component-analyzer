import { SourceFile } from "typescript";
import { makeContextFromConfig } from "./make-context-from-config";
import { analyzeComponentDeclaration } from "./stages/analyze-declaration";
import { discoverDeclarations } from "./stages/discover-declarations";
import { discoverDefinitions } from "./stages/discover-definitions";
import { discoverGlobalFeatures } from "./stages/discover-global-features";
import { AnalyzerOptions } from "./types/analyzer-options";
import { AnalyzerResult } from "./types/analyzer-result";
import { ComponentDeclaration, ComponentFeatures } from "./types/component-declaration";

/**
 * Analyzes all components in a source file.
 * @param sourceFile
 * @param options
 */
export function analyzeSourceFile(sourceFile: SourceFile, options: AnalyzerOptions): AnalyzerResult {
	// Create a new context
	const context = makeContextFromConfig(options);

	// Analyze all components
	const componentDefinitions = discoverDefinitions(sourceFile, context, (definition, declarationNodes) =>
		// The component declaration is analyzed lazily
		analyzeComponentDeclaration(declarationNodes, context)
	);

	// Analyze global features
	let globalFeatures: ComponentFeatures | undefined = undefined;
	if (context.config.analyzeGlobalFeatures) {
		globalFeatures = discoverGlobalFeatures(sourceFile, context);
	}

	// Analyze exported declarations
	let declarations: ComponentDeclaration[] | undefined = undefined;
	if (context.config.analyzeAllDeclarations) {
		declarations = discoverDeclarations(sourceFile, context);
	}

	return {
		sourceFile,
		componentDefinitions,
		globalFeatures,
		declarations
	};
}
