import * as tsModule from "typescript";
import { SourceFile } from "typescript";
import { AnalyzerVisitContext } from "./analyzer-visit-context";
import { DEFAULT_FEATURE_COLLECTION_CACHE, DEFAULT_FLAVORS } from "./constants";
import { analyzeComponentDeclaration } from "./stages/analyze-declaration";
import { discoverDefinitions } from "./stages/discover-definitions";
import { AnalyzerOptions } from "./types/analyzer-options";
import { AnalyzerResult } from "./types/analyzer-result";
import { ALL_COMPONENT_FEATURES } from "./types/features/component-feature";

/**
 * Analyzes all components in a source file.
 * @param sourceFile
 * @param options
 */
export function analyzeSourceFile(sourceFile: SourceFile, options: AnalyzerOptions): AnalyzerResult {
	if (options.program == null) {
		throw new Error("A program is required when running 'analyzeSourceFile'");
	}

	// Assign defaults
	const flavors = options.flavors || DEFAULT_FLAVORS;
	const ts = options.ts || tsModule;
	const checker = options.program.getTypeChecker();

	// Create context
	const context: AnalyzerVisitContext = {
		checker,
		ts,
		flavors,
		cache: {
			featureCollection: DEFAULT_FEATURE_COLLECTION_CACHE,
			general: new Map()
		},
		config: {
			analyzeLibDom: false,
			excludedDeclarationNames: [],
			features: ALL_COMPONENT_FEATURES,
			...(options.config || {})
		}
	};

	// Parse all components
	const componentDefinitions = discoverDefinitions(sourceFile, context, (definition, declarationNodes) =>
		analyzeComponentDeclaration(Array.from(declarationNodes)[0], {
			...context,
			getDeclaration: definition.declaration,
			getDefinition: () => definition
		})
	);

	// Parse all global events
	//const globalEvents = parseGlobalEvents(sourceFile, flavors, context);

	return {
		sourceFile,
		componentDefinitions,
		globalEvents: [],
		globalMembers: []
	};
}
