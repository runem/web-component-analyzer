import * as tsModule from "typescript";
import { Program } from "typescript";
import { CustomElementFlavor } from "./flavors/custom-element/custom-element-flavor";
import { FlavorVisitContext } from "./flavors/parse-component-flavor";
import { parseComponentDeclaration } from "./parse/parse-declaration";
import { ComponentDiagnostic } from "./types/component-diagnostic";
import { ComponentDeclaration } from "./types/component-declaration";

export function analyzeLibDomHtmlElement(program: Program, ts: typeof tsModule = tsModule) {
	const checker = program.getTypeChecker();

	const endsWith = "lib.dom.d.ts";
	const domLibSourceFile = program.getSourceFiles().find(sf => sf.fileName.endsWith(endsWith));
	if (domLibSourceFile == null) {
		throw new Error(`Couldn't find '${endsWith}'. Have you included the 'dom' lib in your tsconfig?`);
	}

	const htmlElementDeclaration = visit(domLibSourceFile, {
		checker,
		ts,
		config: {
			analyzeLibDom: true
		},
		emitDiagnostics(diagnostic: ComponentDiagnostic): void {}
	});

	if (htmlElementDeclaration == null) {
		throw new Error(":(");
	}

	console.log(htmlElementDeclaration.members.map(m => ("attrName" in m ? m.attrName : "propName" in m ? m.propName : "unknown")));
	console.log(domLibSourceFile.fileName);
}

function visit(node: tsModule.Node, context: FlavorVisitContext): ComponentDeclaration | undefined {
	if (tsModule.isInterfaceDeclaration(node) && node.name.text === "HTMLElement") {
		return parseComponentDeclaration(node, [new CustomElementFlavor()], context);
	} else if (tsModule.isInterfaceDeclaration(node) && node.name.text.match(/^HTML.+Element$/)) {
		const a = [...(node.heritageClauses || [])].map(hc => hc.getText()).join(", ");
		console.log(`Element: `, node.name.text, "heritage", a);
	}

	return node.forEachChild(child => {
		return visit(child, context);
	});
}
