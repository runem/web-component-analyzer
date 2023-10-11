import { isAssignableToSimpleTypeKind } from "ts-simple-type";
import type * as tsModule from "typescript";
import type {
	Declaration,
	Decorator,
	Identifier,
	InterfaceDeclaration,
	Node,
	PropertyDeclaration,
	PropertySignature,
	SetAccessorDeclaration,
	Symbol,
	SyntaxKind,
	TypeChecker
} from "typescript";
import { ModifierKind } from "../types/modifier-kind";
import { VisibilityKind } from "../types/visibility-kind";
import { resolveNodeValue } from "./resolve-node-value";
import { isNamePrivate } from "./text-util";

export interface AstContext {
	ts: typeof tsModule;
	checker: TypeChecker;
}

/**
 * Resolves all relevant declarations of a specific node.
 * @param node
 * @param context
 */
export function resolveDeclarations(node: Node, context: { checker: TypeChecker; ts: typeof tsModule }): Declaration[] {
	if (node == null) return [];

	const symbol = getSymbol(node, context);
	if (symbol == null) return [];

	return resolveSymbolDeclarations(symbol);
}

/**
 * Returns the symbol of a node.
 * This function follows aliased symbols.
 * @param node
 * @param context
 */
export function getSymbol(node: Node, context: { checker: TypeChecker; ts: typeof tsModule }): Symbol | undefined {
	if (node == null) return undefined;
	const { checker, ts } = context;

	// Get the symbol
	let symbol = checker.getSymbolAtLocation(node);

	if (symbol == null) {
		const identifier = getNodeIdentifier(node, context);
		symbol = identifier != null ? checker.getSymbolAtLocation(identifier) : undefined;
	}

	// Resolve aliased symbols
	if (symbol != null && isAliasSymbol(symbol, ts)) {
		symbol = checker.getAliasedSymbol(symbol);
		if (symbol == null) return undefined;
	}

	return symbol;
}

/**
 * Resolves the declarations of a symbol. A valueDeclaration is always the first entry in the array
 * @param symbol
 */
export function resolveSymbolDeclarations(symbol: Symbol): Declaration[] {
	// Filters all declarations
	const valueDeclaration = symbol.valueDeclaration;
	const declarations = symbol.getDeclarations() || [];

	if (valueDeclaration == null) {
		return declarations;
	} else {
		// Make sure that "valueDeclaration" is always the first entry
		return [valueDeclaration, ...declarations.filter(decl => decl !== valueDeclaration)];
	}
}

/**
 * Resolve a declaration by trying to find the real value by following assignments.
 * @param node
 * @param context
 */
export function resolveDeclarationsDeep(node: Node, context: { checker: TypeChecker; ts: typeof tsModule }): Node[] {
	const declarations: Node[] = [];
	const allDeclarations = resolveDeclarations(node, context);

	for (const declaration of allDeclarations) {
		if (context.ts.isVariableDeclaration(declaration) && declaration.initializer != null && context.ts.isIdentifier(declaration.initializer)) {
			declarations.push(...resolveDeclarationsDeep(declaration.initializer, context));
		} else if (context.ts.isTypeAliasDeclaration(declaration) && declaration.type != null && context.ts.isIdentifier(declaration.type)) {
			declarations.push(...resolveDeclarationsDeep(declaration.type, context));
		} else {
			declarations.push(declaration);
		}
	}

	return declarations;
}

/**
 * Returns if the symbol has "alias" flag
 * @param symbol
 * @param ts
 */
export function isAliasSymbol(symbol: Symbol, ts: typeof tsModule): boolean {
	return hasFlag(symbol.flags, ts.SymbolFlags.Alias);
}

/**
 * Returns a set of modifiers on a node
 * @param node
 * @param ts
 */
