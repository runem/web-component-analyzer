import { isAssignableToSimpleTypeKind, SimpleTypeKind } from "ts-simple-type";
import * as tsModule from "typescript";
import {
	Declaration,
	Identifier,
	InterfaceDeclaration,
	Node,
	PropertyDeclaration,
	PropertySignature,
	SetAccessorDeclaration,
	StringLiteral,
	Symbol,
	SyntaxKind,
	TypeChecker
} from "typescript";
import { AnalyzerVisitContext } from "../analyzer-visit-context";
import { VisibilityKind } from "../types/visibility-kind";

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

export function isAliasSymbol(symbol: Symbol, ts: typeof tsModule): boolean {
	return (symbol.flags & ts.SymbolFlags.Alias) !== 0;
}

/**
 * Returns if a name is private (starts with "_" or "#");
 * @param name	 * @param name
 */
export function isNamePrivate(name: string): boolean {
	return name.startsWith("_") || name.startsWith("#");
}

/**
 * Returns if a node is not readable and static.
 * This function is used because modifiers have not been added to the output yet.
 * @param node
 * @param ts
 */
export function isMemberAndWritable(node: Node, ts: typeof tsModule): boolean {
	return !hasModifier(node, ts.SyntaxKind.ReadonlyKeyword) && !hasModifier(node, ts.SyntaxKind.StaticKeyword);
}

/**
 * Returns if a node is public looking at its modifiers.
 * @param node
 * @param ts
 */
export function isNodeWritableMember(node: Node, ts: typeof tsModule): boolean {
	return !hasModifier(node, ts.SyntaxKind.ReadonlyKeyword) && !hasModifier(node, ts.SyntaxKind.StaticKeyword);
}
/*export function hasPublicSetter(node: PropertyDeclaration | PropertySignature | SetAccessorDeclaration, ts: typeof tsModule): boolean {
	return (
		!hasModifier(node, ts.SyntaxKind.ProtectedKeyword) &&
		!hasModifier(node, ts.SyntaxKind.PrivateKeyword) &&
		!hasModifier(node, ts.SyntaxKind.ReadonlyKeyword) &&
		!hasModifier(node, ts.SyntaxKind.StaticKeyword) &&
		(ts.isIdentifier(node.name) ? isPropNamePublic(node.name.text) : true)
	);
}*/

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
 * Returns the visibility of a node
 * @param node	 * @param node
 * @param ts	 * @param ts
 */
export function getMemberVisibilityFromNode(
	node: PropertyDeclaration | PropertySignature | SetAccessorDeclaration | Node,
	ts: typeof tsModule
): VisibilityKind | undefined {
	if (hasModifier(node, ts.SyntaxKind.PrivateKeyword) || ("name" in node && ts.isIdentifier(node.name) && isNamePrivate(node.name.text))) {
		return "private";
	} else if (hasModifier(node, ts.SyntaxKind.ProtectedKeyword)) {
		return "protected";
	} else if (getNodeSourceFileLang(node) === "ts") {
		return "public";
	}

	return undefined;
}

/**
 * Returns all keys and corresponding interface/class declarations for keys in an interface.
 * @param interfaceDeclaration
 * @param ts
 * @param checker
 */
export function getInterfaceKeys(
	interfaceDeclaration: InterfaceDeclaration,
	{ ts, checker }: AstContext
): { key: string; keyNode: StringLiteral | Identifier; identifier?: Node; declaration: Declaration }[] {
	const extensions: { key: string; keyNode: StringLiteral | Identifier; identifier?: Node; declaration: Declaration }[] = [];

	for (const member of interfaceDeclaration.members) {
		// { "my-button": MyButton; }
		if (ts.isPropertySignature(member) && member.type != null) {
			const keyNode = member.name;

			let key: string | undefined;
			if (ts.isStringLiteral(keyNode)) {
				key = keyNode.text;
			} else if (ts.isIdentifier(keyNode)) {
				key = keyNode.getText();
			} else {
				continue;
			}

			let declaration, identifier: Node | undefined;
			if (ts.isTypeReferenceNode(member.type)) {
				// { ____: MyButton; } or { ____: namespace.MyButton; }
				identifier = member.type.typeName;
				declaration = resolveDeclarations(identifier, { checker, ts })[0];
			} else if (ts.isTypeLiteralNode(member.type)) {
				identifier = undefined;
				declaration = member.type;
			} else {
				continue;
			}

			if (declaration != null) {
				extensions.push({ key, keyNode, declaration, identifier });
			}
		}
	}

	return extensions;
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

export function findChildren<T extends Node = Node>(node: Node | undefined, test: (node: Node) => node is T, emit: (node: T) => void) {
	if (!node) return;
	if (test(node)) {
		emit(node);
	}
	node.forEachChild(child => findChildren(child, test, emit));
}

export function getNodeSourceFileLang(node: Node): "js" | "ts" {
	return node.getSourceFile().fileName.endsWith("ts") ? "ts" : "js";
}

export function getLeadingCommentForNode(node: Node, ts: typeof tsModule): string | undefined {
	const sourceFileText = node.getSourceFile().text;
	const leadingComments = ts.getLeadingCommentRanges(sourceFileText, node.pos);
	if (leadingComments != null && leadingComments.length > 0) {
		return sourceFileText.substring(leadingComments[0].pos, leadingComments[0].end);
	}

	return undefined;
}

export function isHTMLElementExtensionInterface(node: Node, context: AnalyzerVisitContext): node is InterfaceDeclaration {
	return context.ts.isInterfaceDeclaration(node) && context.ts.isModuleBlock(node.parent) && node.name.text === "HTMLElement";
}

export function getDeclarationName(node: Node, context: AnalyzerVisitContext): string | undefined {
	if (context.ts.isClassLike(node) || context.ts.isInterfaceDeclaration(node)) {
		return node.name?.text;
	} else if (context.ts.isVariableDeclaration(node)) {
		return node.name?.getText();
	}

	return undefined;
}
