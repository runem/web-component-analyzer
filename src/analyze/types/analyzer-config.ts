import { ComponentFeature } from "./features/component-feature";

/**
 * Configuration to give when analyzing components.
 */
export interface AnalyzerConfig {
	analyzeLibDom?: boolean;
	analyzeLib?: boolean;
	excludedDeclarationNames?: string[];
	features?: ComponentFeature[];
}
