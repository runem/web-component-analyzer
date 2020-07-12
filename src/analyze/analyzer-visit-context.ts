import * as tsModule from "typescript";
import { Node, SourceFile, TypeChecker, Program } from "typescript";
import { AnalyzerFlavor, ComponentFeatureCollection } from "./flavors/analyzer-flavor";
import { AnalyzerConfig } from "./types/analyzer-config";
import { ComponentDeclaration } from "./types/component-declaration";

/**
 * This context is used in the entire analyzer.
 * A new instance of this is created whenever the analyzer runs.
 */
export interface AnalyzerVisitContext {
	checker: TypeChecker;
	program: Program;
	ts: typeof tsModule;
	config: AnalyzerConfig;
	flavors: AnalyzerFlavor[];
	emitContinue?(): void;
	cache: {
		featureCollection: WeakMap<Node, ComponentFeatureCollection>;
		componentDeclarationInSourceFile: WeakMap<SourceFile, WeakMap<Node, ComponentDeclaration>>;
		general: Map<unknown, unknown>;
	};
}
