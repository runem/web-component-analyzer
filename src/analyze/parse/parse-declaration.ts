import { ClassLikeDeclaration, InterfaceDeclaration, Node } from "typescript";
import { FlavorVisitContext, ParseComponentFlavor } from "../flavors/parse-component-flavor";
import { ComponentCSSProperty } from "../types/component-css-property";
import { ComponentDeclaration } from "../types/component-declaration";
import { ComponentMember } from "../types/component-member";
import { ComponentSlot } from "../types/component-slot";
import { EventDeclaration } from "../types/event-types";
import { isNodeInLibDom, resolveDeclarations } from "../util/ast-util";
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
	emitExtends(node: Node): void;
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
		emitMembers(newMembers: ComponentMember[]): void {
			members.push(...newMembers);
		},
		emitExtends(node: Node): void {
			// Only safe extends emit if it's an interface or class.
			if (context.ts.isClassDeclaration(node) || context.ts.isInterfaceDeclaration(node)) {
				const name = node.name && node.name.text;
				if (name != null) {
					inherits.add(name);
				}
			} else {
				return;
			}

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
		}
	});

	// Merge all jsdoc tags using inherited nodes.
	const jsDoc = mergeJsDocs(getJsDoc(declarationNode, context.ts), Array.from(inheritNodes.values()).map(n => getJsDoc(n, context.ts)));

	// Expand members using jsdoc annotations and merge all members.
	const mergedMembers = mergeMembers(expandMembersFromJsDoc(members), context);

	// Merge slots, events and css properties
	const mergedSlots = mergeSlots(slots);
	const mergedEvents = mergeEvents(events);
	const mergedCSSProps = mergeCSSProps(cssProps);

	return {
		node: declarationNode,
		members: mergedMembers,
		slots: mergedSlots,
		events: mergedEvents,
		cssProperties: mergedCSSProps,
		inheritNodes: Array.from(inheritNodes.values()),
		inherits: Array.from(inherits.values()),
		jsDoc
	};
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

	// Visit inherited nodes
	if (ts.isClassLike(node) || ts.isInterfaceDeclaration(node)) {
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
	Key extends keyof ParseComponentFlavor & "parseDeclarationMembers" | "parseDeclarationEvents" | "parseDeclarationSlots" | "parseDeclarationCSSProps",
	Return extends ReturnType<NonNullable<ParseComponentFlavor[Key]>>
>(flavors: ParseComponentFlavor[], key: Key, node: Node, context: VisitComponentDeclarationVisitContext): { result: NonNullable<Return>; shouldContinue?: boolean } | undefined {
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
function visitInheritedComponentDeclarations(node: InterfaceDeclaration | ClassLikeDeclaration, flavors: ParseComponentFlavor[], context: VisitComponentDeclarationVisitContext) {
	const { ts, checker } = context;

	if (node.heritageClauses != null) {
		for (const heritage of node.heritageClauses || []) {
			// class Test implements MyBase
			// Don't visit interfaces if we are looking at a class, because the class already declares all things from the interface
			if (ts.isClassLike(node) && heritage.token === ts.SyntaxKind.ImplementsKeyword) {
				for (const type of heritage.types) {
					context.emitExtends(type.expression);
				}
				continue;
			}

			// [extends|implements] MyBase
			for (const type of heritage.types) {
				const declarations = resolveDeclarations(type.expression, checker, ts);

				// Visit component declarations for each inherited node.
				for (const declaration of declarations) {
					if (ts.isInterfaceDeclaration(declaration) || ts.isClassLike(declaration)) {
						context.emitExtends(declaration);
					}

					if (context.config.analyzeLibDom || !isNodeInLibDom(declaration)) {
						visitComponentDeclaration(declaration, flavors, context);
					}
				}
			}
		}
	}
}
