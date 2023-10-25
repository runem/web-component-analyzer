import { analyzeTextWithCurrentTsModule } from "./analyze-text-with-current-ts-module";
import { VirtualSourceFile } from "../../src/analyze";
import { System } from "typescript";
import { getCurrentTsModule } from "./ts-test";
import { transformAnalyzerResult, TransformerConfig, WebTypesTransformerConfig } from "../../src/transformers";
import { GenericJsContribution, HtmlAttribute, HtmlElement, WebtypesSchema } from "../../src/transformers/webtypes/webtypes-schema";

export function runWebtypesBuild(source: VirtualSourceFile[] | VirtualSourceFile, config: Partial<WebTypesTransformerConfig> = {}): string {
	const parseResult = analyzeTextWithCurrentTsModule(source);

	const system: System = getCurrentTsModule().sys;
	const transformerConfig: TransformerConfig = {
		inlineTypes: false,
		visibility: "public",
		cwd: system.getCurrentDirectory(),
		webTypes: {
			name: "test",
			version: "1.0.0",
			...config
		}
	};

	return transformAnalyzerResult("webtypes", parseResult.results, parseResult.program, transformerConfig);
}

export function runAndParseWebtypesBuild(
	source: VirtualSourceFile[] | VirtualSourceFile,
	config: Partial<WebTypesTransformerConfig> = {}
): WebtypesSchema {
	return JSON.parse(runWebtypesBuild(source, config));
}

export function findHtmlElementOfName(schema: WebtypesSchema, name: string): HtmlElement | undefined {
	return schema.contributions?.html?.elements?.find(el => el.name == name);
}

export function findAttributeOfName(element: HtmlElement | undefined, name: string): HtmlAttribute | undefined {
	return element?.attributes?.find(el => el.name == name);
}

export function findPropertyOfName(element: HtmlElement | undefined, name: string): GenericJsContribution | undefined {
	return element?.js?.properties?.find(el => el.name == name);
}