export function getModifiersFromNode(node: Node, ts: typeof tsModule): Set<ModifierKind> | undefined {
	const modifiers: Set<ModifierKind> = new Set();

	if (hasModifier(node, ts.SyntaxKind.ReadonlyKeyword, ts)) {
		modifiers.add("readonly");
	}

	if (hasModifier(node, ts.SyntaxKind.StaticKeyword, ts)) {
		modifiers.add("static");
	}

	if (ts.isGetAccessor(node)) {
		modifiers.add("readonly");
	}

	return modifiers.size > 0 ? modifiers : undefined;
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
export function hasModifier(node: Node, modifierKind: SyntaxKind, ts: typeof tsModule): boolean {
	if (!ts.canHaveModifiers(node)) {
		return false;
	}
	const modifiers = ts.getModifiers(node);
	if (modifiers == null) return false;
	return (node.modifiers || []).find(modifier => modifier.kind === (modifierKind as unknown)) != null;
}

/**
 * Returns the visibility of a node
 */
export function getMemberVisibilityFromNode(
	node: PropertyDeclaration | PropertySignature | SetAccessorDeclaration | Node,
	ts: typeof tsModule
): VisibilityKind | undefined {
	if (hasModifier(node, ts.SyntaxKind.PrivateKeyword, ts) || ("name" in node && ts.isIdentifier(node.name) && isNamePrivate(node.name.text))) {
		return "private";
	} else if (hasModifier(node, ts.SyntaxKind.ProtectedKeyword, ts)) {
		return "protected";
	} else if (getNodeSourceFileLang(node) === "ts") {
		// Only return "public" in typescript land
		return "public";
	}

	return undefined;
}

/**
 * Returns all keys and corresponding interface/class declarations for keys in an interface.
 * @param interfaceDeclaration
 * @param context
 */
export function getInterfaceKeys(
	interfaceDeclaration: InterfaceDeclaration,
	context: AstContext
): { key: string; keyNode: Node; identifier?: Node; declaration?: Node }[] {
	const extensions: { key: string; keyNode: Node; identifier?: Node; declaration?: Node }[] = [];

	const { ts } = context;

	for (const member of interfaceDeclaration.members) {
		// { "my-button": MyButton; }
		if (ts.isPropertySignature(member) && member.type != null) {
			const resolvedKey = resolveNodeValue(member.name, context);
			if (resolvedKey == null) {
				continue;
			}

			let identifier: Node | undefined;
			let declaration: Node | undefined;
			if (ts.isTypeReferenceNode(member.type)) {
				// { ____: MyButton; } or { ____: namespace.MyButton; }
				identifier = member.type.typeName;
			} else if (ts.isTypeLiteralNode(member.type)) {
				identifier = undefined;
				declaration = member.type;
			} else {
				continue;
			}

			if (declaration != null || identifier != null) {
				extensions.push({ key: String(resolvedKey.value), keyNode: resolvedKey.node, declaration, identifier });
			}
		}
	}

	return extensions;
}

// noinspection JSUnusedGlobalSymbols
export function isPropertyRequired(property: PropertySignature | PropertyDeclaration, checker: TypeChecker, ts: typeof tsModule): boolean {
	const type = checker.getTypeAtLocation(property);

	// Properties in external modules don't have initializers, so we cannot infer if the property is required or not
	if (isNodeInDeclarationFile(property)) {
		return false;
	}

	if (ts.isPropertySignature(property)) {
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
	if (isAssignableToSimpleTypeKind(type, ["ANY", "UNKNOWN"], checker)) {
		return false;
	}

	// Return "not required" if the property doesn't have an initializer and no type node.
	// In this case the type could be determined by the jsdoc @type tag but cannot be "null" union if "strictNullCheck" is false.
	if (property.type == null) {
		return false;
	}

	return !isAssignableToSimpleTypeKind(type, ["UNDEFINED", "NULL"], checker);
}

/**
 * Find a node recursively walking up the tree using parent nodes.
 * @param node
 * @param test
 */
export function findParent<T extends Node = Node>(node: Node | undefined, test: (node: Node) => node is T): T | undefined {
	if (node == null) return;
	return test(node) ? node : findParent(node.parent, test);
}

/**
 * Find a node recursively walking down the children of the tree. Depth first search.
 * @param node
 * @param test
 */
export function findChild<T extends Node = Node>(node: Node | undefined, test: (node: Node) => node is T): T | undefined {
	if (!node) return;
	if (test(node)) return node;
	return node.forEachChild(child => findChild(child, test));
}

/**
 * Find multiple children by walking down the children of the tree. Depth first search.
 * @param node
 * @param test
 * @param emit
 */
export function findChildren<T extends Node = Node>(node: Node | undefined, test: (node: Node) => node is T, emit: (node: T) => void): void {
	if (!node) return;
	if (test(node)) {
		emit(node);
	}
	node.forEachChild(child => findChildren(child, test, emit));
}

/**
 * Returns the language of the node's source file
 * @param node
 */
export function getNodeSourceFileLang(node: Node): "js" | "ts" {
	return node.getSourceFile().fileName.endsWith("ts") ? "ts" : "js";
}

/**
 * Returns if a node is in a declaration file
 * @param node
 */
export function isNodeInDeclarationFile(node: Node): boolean {
	return node.getSourceFile().isDeclarationFile;
}

/**
 * Returns the leading comment for a given node
 * @param node
 * @param ts
 */
export function getLeadingCommentForNode(node: Node, ts: typeof tsModule): string | undefined {
	const sourceFileText = node.getSourceFile().text;

	const leadingComments = ts.getLeadingCommentRanges(sourceFileText, node.pos);

	if (leadingComments != null && leadingComments.length > 0) {
		return sourceFileText.substring(leadingComments[0].pos, leadingComments[0].end);
	}

	return undefined;
}

/**
 * Returns the declaration name of a given node if possible.
 * @param node
 * @param context
 */
export function getNodeName(node: Node, context: { ts: typeof tsModule }): string | undefined {
	return getNodeIdentifier(node, context)?.getText();
}

/**
 * Returns the declaration name of a given node if possible.
 * @param node
 * @param context
 */
export function getNodeIdentifier(node: Node, context: { ts: typeof tsModule }): Identifier | undefined {
	if (context.ts.isIdentifier(node)) {
		return node;
	} else if (
		(context.ts.isClassLike(node) ||
			context.ts.isInterfaceDeclaration(node) ||
			context.ts.isVariableDeclaration(node) ||
			context.ts.isMethodDeclaration(node) ||
			context.ts.isPropertyDeclaration(node) ||
			context.ts.isFunctionDeclaration(node)) &&
		node.name != null &&
		context.ts.isIdentifier(node.name)
	) {
		return node.name;
	}

	return undefined;
}

/**
 * Returns all decorators in either the node's `decorators` or `modifiers`.
 * @param node
 * @param context
 */
export function getDecorators(node: Node, context: { ts: typeof tsModule }): ReadonlyArray<Decorator> {
	const { ts } = context;

	return ts.canHaveDecorators(node) ? ts.getDecorators(node) ?? [] : [];
}
