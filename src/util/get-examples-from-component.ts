import { ComponentDeclaration } from "../analyze/types/component-declaration";
import { JsDocTag } from "../analyze/types/js-doc";

export type ExampleLanguage = "html" | "javascript";

export interface Example {
	lang: ExampleLanguage;
	code: string;
	description?: string;
}

export function getExamplesFromComponent(declaration: ComponentDeclaration): Example[] {
	const examples = declaration.jsDoc?.tags?.filter(tag => tag.tag === "example" || tag.tag === "demo") || [];
	return examples.map(exampleFromJsDocTag);
}

function exampleFromJsDocTag(tag: JsDocTag): Example {
	const { code, lang, description } = discoverCodeFromExampleText(tag.comment || "");

	console.log(`description`, description, "hmm");

	return {
		lang: lang || discoverLanguageFromExampleText(code),
		description,
		code
	};
}

function discoverCodeFromExampleText(text: string): { code: string; lang?: ExampleLanguage; description?: string } {
	const escapedCodeMatch = text.match(/([\s\S]*)```(\S*)([\s\S]+)```/);

	if (escapedCodeMatch != null) {
		return {
			description: (escapedCodeMatch[1] || "").trim() || undefined,
			lang: (escapedCodeMatch[2] as ExampleLanguage) || undefined,
			code: (escapedCodeMatch[3] || "").trim()
		};
	}

	return { code: text.trim() };
}

function discoverLanguageFromExampleText(text: string): ExampleLanguage {
	if (text.includes("html`")) {
		return "javascript";
	}

	if (text.match(/<\S/)) {
		return "html";
	}

	return "javascript";
}
