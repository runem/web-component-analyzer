import { HeritageClause, Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { ComponentDeclarationKind, ComponentHeritageClause, ComponentHeritageClauseKind } from "../../types/component-declaration";
import { findChild, findChildren, resolveDeclarationsDeep } from "../../util/ast-util";
import { InheritanceResult } from "../analyzer-flavor";

/**
 * Discovers inheritance from a node by looking at "extends" and "implements"
 * @param node
 * @param context
 */
export function discoverInheritance(node: Node, context: AnalyzerVisitContext): InheritanceResult | undefined {
	let declarationKind: ComponentDeclarationKind | undefined = undefined;
	const heritageClauses: ComponentHeritageClause[] = [];
	const declarationNodes = new Set<Node>();

	// Resolve the structure of the node
	resolveStructure(node, {
		...context,
		emitDeclaration: decl => declarationNodes.add(decl),
		emitInheritance: (kind, identifier) => heritageClauses.push({ kind, identifier, declaration: undefined }),
		emitDeclarationKind: kind => (declarationKind = declarationKind || kind),
		visitedNodes: new Set<Node>()
	});

	// Reverse heritage clauses because they come out in wrong order
	heritageClauses.reverse();

	return {
		declarationNodes: Array.from(declarationNodes),
		heritageClauses,
		declarationKind
	};
}

interface InheritanceAnalyzerVisitContext extends AnalyzerVisitContext {
	emitDeclaration: (node: Node) => void;
	emitDeclarationKind: (kind: ComponentDeclarationKind) => void;
	emitInheritance: (kind: ComponentHeritageClauseKind, identifier: Node) => void;
	visitedNodes: Set<Node>;
}

function resolveStructure(node: Node, context: InheritanceAnalyzerVisitContext) {
	const { ts } = context;

	if (context.visitedNodes.has(node)) {
		return;
	}

	context.visitedNodes.add(node);

	// Call this function recursively if this node is an identifier
	if (ts.isIdentifier(node)) {
		for (const decl of resolveDeclarationsDeep(node, context)) {
			resolveStructure(decl, context);
		}
	}

	// Emit declaration node if we've found a class of interface
	else if (ts.isClassLike(node) || ts.isInterfaceDeclaration(node)) {
		context.emitDeclarationKind(ts.isClassLike(node) ? "class" : "interface");
		context.emitDeclaration(node);

		// Resolve inheritance
		for (const heritage of node.heritageClauses || []) {
			for (const type of heritage.types || []) {
				resolveHeritage(heritage, type.expression, context);
			}
		}
	}

	// Emit a declaration node if this node is a type literal
	else if (ts.isTypeLiteralNode(node) || ts.isObjectLiteralExpression(node)) {
		context.emitDeclarationKind("interface");
		context.emitDeclaration(node);
	}

	// Emit a mixin if this node is a function
	else if (ts.isFunctionLike(node)) {
		context.emitDeclarationKind("mixin");

		// Else find the first class declaration in the block
		// Note that we don't look for a return statement because this would complicate things
		const clzDecl = findChild(node, ts.isClassLike);
		if (clzDecl != null) {
			resolveStructure(clzDecl, context);
			return;
		}

		// If we didn't find any class declarations, we might be in a function that wraps a mixin
		// Therefore find the return statement and call this method recursively
		const returnNode = findChild(node, ts.isReturnStatement);
		if (returnNode != null && returnNode.expression != null && returnNode.expression !== node) {
			const returnNodeExp = returnNode.expression;

			// If a function call is returned, this function call expression is followed, and the arguments are treated as heritage
			//    Example: return MyFirstMixin(MySecondMixin(Base))   -->   MyFirstMixin is followed, and MySecondMixin + Base are inherited
			if (ts.isCallExpression(returnNodeExp) && returnNodeExp.expression != null) {
				for (const arg of returnNodeExp.arguments) {
					resolveHeritage(undefined, arg, context);
				}

				resolveStructure(returnNodeExp.expression, context);
			}

			return;
		}
	}

	// Find any identifiers if the node is in a declaration file
	else if (node.getSourceFile().isDeclarationFile) {
		findChildren(node, ts.isIdentifier, identifier => {
			resolveStructure(identifier, context);
		});
	}

	// Handle variable declarations that are assigned to functions (mixins)
	else if (ts.isVariableDeclaration(node)) {
		const functionDecl = findChild(node.initializer, ts.isFunctionLike);
		if (functionDecl != null) {
			resolveStructure(functionDecl, context);
		}
	}
}

function resolveHeritage(
	heritage: HeritageClause | ComponentHeritageClauseKind | undefined,
	node: Node,
	context: InheritanceAnalyzerVisitContext
): void {
	const { ts } = context;

	/**
	 * Parse mixins
	 */
	if (ts.isCallExpression(node)) {
		// Mixins
		const { expression: identifier, arguments: args } = node;

		// Extend classes given to the mixin
		// Example: class MyElement extends MyMixin(MyBase) --> MyBase
		// Example: class MyElement extends MyMixin(MyBase1, MyBase2) --> MyBase1, MyBase2
		for (const arg of args) {
			resolveHeritage(heritage, arg, context);
		}

		// Resolve and traverse the mixin function
		// Example: class MyElement extends MyMixin(MyBase) --> MyMixin
		if (identifier != null && ts.isIdentifier(identifier)) {
			resolveHeritage("mixin", identifier, context);
		}
	} else if (ts.isIdentifier(node)) {
		// Try to handle situation like this, by resolving the variable in between
		//    const Base = ExtraMixin(base);
		//    class MixinClass extends Base { }
		let dontEmitHeritageClause = false;

		// Resolve the declaration of this identifier
		const declarations = resolveDeclarationsDeep(node, context);

		for (const decl of declarations) {
			// If the resolved declaration is a variable declaration assigned to a function, try to follow the assignments.
			//    Example:    const MyBase = MyMixin(Base); return class extends MyBase { ... }
			if (context.ts.isVariableDeclaration(decl) && decl.initializer != null) {
				if (context.ts.isCallExpression(decl.initializer)) {
					let hasDeclaration = false;
					resolveStructure(decl, {
						...context,
						emitInheritance: () => {},
						emitDeclarationKind: () => {},
						emitDeclaration: () => {
							hasDeclaration = true;
						}
					});

					if (!hasDeclaration) {
						resolveHeritage(heritage, decl.initializer, context);
						dontEmitHeritageClause = true;
					}
				}
			}

			// Don't emit inheritance if it's a parameter, because the parameter
			//    is a subsitution for the actual base class which we have already resolved.
			else if (context.ts.isParameter(decl)) {
				dontEmitHeritageClause = true;
			}
		}

		if (!dontEmitHeritageClause) {
			// This is an "implements" clause if implement keyword is used or if all the resolved declarations are interfaces
			const kind: ComponentHeritageClauseKind =
				heritage != null && typeof heritage === "string"
					? heritage
					: heritage?.token === ts.SyntaxKind.ImplementsKeyword ||
					  (declarations.length > 0 && !declarations.some(decl => !context.ts.isInterfaceDeclaration(decl)))
					? "implements"
					: "extends";

			context.emitInheritance(kind, node);
		}
	}
}
