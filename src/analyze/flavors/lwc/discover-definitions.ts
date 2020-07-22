import { Node, ClassDeclaration, TypeChecker, SyntaxKind } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { DefinitionNodeResult } from "../analyzer-flavor";
import { camelToDashCase } from "../../util/text-util";
/**
 * @param node
 * @param context
 */
export function discoverDefinitions(node: Node, { ts, checker }: AnalyzerVisitContext): DefinitionNodeResult[] | undefined {
	if (ts.isClassDeclaration(node)) {
		const parentClassName = String(getParentClassFQName(node, checker));
		if (parentClassName === "LightningElement") {
			const fileName = node.getSourceFile().fileName;
			const splitFileName = fileName.split("/");
			const nameSpace = splitFileName[splitFileName.length - 3];
			const componentName = splitFileName[splitFileName.length - 2];
			const newName = camelToDashCase(componentName);
			if (newName == null) return undefined;
			const finalNewName = nameSpace + "-" + newName;

			return [
				{
					tagName: finalNewName,
					tagNameNode: node.heritageClauses?.[0].types[0],
					declarationNode: node
				}
			];
		} else {
			return undefined;
		}
	} else {
		return undefined;
	}
}

function getParentClassFQName(node: ClassDeclaration, checker: TypeChecker): string | undefined {
	if (!node.heritageClauses) {
		return;
	}
	for (const clause of node.heritageClauses) {
		if (clause.token == SyntaxKind.ExtendsKeyword) {
			const symbol = checker.getSymbolAtLocation(clause.types[0].expression);
			if (symbol) {
				return checker.getFullyQualifiedName(symbol);
			}
		}
	}
	return;
}
