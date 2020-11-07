import { SimpleTypeStringLiteral } from "ts-simple-type";
import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { ComponentCssPart } from "../../types/features/component-css-part";
import { ComponentCssProperty } from "../../types/features/component-css-property";
import { ComponentEvent } from "../../types/features/component-event";
import { ComponentMember, ComponentMemberAttribute, ComponentMemberProperty } from "../../types/features/component-member";
import { ComponentSlot } from "../../types/features/component-slot";
import { getNodeSourceFileLang } from "../../util/ast-util";
import { parseSimpleJsDocTypeExpression } from "../../util/js-doc-util";
import { lazy } from "../../util/lazy";
import { FeatureDiscoverVisitMap } from "../analyzer-flavor";
import { parseJsDocForNode } from "./parse-js-doc-for-node";

export const discoverFeatures: Partial<FeatureDiscoverVisitMap<AnalyzerVisitContext>> = {
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
				(tagNode, { name, description, type, default: def }) => {
					if (name != null && name.length > 0) {
						return {
							name: name,
							jsDoc: description != null ? { description } : undefined,
							typeHint: type || undefined,
							default: def
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
							type: type != null ? lazy(() => parseSimpleJsDocTypeExpression(type, context) || { kind: "ANY" }) : undefined,
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
					// Treat "-" as unnamed slot
					if (name === "-") {
						name = undefined;
					}

					// Grab the type from jsdoc and use it to find permitted tag names
					// Example: @slot {"div"|"span"} myslot
					const permittedTagNameType = type == null ? undefined : parseSimpleJsDocTypeExpression(type, context);
					const permittedTagNames: string[] | undefined = (() => {
						if (permittedTagNameType == null) {
							return undefined;
						}

						switch (permittedTagNameType.kind) {
							case "STRING_LITERAL":
								return [permittedTagNameType.value];
							case "UNION":
								return permittedTagNameType.types
									.filter((type): type is SimpleTypeStringLiteral => type.kind === "STRING_LITERAL")
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
	member: (node: Node, context: AnalyzerVisitContext): ComponentMember[] | undefined => {
		if (context.ts.isInterfaceDeclaration(node) || context.ts.isClassDeclaration(node)) {
			const priority = getNodeSourceFileLang(node) === "js" ? "high" : "medium";

			const properties = parseJsDocForNode(
				node,
				["prop", "property"],
				(tagNode, { name, default: def, type, description }) => {
					if (name != null && name.length > 0) {
						return {
							priority,
							kind: "property",
							propName: name,
							jsDoc: description != null ? { description } : undefined,
							typeHint: type,
							type: lazy(() => (type && parseSimpleJsDocTypeExpression(type, context)) || { kind: "ANY" }),
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
							priority,
							kind: "attribute",
							attrName: name,
							jsDoc: description != null ? { description } : undefined,
							type: lazy(() => (type && parseSimpleJsDocTypeExpression(type, context)) || { kind: "ANY" }),
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
				return [...(attributes || []), ...(properties || [])];
			}

			return undefined;
		}
	}
};
