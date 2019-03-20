import * as tsModule from "typescript";
import { Program } from "typescript";
import { CustomElementFlavor } from "./flavors/custom-element/custom-element-flavor";
import { FlavorVisitContext } from "./flavors/parse-component-flavor";
import { parseComponentDeclaration } from "./parse/parse-declaration";
import { ComponentDeclaration } from "./types/component-declaration";
import { ComponentDiagnostic } from "./types/component-diagnostic";

/**
 * This function analyzes only the HTMLElement declaration found in "lib.dom.d.ts" source file provided by Typescript.
 * @param program
 * @param ts
 */
export function analyzeLibDomHtmlElement(program: Program, ts: typeof tsModule = tsModule): ComponentDeclaration | undefined {
	const checker = program.getTypeChecker();

	const endsWithLibDom = "lib.dom.d.ts";

	const domLibSourceFile = program.getSourceFiles().find(sf => sf.fileName.endsWith(endsWithLibDom));
	if (domLibSourceFile == null) {
		return undefined;
		//throw new Error(`Couldn't find '${endsWith}'. Have you included the 'dom' lib in your tsconfig?`);
	}

	return visit(domLibSourceFile, {
		checker,
		ts,
		config: {
			analyzeLibDom: true,
			analyzeHTMLElement: true
		},
		emitDiagnostics(diagnostic: ComponentDiagnostic): void {}
	});
}

function visit(node: tsModule.Node, context: FlavorVisitContext): ComponentDeclaration | undefined {
	if (tsModule.isInterfaceDeclaration(node) && node.name.text === "HTMLElement") {
		return parseComponentDeclaration(node, [new CustomElementFlavor()], context);
	} /*else if (tsModule.isInterfaceDeclaration(node) && node.name.text.match(/^HTML.+Element$/)) {
	 const a = [...(node.heritageClauses || [])].map(hc => hc.getText()).join(", ");
	 console.log(`Element: `, node.name.text, "heritage", a);
	 }*/

	return node.forEachChild(child => {
		return visit(child, context);
	});
}
