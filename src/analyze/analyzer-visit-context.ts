import { TypeChecker, Node } from "typescript";
import * as tsModule from "typescript";
import { AnalyzerConfig } from "./types/analyzer-config";
import { AnalyzerFlavor, ComponentFeatureCollection } from "./flavors/analyzer-flavor";

export interface AnalyzerVisitContext {
	checker: TypeChecker;
	ts: typeof tsModule;
	config: AnalyzerConfig;
	flavors: AnalyzerFlavor[];
	emitContinue?(): void;
	cache: {
		featureCollection: WeakMap<Node, ComponentFeatureCollection>;
	};
}
