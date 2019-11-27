import { SimpleTypeKind, SimpleTypeStringLiteral } from "ts-simple-type";
import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { ComponentCssPart } from "../../types/features/component-css-part";
import { ComponentCssProperty } from "../../types/features/component-css-property";
import { ComponentEvent } from "../../types/features/component-event";
import { ComponentMemberAttribute, ComponentMemberProperty } from "../../types/features/component-member";
import { ComponentSlot } from "../../types/features/component-slot";
import { getNodeSourceFileLang } from "../../util/ast-util";
import { parseJsDocTypeExpression } from "../../util/js-doc-util";
import { lazy } from "../../util/lazy";
import { AnalyzerFlavor, ComponentMemberResult } from "../analyzer-flavor";
import { parseJsDocForNode } from "./parse-js-doc-for-node";

export const discoverFeatures: AnalyzerFlavor["discoverFeatures"] = {
	csspart: (node: Node, context: AnalyzerVisitContext): ComponentCssPart[] | undefined => {
		if (context.ts.isInterfaceDeclaration(node) || context.ts.isClassDeclaration(node)) {
			return parseJsDocForNode(
				node,
				["csspart"],
				(tagNode, { name, description }) => {
					if (name != null && name.length > 0) {
						return {
							name: name,
							jsDoc: description != null ? { description } : undefined
						};
					}
				},
				context
			);
		}
	},
	cssproperty: (node: Node, context: AnalyzerVisitContext): ComponentCssProperty[] | undefined => {
		if (context.ts.isInterfaceDeclaration(node) || context.ts.isClassDeclaration(node)) {
			return parseJsDocForNode(
				node,
				["cssprop", "cssproperty", "cssvar", "cssvariable"],
				(tagNode, { name, description, type }) => {
					if (name != null && name.length > 0) {
						return {
							name: name,
							jsDoc: description != null ? { description } : undefined,
							type: type || undefined
						};
					}
				},
				context
			);
		}
	},
	event: (node: Node, context: AnalyzerVisitContext): ComponentEvent[] | undefined => {
		if (context.ts.isInterfaceDeclaration(node) || context.ts.isClassDeclaration(node)) {
			return parseJsDocForNode(
				node,
				["event", "fires", "emits"],
				(tagNode, { name, description, type }) => {
					if (name != null && name.length > 0 && tagNode != null) {
						return {
							name: name,
							jsDoc: description != null ? { description } : undefined,
							type: lazy(() => (type && parseJsDocTypeExpression(type)) || { kind: SimpleTypeKind.ANY }),
							typeHint: type,
							node: tagNode
						};
					}
				},
				context
			);
		}
	},
	slot: (node: Node, context: AnalyzerVisitContext): ComponentSlot[] | undefined => {
		if (context.ts.isInterfaceDeclaration(node) || context.ts.isClassDeclaration(node)) {
			return parseJsDocForNode(
				node,
				["slot"],
				(tagNode, { name, type, description }) => {
					// Grab the type from jsdoc and use it to find permitted tag names
					// Example: @slot {"div"|"span"} myslot
					const permittedTagNameType = type == null ? undefined : parseJsDocTypeExpression(type);
					const permittedTagNames: string[] | undefined = (() => {
						if (permittedTagNameType == null) {
							return undefined;
						}

						switch (permittedTagNameType.kind) {
							case SimpleTypeKind.STRING_LITERAL:
								return [permittedTagNameType.value];
							case SimpleTypeKind.UNION:
								return permittedTagNameType.types
									.filter((type): type is SimpleTypeStringLiteral => type.kind === SimpleTypeKind.STRING_LITERAL)
									.map(type => type.value);
							default:
								return undefined;
						}
					})();

					return {
						name: name,
						jsDoc: description != null ? { description } : undefined,
						permittedTagNames
					};
				},
				context
			);
		}
	},
	member: (node: Node, context: AnalyzerVisitContext): ComponentMemberResult[] | undefined => {
		if (context.ts.isInterfaceDeclaration(node) || context.ts.isClassDeclaration(node)) {
			const properties = parseJsDocForNode(
				node,
				["prop", "property"],
				(tagNode, { name, default: def, type, description }) => {
					if (name != null && name.length > 0) {
						return {
							kind: "property",
							propName: name,
							jsDoc: description != null ? { description } : undefined,
							typeHint: type,
							type: lazy(() => (type && parseJsDocTypeExpression(type)) || { kind: SimpleTypeKind.ANY }),
							node: tagNode,
							default: def,
							visibility: undefined,
							reflect: undefined,
							required: undefined,
							deprecated: undefined
						} as ComponentMemberProperty;
					}
				},
				context
			);

			const attributes = parseJsDocForNode(
				node,
				["attr", "attribute"],
				(tagNode, { name, default: def, type, description }) => {
					if (name != null && name.length > 0) {
						return {
							kind: "attribute",
							attrName: name,
							jsDoc: description != null ? { description } : undefined,
							type: lazy(() => (type && parseJsDocTypeExpression(type)) || { kind: SimpleTypeKind.ANY }),
							typeHint: type,
							node: tagNode,
							default: def,
							visibility: undefined,
							reflect: undefined,
							required: undefined,
							deprecated: undefined
						} as ComponentMemberAttribute;
					}
				},
				context
			);

			if (attributes != null || properties != null) {
				return [...(attributes || []), ...(properties || [])].map(member => ({
					priority: getNodeSourceFileLang(node) === "js" ? "high" : "medium",
					member
				}));
			}

			return undefined;
		}
	}
};
