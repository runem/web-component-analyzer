import { isAssignableToSimpleTypeKind, SimpleTypeKind } from "ts-simple-type";
import * as tsModule from "typescript";
import {
	Declaration,
	InterfaceDeclaration,
	Node,
	PropertyDeclaration,
	PropertySignature,
	SetAccessorDeclaration,
	SourceFile,
	StringLiteral,
	Symbol,
	SyntaxKind,
	TypeChecker
} from "typescript";

export interface AstContext {
	ts: typeof tsModule;
	checker: TypeChecker;
}

/**
 * Resolves all relevant declarations of a specific node. Defaults to "interfaces and classes".
 * @param node
 * @param context
 */
export function resolveDeclarations(node: Node, context: { checker: TypeChecker; ts: typeof tsModule }): Declaration[] {
	if (node == null) return [];
	const { checker, ts } = context;

	// Get the symbol
	let symbol = checker.getSymbolAtLocation(node);
	if (symbol == null) return [];

	// Resolve aliased symbols
	if (isAliasSymbol(symbol, ts)) {
		symbol = checker.getAliasedSymbol(symbol);
		if (symbol == null) return [];
	}

	// Filters all declarations
	const allDeclarations = symbol.getDeclarations() || [];
	const validDeclarations = allDeclarations.filter(declaration => !ts.isIdentifier(declaration));

	if (validDeclarations.length > 0) {
		return validDeclarations;
	} else {
		const declaration = symbol.valueDeclaration;
		return declaration != null ? [declaration] : [];
	}
}

function isAliasSymbol(symbol: Symbol, ts: typeof tsModule): boolean {
	return (symbol.flags & ts.SymbolFlags.Alias) !== 0;
}

/**
 * Returns if a name is public (doesn't start with "_");
 * @param name
 */
export function isPropNamePublic(name: string): boolean {
	return !name.startsWith("_") && !name.startsWith("#");
}

/**
 * Returns if a node is public looking at its modifiers.
 * @param node
 * @param ts
 */
export function hasPublicSetter(node: PropertyDeclaration | PropertySignature | SetAccessorDeclaration, ts: typeof tsModule): boolean {
	return (
		!hasModifier(node, ts.SyntaxKind.ProtectedKeyword) &&
		!hasModifier(node, ts.SyntaxKind.PrivateKeyword) &&
		!hasModifier(node, ts.SyntaxKind.ReadonlyKeyword) &&
		!hasModifier(node, ts.SyntaxKind.StaticKeyword) &&
		(ts.isIdentifier(node.name) ? isPropNamePublic(node.name.text) : true)
	);
}

/**
 * Returns if a number has a flag
 * @param num
 * @param flag
 */
export function hasFlag(num: number, flag: number): boolean {
	return (num & flag) !== 0;
}

/**
 * Returns if a node has a specific modifier.
 * @param node
 * @param modifierKind
 */
export function hasModifier(node: Node, modifierKind: SyntaxKind): boolean {
	if (node.modifiers == null) return false;
	return (node.modifiers || []).find(modifier => modifier.kind === (modifierKind as unknown)) != null;
}

/**
 * Returns all keys and corresponding interface/class declarations for keys in an interface.
 * @param interfaceDeclaration
 * @param ts
 * @param checker
 */
export function getInterfaceKeys(interfaceDeclaration: InterfaceDeclaration, { ts, checker }: AstContext): [string, Declaration, StringLiteral][] {
	const extensions: [string, Declaration, StringLiteral][] = [];

	for (const member of interfaceDeclaration.members) {
		// { "my-button": MyButton; }
		if (ts.isPropertySignature(member) && ts.isStringLiteral(member.name) && member.type != null && ts.isTypeReferenceNode(member.type)) {
			const key = member.name.text;
			const typeName = member.type.typeName;

			// { ____: MyButton; }
			const declaration = resolveDeclarations(typeName, { checker, ts })[0];

			if (declaration != null) {
				extensions.push([key, declaration, member.name]);
			}
		}
	}

	return extensions;
}

export function isNodeInLibDom(node: Node | SourceFile): boolean {
	return ("fileName" in node ? node.fileName : node.getSourceFile().fileName).endsWith("/lib/lib.dom.d.ts");
}

export function isPropertyRequired(property: PropertySignature | PropertyDeclaration, checker: TypeChecker): boolean {
	const type = checker.getTypeAtLocation(property);

	// Properties in external modules don't have initializers, so we cannot infer if the property is required or not
	if (isNodeInDeclarationFile(property)) {
		return false;
	}

	// The property cannot be required if it has an initializer.
	if (property.initializer != null) {
		return false;
	}

	// Take "myProp?: string" into account
	if (property.questionToken != null) {
		return false;
	}

	// "any" or "unknown" should never be required
	if (isAssignableToSimpleTypeKind(type, [SimpleTypeKind.ANY, SimpleTypeKind.UNKNOWN], checker, { op: "or" })) {
		return false;
	}

	// Return "not required" if the property doesn't have an initializer and no type node.
	// In this case the type could be determined by the jsdoc @type tag but cannot be "null" union if "strictNullCheck" is false.
	if (property.type == null) {
		return false;
	}

	return !isAssignableToSimpleTypeKind(type, [SimpleTypeKind.UNDEFINED, SimpleTypeKind.NULL], checker, { op: "or" });
}

export function isNodeInDeclarationFile(node: Node): boolean {
	return node.getSourceFile().isDeclarationFile;
}

/**
 * Find a node recursively walking up the tree using parent nodes.
 * @param node
 * @param test
 */
export function findParent<T = Node>(node: Node | undefined, test: (node: Node) => boolean): T | undefined {
	if (node == null) return;
	return test(node) ? ((node as unknown) as T) : findParent(node.parent, test);
}

/**
 * Find a node recursively walking down the children of the tree. Depth first search.
 * @param node
 * @param test
 */
export function findChild<T = Node>(node: Node | undefined, test: (node: Node) => node is T & Node): T | undefined {
	if (!node) return;
	if (test(node)) return (node as unknown) as T;
	return node.forEachChild(child => findChild(child, test));
}
