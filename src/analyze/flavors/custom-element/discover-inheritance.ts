import { ClassLikeDeclaration, HeritageClause, InterfaceDeclaration, Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { InheritanceTreeClause, InheritanceTreeNode } from "../../types/inheritance-tree";
import { findChild, findChildren, resolveDeclarations } from "../../util/ast-util";

/**
 * Discovers inheritance from a node by looking at "extends" and "implements"
 * @param node
 * @param context
 */
export function discoverInheritance(node: Node, context: AnalyzerVisitContext): InheritanceTreeClause[] | undefined {
	if (node == null) return;

	if (context.ts.isClassLike(node) || context.ts.isInterfaceDeclaration(node)) {
		// Visit inherited nodes
		const clauses: InheritanceTreeClause[] = [];
		resolveHeritageClauses(node, {
			...context,
			emitHeritageClause: clause => clauses.push(clause)
		});
		return clauses;
	}

	return undefined;
}

interface VisitContext extends AnalyzerVisitContext {
	emitHeritageClause?: (clause: InheritanceTreeClause) => void;
	emitHeritageNode?: (node: InheritanceTreeNode) => void;
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
	}
}

/**
 * Resolves inheritance clauses from a node
 * @param heritage
 * @param node
 * @param context
 */
function resolveHeritageClause(heritage: HeritageClause, node: Node, context: VisitContext): void {
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
			const resolved: InheritanceTreeNode[] = [];

			// Resolve the mixin class (find out what is being returned from the mixin)
			// And add the mixins as horizontal inheritance.
			resolveMixin(heritage, identifier, {
				...context,
				emitHeritageNode: heritageNode => {
					resolved.push(heritageNode);
				},
				emitHeritageClause: clause => {
					horizontalInheritance.push(clause);
				},
				resolvedIdentifiers: new Set()
			});

			context.emitHeritageClause?.({
				kind: "mixin",
				identifier,
				horizontalInherits: horizontalInheritance,
				resolved
			});
		}
	} else if (ts.isIdentifier(node)) {
		// Visit component declarations for each inherited node.
		const declarations = resolveDeclarationsDeep(node, context);

		const resolved: InheritanceTreeNode[] = [];

		for (const declaration of declarations) {
			if (ts.isCallLikeExpression(declaration) || ts.isIdentifier(declaration)) {
				resolveHeritageClause(heritage, declaration, context);
			} else {
				resolved.push({
					node: declaration,
					identifier: ts.isClassLike(declaration) || ts.isInterfaceDeclaration(declaration) ? declaration.name : undefined
				});
			}
		}

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

/**
 * Resolve a declaration by trying to find the real value
 * @param node
 * @param context
 */
function resolveDeclarationsDeep(node: Node, context: VisitContext): Node[] {
	return resolveDeclarations(node, context).map(declaration => {
		if (context.ts.isVariableDeclaration(declaration) && declaration.initializer != null) {
			return declaration.initializer;
		}

		return declaration;
	});
}

/**
 * Resolves a mixin by finding the actual thing being extended
 * @param heritage
 * @param node
 * @param context
 */
function resolveMixin(heritage: HeritageClause, node: Node, context: VisitContext & { resolvedIdentifiers: Set<unknown> }) {
	const { ts } = context;

	// First, resolve the node
	const declarations = resolveDeclarations(node, context);

	for (const declaration of declarations) {
		// Extend right away if the node is a class declaration
		if (context.ts.isClassLike(declaration) || context.ts.isInterfaceDeclaration(declaration)) {
			//extendWithDeclarationNode(declaration, context);
			context.emitHeritageNode?.({ node: declaration, identifier: declaration.name });
			continue;
		}

		// Else find the first class declaration in the block
		// Note that we don't look for a return statement because this would complicate things
		const clzDecl = findChild(declaration, context.ts.isClassLike);
		if (clzDecl != null) {
			//extendWithDeclarationNode(clzDecl, context);
			context.emitHeritageNode?.({ node: clzDecl, identifier: clzDecl.name });
			continue;
		}

		// If we didn't find any class declarations, we might be in a function that wraps a mixin
		// Therefore find the return statement and call this method recursively
		const returnNode = findChild(declaration, context.ts.isReturnStatement);
		if (returnNode != null && returnNode.expression != null && returnNode.expression !== node) {
			resolveHeritageClause(heritage, returnNode.expression, context);

			continue;
		}

		// Resolve any identifiers if the node is in a declaration file
		if (declaration.getSourceFile().isDeclarationFile) {
			findChildren(declaration, ts.isIdentifier, identifier => {
				if (context.resolvedIdentifiers.has(identifier.text)) {
					return;
				}

				context.resolvedIdentifiers.add(identifier.text);

				resolveMixin(heritage, identifier, context);
			});
		}
	}
}
