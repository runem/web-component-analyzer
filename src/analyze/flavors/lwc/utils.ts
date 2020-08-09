/* eslint-disable no-console */
//import { Node, ClassDeclaration, getCombinedModifierFlags, ModifierFlags, SyntaxKind } from "typescript";
import { Node, ClassDeclaration, getCombinedModifierFlags, ModifierFlags } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { camelToDashCase } from "../../util/text-util";
import { existsSync, readFileSync } from "fs";
import { parseJsDocForNode } from "../js-doc/parse-js-doc-for-node";

// Discover TS nodes
// https://ts-ast-viewer.com/#

type ComponentRef = {tagName:string};

const LWCCACHE = Symbol("LWC Compoeent");
export function isLwcComponent(node: Node, context: AnalyzerVisitContext): ComponentRef|undefined {
	if((node as any)[LWCCACHE]) {
		return (node as any)[LWCCACHE];
	}
	 const r = _isLwcComponent(node,context);
	 if(r) {
		(node as any)[LWCCACHE] = r;
	 }
	return r;
}

function _isLwcComponent(node: Node, context: AnalyzerVisitContext): ComponentRef|undefined {
	const { ts } = context;
	if (ts.isClassDeclaration(node)) {
		const jsName = node.getSourceFile().fileName;

		const splitjsName = jsName.split("/");
		if(splitjsName.length>=3) {
			const nameSpace = splitjsName[splitjsName.length - 3];
			const componentName = splitjsName[splitjsName.length - 2];
			const tagName = nameSpace + "-" + camelToDashCase(componentName);

			// Main case (~100% of the cases)
			// The class is a default export and there is a template (.html) starting with <template>
			// Moreover the JS file name should match the directory name, minus the extension (js|ts)
			//    https://lwc.dev/guide/reference#html-file
			const flags = getCombinedModifierFlags(node);
			if( (flags & ModifierFlags.ExportDefault) && (jsName.endsWith('.js') || jsName.endsWith('.ts')) ) { 
				const fileName = splitjsName[splitjsName.length - 1];
				const fileNoExt = fileName.substring(0,fileName.length-3)
				if(fileNoExt===componentName) {
					const htmlName = jsName.substring(0,jsName.length-3)+".html";
					if(existsSync(htmlName)) {
						const content = readFileSync(htmlName,'utf8').trim();
						if(content.startsWith("<template>")) {
							return {tagName}
						}
					}
				}
			}

			// Edge case
			// The components are not matching the file naming recommendations, so we check the inheritance
			const lightning = inheritFromLightning(node, context);
			if (lightning) {
				return {tagName}
			}
		}

		// Finally, we use a JS doc definition in case none of the above work
		// This is the last resort
		const v = parseJsDocForNode(
			node,
			["lwc-component"],
			(tagNode, { name }) => {
				return {tagName: name}
			},
			context
		);
		if(v && v.length===1) {
			console.log(JSON.stringify(v[0]))
			return v[0] as ComponentRef;
		}
	}

	return undefined;
}

// Check if the Class inherits from lighning
// For now, we just check one level
function inheritFromLightning(node: ClassDeclaration, context: AnalyzerVisitContext): boolean {
	const {  checker } = context;
	if (node.heritageClauses) {
		for (const clause of node.heritageClauses) {
			// OK we are getting strange results here with the token beeing 87 (ElseKeyword), 89 (ExportKeyword)
			// Not sure why for now, so we skip checking the keyword as 'LightningElement' is dicriminant enough
			//if (clause.token == SyntaxKind.ExtendsKeyword) {
				const symbol = checker.getSymbolAtLocation(clause.types[0].expression);
				if (symbol?.escapedName==='LightningElement') {
					return true
				}
			//}
		}
	}
	return false;
}

// In case we need to debug the nodes
// export function print(node: Node, context: AnalyzerVisitContext): void {
// 	const {ts} = context;
// 	// eslint-disable-next-line no-console
// 	console.log(`\n========== Syntax tree for ${ts.SyntaxKind[node.kind]}`);
// 	let indent = 1;
// 	function _print(node: Node) {
// 	// eslint-disable-next-line no-console
// 	console.log(new Array(indent + 1).join('   ') + ts.SyntaxKind[node.kind]);
// 		indent++;
// 		ts.forEachChild(node, _print);
// 		indent--;
// 	}
// 	_print(node);
// 	// eslint-disable-next-line no-console
// 	console.log(`======================\n`);
// }


/**
 * Checks if the element has an lwc property decorator (@api).
 * @param node
 * @param context
 */
export function hasLwcApiPropertyDecorator(
	node: Node,
	context: AnalyzerVisitContext
): boolean {
	if (node.decorators == null) return false;
	const { ts } = context;

	// Find a decorator with "api" name.
	for (const decorator of node.decorators) {
		const expression = decorator.expression;

		// We find the first decorator calling specific identifier name (@api)
		// Note that this is not a call expression, so we just check that the decorator is an identifier
		if (ts.isIdentifier(expression)) {
			const kind = expression.text;
			if (kind==="api") {
				return true;
			}
		}
	}
	return false;
}
