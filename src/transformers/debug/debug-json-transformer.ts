import { Program } from "typescript";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
import { arrayFlat } from "../../util/array-util";
import { stripTypescriptValues } from "../../util/strip-typescript-values";
import { TransformerConfig } from "../transformer-config";
import { TransformerFunction } from "../transformer-function";

/**
 * Transforms results to json.
 * @param results
 * @param program
 * @param config
 */
export const debugJsonTransformer: TransformerFunction = (results: AnalyzerResult[], program: Program, config: TransformerConfig): string => {
	const definitions = arrayFlat(results.map(res => res.componentDefinitions));
	return JSON.stringify(stripTypescriptValues(definitions, program.getTypeChecker()), null, 2);
};
