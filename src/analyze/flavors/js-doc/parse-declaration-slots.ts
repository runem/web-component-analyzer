import { SimpleTypeKind, SimpleTypeStringLiteral } from "ts-simple-type";
import { Node } from "typescript";
import { ComponentSlot } from "../../types/component-slot";
import { parseJsDocTypeString } from "../../util/js-doc-util";
import { ParseComponentMembersContext } from "../parse-component-flavor";
import { parseJsDocForNode } from "./helper";

/**
 * Parses @slot js doc annotations on interface/class-like nodes.
 * @param node
 * @param context
 */
export function parseDeclarationSlots(node: Node, context: ParseComponentMembersContext): ComponentSlot[] | undefined {
	const { ts } = context;

	if (ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node)) {
		return parseJsDocForNode(
			node,
			"slot",
			(tagNode, parsed) => {
				// Grab the type from jsdoc and use it to find permitted tag names
				// Example: @slot {"div"|"span"} myslot
				const permittedTagNameType = parsed.type == null ? undefined : parseJsDocTypeString(parsed.type);
				const permittedTagNames: string[] | undefined = (() => {
					if (permittedTagNameType == null) {
						return undefined;
					}

					switch (permittedTagNameType.kind) {
						case SimpleTypeKind.STRING_LITERAL:
							return [permittedTagNameType.value];
						case SimpleTypeKind.UNION:
							return permittedTagNameType.types.filter((type): type is SimpleTypeStringLiteral => type.kind === SimpleTypeKind.STRING_LITERAL).map(type => type.value);
						default:
							return undefined;
					}
				})();

				return {
					name: parsed.name,
					jsDoc: parsed.comment != null ? { comment: parsed.comment } : undefined,
					permittedTagNames
				} as ComponentSlot;
			},
			context
		);
	}

	return undefined;
}
