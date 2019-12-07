import { ComponentDeclaration } from "../analyze/types/component-declaration";
import { JsDocTag } from "../analyze/types/js-doc";

export interface Example {
	lang?: string;
	code: string;
	description?: string;
}

/**
 * Parses and returns examples for a component.
 * @param declaration
 */
export function getExamplesFromComponent(declaration: ComponentDeclaration): Example[] {
	const examples = declaration.jsDoc?.tags?.filter(tag => tag.tag === "example" || tag.tag === "demo") || [];
	return examples.map(exampleFromJsDocTag);
}

/**
 * Returns an example based on a jsdoc tag
 * @param tag
 */
function exampleFromJsDocTag(tag: JsDocTag): Example {
	const { code, lang, description } = discoverCodeFromExampleText(tag.comment || "");

	return {
		lang,
		description,
		code
	};
}

/**
 * Parses some text and returns the first found example
 * @param text
 */
function discoverCodeFromExampleText(text: string): { code: string; lang?: string; description?: string } {
	// Check if there is a code example already like this: ```code here ```
	const escapedCodeMatch = text.match(/([\s\S]*)```(\S*)([\s\S]+)```/);

	if (escapedCodeMatch != null) {
		return {
			description: (escapedCodeMatch[1] || "").trim() || undefined,
			lang: (escapedCodeMatch[2] as string) || undefined,
			code: (escapedCodeMatch[3] || "").trim()
		};
	}

	// Else, assume that the text is the code
	return { code: text.trim(), lang: discoverLanguageFromExampleText(text) };
}

/**
 * Returns the language of some code based on assumptions
 * @param code
 */
function discoverLanguageFromExampleText(code: string): string {
	if (code.includes("html`")) {
		return "javascript";
	}

	if (code.match(/<\S/)) {
		return "html";
	}

	return "javascript";
}
