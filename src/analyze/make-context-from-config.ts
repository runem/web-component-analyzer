import * as tsModule from "typescript";
import { AnalyzerVisitContext } from "./analyzer-visit-context";
import { DEFAULT_FEATURE_COLLECTION_CACHE, DEFAULT_FLAVORS } from "./constants";
import { AnalyzerOptions } from "./types/analyzer-options";
import { ALL_COMPONENT_FEATURES } from "./types/features/component-feature";

/**
 * Creates an "analyzer visit context" based on some options
 * @param options
 */
export function makeContextFromConfig(options: AnalyzerOptions): AnalyzerVisitContext {
	if (options.program == null) {
		throw new Error("A program is required when running 'analyzeSourceFile'");
	}

	// Assign defaults
	const flavors = options.flavors || DEFAULT_FLAVORS;
	const ts = options.ts || tsModule;
	const checker = options.program.getTypeChecker();

	// Create context
	return {
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
}
