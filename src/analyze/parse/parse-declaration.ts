import { ClassLikeDeclaration, InterfaceDeclaration, Node } from "typescript";
import { FlavorVisitContext, ParseComponentFlavor } from "../flavors/parse-component-flavor";
import { ComponentCSSProperty } from "../types/component-css-property";
import { ComponentDeclaration } from "../types/component-declaration";
import { ComponentMember } from "../types/component-member";
import { ComponentSlot } from "../types/component-slot";
import { EventDeclaration } from "../types/event-types";
import { findChild, isNodeInLibDom, resolveDeclarations } from "../util/ast-util";
import { getJsDoc } from "../util/js-doc-util";
import { expandMembersFromJsDoc } from "./expand-from-js-doc";
import { mergeCSSProps, mergeEvents, mergeMembers, mergeSlots } from "./merge-declarations";
import { mergeJsDocs } from "./merge-js-docs";

interface VisitComponentDeclarationVisitContext extends FlavorVisitContext {
	declarationNode: Node;
	emitMembers(members: ComponentMember[]): void;
	emitSlots(slots: ComponentSlot[]): void;
	emitCSSProps(cssProperties: ComponentCSSProperty[]): void;
	emitEvents(events: EventDeclaration[]): void;
	emitInheritNode(node: Node): void;
	emitInherit(name: string): void;
}

/**
 * Parses a component declaration using flavors.
 * @param declarationNode
 * @param flavors
 * @param context
 */
export function parseComponentDeclaration(declarationNode: Node, flavors: ParseComponentFlavor[], context: FlavorVisitContext): ComponentDeclaration {
	const slots: ComponentSlot[] = [];
	const members: ComponentMember[] = [];
	const events: EventDeclaration[] = [];
	const cssProps: ComponentCSSProperty[] = [];
	const inherits = new Set<string>();
	const inheritNodes = new Set<Node>();

	// Visit the declaration node using flavors.
	visitComponentDeclaration(declarationNode, flavors, {
		...context,
		declarationNode,
		features: {
			getCSSProps(): ComponentCSSProperty[] {
				return cssProps;
			},
			getEvents(): EventDeclaration[] {
				return events;
			},
			getInheritNodes(): Node[] {
				return Array.from(inheritNodes);
			},
			getInherits(): string[] {
				return Array.from(inherits);
			},
			getMembers(): ComponentMember[] {
				return members;
			},
			getSlots(): ComponentSlot[] {
				return slots;
			}
		},
		emitMembers(newMembers: ComponentMember[]): void {
			members.push(...newMembers);
		},
		emitInheritNode(node: Node): void {
			inheritNodes.add(node);
		},
		emitCSSProps(newCSSProps: ComponentCSSProperty[]): void {
			cssProps.push(...newCSSProps);
		},
		emitEvents(newEvents: EventDeclaration[]): void {
			events.push(...newEvents);
		},
		emitSlots(newSlots: ComponentSlot[]): void {
			slots.push(...newSlots);
		},
		emitInherit(name: string): void {
			inherits.add(name);
		}
	});

	// Merge all jsdoc tags using inherited nodes.
	const mainJsDoc = isDeclarationExcluded(declarationNode, context) ? undefined : getJsDoc(declarationNode, context.ts);
	const inheritedJsDocs = Array.from(inheritNodes.values())
		.filter(node => !isDeclarationExcluded(node, context))
		.map(n => getJsDoc(n, context.ts));
	const jsDoc = mergeJsDocs(mainJsDoc, inheritedJsDocs);

	// Expand members using jsdoc annotations and merge all members.
	const mergedMembers = mergeMembers(expandMembersFromJsDoc(members), context);

	// Merge slots, events and css properties
	const mergedSlots = mergeSlots(slots);
	const mergedEvents = mergeEvents(events);
	const mergedCSSProps = mergeCSSProps(cssProps);

	const className =
		(context.ts.isClassDeclaration(declarationNode) || context.ts.isInterfaceDeclaration(declarationNode)) && declarationNode.name != null
			? declarationNode.name.text
			: undefined;

	return {
		node: declarationNode,
		members: mergedMembers,
		slots: mergedSlots,
		events: mergedEvents,
		cssProperties: mergedCSSProps,
		inheritNodes: Array.from(inheritNodes.values()),
		inherits: Array.from(inherits.values()),
		className,
		jsDoc
	};
}

/**
 * Function that tests if this declaration is excluded based on the configuration.
 * @param node
 * @param context
 */
function isDeclarationExcluded(node: Node, context: FlavorVisitContext): boolean {
	if (!context.ts.isClassLike(node) && !context.ts.isInterfaceDeclaration(node)) return false;

	if (context.config.excludedDeclarationNames == null) return false;

	const name = (node.name != null && node.name.text) || "";

	// Test if the name is excluded
	return context.config.excludedDeclarationNames.includes(name);
}

/**
 * Visit a declaration and emits members through the context.
 * @param node
 * @param flavors
 * @param context
 */
