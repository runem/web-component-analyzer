import { Program } from "typescript";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
import { arrayFlat } from "../../util/array-util";
import { TransformerFunction } from "../transformer-function";
import { TransformerConfig } from "../transformer-config";

/**
 * Transforms results to json.
 * @param results
 * @param program
 * @param config
 */
export const debugJsonTransformer: TransformerFunction = (results: AnalyzerResult[], program: Program, config: TransformerConfig): string => {
	const definitions = arrayFlat(results.map(res => res.componentDefinitions));
	return JSON.stringify(stripTypescriptValues(definitions), null, 2);
};

function isTypescriptNode(value: any): boolean {
	return value instanceof Object && "kind" in value && "flags" in value;
}

function isTypescriptSourceFile(value: any): boolean {
	return value instanceof Object && "kind" in value && "fileName" in value;
}

function isTypescriptType(value: any): boolean {
	return value instanceof Object && "flags" in value && "checker" in value;
}

export function stripTypescriptValues(input: any): any {
	if (isTypescriptNode(input)) {
		return "{NODE}";
	} else if (isTypescriptSourceFile(input)) {
		return "{SOURCEFILE}";
	} else if (isTypescriptType(input)) {
		return "{TYPE}";
	} else if (Array.isArray(input)) {
		return input.map(stripTypescriptValues);
	} else if (input instanceof Object) {
		const obj = { ...input };
		for (let [key, value] of Object.entries(input)) {
			obj[key] = stripTypescriptValues(value);
		}
		return obj;
	}

	return input;
}
