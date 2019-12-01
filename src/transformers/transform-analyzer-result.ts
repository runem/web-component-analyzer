import { Program } from "typescript";
import { AnalyzerResult } from "../analyze/types/analyzer-result";
import { debugJsonTransformer } from "./debug/debug-json-transformer";
import { jsonTransformer } from "./json/json-transformer";
import { markdownTransformer } from "./markdown/markdown-transformer";
import { TransformerConfig } from "./transformer-config";
import { TransformerFunction } from "./transformer-function";
import { TransformerKind } from "./transformer-kind";
import { vscodeTransformer } from "./vscode/vscode-transformer";

const transformerFunctionMap: Record<TransformerKind, TransformerFunction> = {
	debug: debugJsonTransformer,
	json: jsonTransformer,
	markdown: markdownTransformer,
	md: markdownTransformer,
	vscode: vscodeTransformer
};

export function transformAnalyzerResult(
	kind: TransformerKind,
	results: AnalyzerResult | AnalyzerResult[],
	program: Program,
	config: Partial<TransformerConfig> = {}
): string {
	const func = transformerFunctionMap[kind];

	if (func == null) {
		throw new Error(`Couldn't find transformer function for transformer kind: ${kind}`);
	}

	return func(Array.isArray(results) ? results : [results], program, {
		visibility: "public",
		...config
	});
}
