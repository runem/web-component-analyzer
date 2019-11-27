import * as tsModule from "typescript";
import { TypeChecker } from "typescript";
import { AnalyzerFlavor } from "../flavors/analyzer-flavor";
import { AnalyzerConfig } from "./analyzer-config";

/**
 * Options to give when analyzing components
 */
export interface AnalyzerOptions {
	checker: TypeChecker;
	ts?: typeof tsModule;
	flavors?: AnalyzerFlavor[];
	config?: AnalyzerConfig;
}
