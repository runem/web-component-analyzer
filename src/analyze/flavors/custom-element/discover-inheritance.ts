import { ClassLikeDeclaration, HeritageClause, InterfaceDeclaration, Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { InheritanceTreeClause, InheritanceTreeNode } from "../../types/inheritance-tree";
import { findChild, findChildren, resolveDeclarations } from "../../util/ast-util";

export function discoverInheritance(node: Node, context: AnalyzerVisitContext): InheritanceTreeClause[] | undefined {
	if (node == null) return;

	if (context.ts.isClassLike(node) || context.ts.isInterfaceDeclaration(node)) {
		// Visit inherited nodes
		const clauses: InheritanceTreeClause[] = [];
		resolveHeritageClauses(node, {
			...context,
			emitHeritageClause: clause => clauses.push(clause)
		});

		//console.log((node.getSourceFile() as any)["locals"]);
		//context.checker.getSymbolsInScope()

		return clauses;
	}

	return undefined;
}

interface VisitContext extends AnalyzerVisitContext {
	emitHeritageClause?: (clause: InheritanceTreeClause) => void;
	//emitHeritageNode?: (node: InheritanceTreeNode) => void;
}

/**
 * Visits and emit declaration members in each interface/class-like inherited node.
 * @param node
 * @param context
 */
function resolveHeritageClauses(node: InterfaceDeclaration | ClassLikeDeclaration, context: VisitContext): void {
	if (node.heritageClauses != null) {
		for (const heritage of node.heritageClauses || []) {
			for (const type of heritage.types) {
				resolveHeritageClause(heritage, type.expression, context);
			}
		}
		// class Test implements MyBase
		// Don't visit interfaces if we are looking at a class, because the class already declares all things from the interface
		/*if (ts.isClassLike(node) && heritage.token === ts.SyntaxKind.ImplementsKeyword) {
				for (const type of heritage.types) {
					//console.log("context.emitInheritNode(", type.expression);
					//console.log("context.emitInherit(", type.expression.getText());
					//context.emitInheritanceNode(type.expression);
					//context.emitInheritanceIdentifier(type.expression);
					if (ts.isIdentifier(type.expression)) {
						emit({
							kind: "interface",
							identifier: type.expression
						});
					}
				}
				continue;
			}*/

		// [extends|implements] MyBase
	}
}

function resolveHeritageClause(heritage: HeritageClause, node: Node, context: VisitContext): void {
	const { ts } = context;

	if (ts.isCallExpression(node)) {
		// Mixins
		const { expression: identifier, arguments: args } = node;

		// Extend classes given to the mixin
		// Example: class MyElement extends MyMixin(MyBase) --> MyBase
		// Example: class MyElement extends MyMixin(MyBase1, MyBase2) --> MyBase1, MyBase2
		const horizontalInheritance: InheritanceTreeClause[] = [];
		for (const arg of args) {
			resolveHeritageClause(heritage, arg, {
				...context,
				emitHeritageClause: clause => horizontalInheritance.push(clause)
			});
		}

		// Resolve and traverse the mixin function
		// Example: class MyElement extends MyMixin(MyBase) --> MyMixin
		if (identifier != null && ts.isIdentifier(identifier)) {
			const declarations = resolveDeclarations(identifier, context);

			const resolved: InheritanceTreeNode[] = [];

			for (const declaration of declarations) {
				// Extend right away if the node is a class declaration
				if (context.ts.isClassLike(declaration)) {
					//extendWithDeclarationNode(declaration, context);
					resolved.push({ node: declaration, identifier: declaration.name });
					continue;
				}

				// Else find the first class declaration in the block
				// Note that we don't look for a return statement because this would complicate things
				const clzDecl = findChild(declaration, context.ts.isClassLike);
				if (clzDecl != null) {
					//extendWithDeclarationNode(clzDecl, context);
					resolved.push({ node: clzDecl, identifier: clzDecl.name });
					continue;
				}

				// If we didn't find any class declarations, we might be in a function that wraps a mixin
				// Therefore find the return statement and call this method recursively
				const returnNode = findChild(declaration, context.ts.isReturnStatement);
				if (returnNode != null && returnNode.expression != null && returnNode.expression !== node) {
					resolveHeritageClause(heritage, returnNode.expression, {
						...context,
						emitHeritageClause: clause => {
							horizontalInheritance.push(clause);
						}
					});

					continue;
				}

				// Resolve any identifiers if the node is in a declaration file
				if (declaration.getSourceFile().isDeclarationFile) {
					//context.ts.isVariableDeclaration(declaration)
					const foundIdentifiers = new Set<string>();

					findChildren(declaration, ts.isIdentifier, identifier => {
						if (foundIdentifiers.has(identifier.text)) {
							return;
						}

						foundIdentifiers.add(identifier.text);

						resolveHeritageClause(heritage, identifier, {
							...context,
							emitHeritageClause: clause => {
								horizontalInheritance.push(clause);
							}
						});
					});
					continue;
				}
			}

			context.emitHeritageClause?.({
				kind: "mixin",
				identifier,
				horizontalInherits: horizontalInheritance,
				resolved
			});
		}
	} else if (ts.isIdentifier(node)) {
		const declarations = resolveDeclarations(node, context);

		// Visit component declarations for each inherited node.
		const resolved: InheritanceTreeNode[] = declarations.map(declaration => ({
			node: declaration,
			identifier: ts.isClassLike(declaration) || ts.isInterfaceDeclaration(declaration) ? declaration.name : undefined
		}));
		//extendWithDeclarationNode(declaration, context);
		const kind =
			heritage.token === ts.SyntaxKind.ImplementsKeyword || ts.isInterfaceDeclaration(heritage.parent)
				? node.text?.toLowerCase().includes("mixin")
					? "mixin"
					: "interface"
				: "class";

		context.emitHeritageClause?.({
			kind,
			identifier: node,
			resolved
		});
	}

	return undefined;
}

// @ts-ignore
function resolveMixin(node: Node, context: AnalyzerVisitContext): InheritanceTreeNode | undefined {
	// Extend right away if the node is a class declaration
	if (context.ts.isClassLike(node)) {
		//extendWithDeclarationNode(declaration, context);
		return { node, identifier: node.name };
	}

	// Else find the first class declaration in the block
	// Note that we don't look for a return statement because this would complicate things
	const clzDecl = findChild(node, context.ts.isClassLike);
	if (clzDecl != null) {
		//extendWithDeclarationNode(clzDecl, context);
		return { node: clzDecl, identifier: clzDecl.name };
	}

	// If we didn't find any class declarations, we might be in a function that wraps a mixin
	// Therefore find the return statement and call this method recursively
	const returnNode = findChild(node, context.ts.isReturnStatement);
	if (returnNode != null && returnNode.expression != null && returnNode.expression !== node) {
		/*const aa = (() => {
			// find identifier
			if (context.ts.isCallExpression(returnNode.expression)) {
				return returnNode.expression.expression;
			}
			return returnNode.expression;
		})();*/

		const declarations = resolveDeclarations(returnNode.expression, context);

		if (declarations.length > 0) {
			return resolveMixin(declarations[0], context);
		}
	}

	return undefined;
}
