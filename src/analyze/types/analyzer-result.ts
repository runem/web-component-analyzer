import { SourceFile } from "typescript";
import { ComponentFeatures } from "./component-declaration";
import { ComponentDefinition } from "./component-definition";

/**
 * The result returned after components have been analyzed.
 */
export interface AnalyzerResult {
	sourceFile: SourceFile;
	componentDefinitions: ComponentDefinition[];
	globalFeatures?: ComponentFeatures;
}