function visitComponentDeclaration(node: Node, flavors: ParseComponentFlavor[], context: VisitComponentDeclarationVisitContext) {
	if (node == null) return [];

	const { ts } = context;

	// Skip visiting it's children if this name is excluded
	if (isDeclarationExcluded(node, context)) {
		return;
	}

	if (ts.isClassLike(node) || ts.isInterfaceDeclaration(node)) {
		// Visit inherited nodes
		visitInheritedComponentDeclarations(node, flavors, context);
	}

	// By default each flavor stops the parsing if it finds anything.
	// However each flavor has the ability to continue the recursion.

	// Emit members
	const membersResult = executeFirstFlavor(flavors, "parseDeclarationMembers", node, context);
	if (membersResult != null) {
		context.emitMembers(membersResult.result);
		if (!membersResult.shouldContinue) return;
	}

	// Emit events
	const eventsResult = executeFirstFlavor(flavors, "parseDeclarationEvents", node, context);
	if (eventsResult != null) {
		context.emitEvents(eventsResult.result);
		if (!eventsResult.shouldContinue) return;
	}

	// Emit css properties
	const cssPropertiesResult = executeFirstFlavor(flavors, "parseDeclarationCSSProps", node, context);
	if (cssPropertiesResult != null) {
		context.emitCSSProps(cssPropertiesResult.result);
		if (!cssPropertiesResult.shouldContinue) return;
	}

	// Emit slots
	const slotsResult = executeFirstFlavor(flavors, "parseDeclarationSlots", node, context);
	if (slotsResult != null) {
		context.emitSlots(slotsResult.result);
		if (!slotsResult.shouldContinue) return;
	}

	// Visit child nodes
	node.forEachChild(child => {
		visitComponentDeclaration(child, flavors, context);
	});
}

/**
 * This function call each flavor on a node until a flavor emits a result.
 * Each flavor has the ability to emit a "continue" instruction.
 * @param flavors
 * @param key
 * @param node
 * @param context
 */
function executeFirstFlavor<
	Key extends
		| keyof ParseComponentFlavor & "parseDeclarationMembers"
		| "parseDeclarationEvents"
		| "parseDeclarationSlots"
		| "parseDeclarationCSSProps",
	Return extends ReturnType<NonNullable<ParseComponentFlavor[Key]>>
>(
	flavors: ParseComponentFlavor[],
	key: Key,
	node: Node,
	context: VisitComponentDeclarationVisitContext
): { result: NonNullable<Return>; shouldContinue?: boolean } | undefined {
	// Loop through each flavor
	for (const flavor of flavors) {
		const func = flavor[key];
		if (func == null) continue;

		// Save a "continue" flag if necessary
		let shouldContinue = false;
		const result = func(node, {
			...context,
			emitContinue() {
				shouldContinue = true;
			}
		});

		// Return a result if not undefined
		if (result != null) {
			return { result: result as NonNullable<Return>, shouldContinue };
		}
	}

	return undefined;
}

/**
 * Visits and emit declaration members in each interface/class-like inherited node.
 * @param node
 * @param flavors
 * @param context
 */
function visitInheritedComponentDeclarations(
	node: InterfaceDeclaration | ClassLikeDeclaration,
	flavors: ParseComponentFlavor[],
	context: VisitComponentDeclarationVisitContext
) {
	const { ts } = context;

	if (node.heritageClauses != null) {
		for (const heritage of node.heritageClauses || []) {
			// class Test implements MyBase
			// Don't visit interfaces if we are looking at a class, because the class already declares all things from the interface
			if (ts.isClassLike(node) && heritage.token === ts.SyntaxKind.ImplementsKeyword) {
				for (const type of heritage.types) {
					context.emitInheritNode(type.expression);
					context.emitInherit(type.expression.getText());
				}
				continue;
			}

			// [extends|implements] MyBase
			for (const type of heritage.types) {
				resolveAndExtendHeritage(type.expression, flavors, context);
			}
		}
	}
}

function resolveAndExtendHeritage(node: Node, flavors: ParseComponentFlavor[], context: VisitComponentDeclarationVisitContext) {
	const { ts } = context;

	// Emit extends name
	context.emitInherit(node.getText());

	if (ts.isCallExpression(node)) {
		// Mixins
		const { expression: identifier, arguments: args } = node;

		for (const argument of args) {
			resolveAndExtendHeritage(argument, flavors, context);
		}

		if (identifier != null) {
			const declarations = resolveDeclarations(identifier, context);
			for (const declaration of declarations) {
				const clzDecl = findChild(declaration, ts.isClassLike);

				if (clzDecl != null) {
					extendWithDeclarationNode(clzDecl, flavors, context);
				}
			}
		}
	} else {
		const declarations = resolveDeclarations(node, context);

		// Visit component declarations for each inherited node.
		for (const declaration of declarations) {
			extendWithDeclarationNode(declaration, flavors, context);
		}
	}
}

function extendWithDeclarationNode(declaration: Node, flavors: ParseComponentFlavor[], context: VisitComponentDeclarationVisitContext) {
	const { ts } = context;

	if (ts.isInterfaceDeclaration(declaration) || ts.isClassLike(declaration)) {
		context.emitInheritNode(declaration);
	}

	if (context.config.analyzeLibDom || !isNodeInLibDom(declaration)) {
		visitComponentDeclaration(declaration, flavors, context);
	}
}
