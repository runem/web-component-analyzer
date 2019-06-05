import { JSDocTag, Node } from "typescript";
import { getJsDoc, ParsedJsDocTag, parseJsDocTagComment } from "../../util/js-doc-util";
import { ParseComponentMembersContext } from "../parse-component-flavor";

export function parseJsDocForNode<T>(
	node: Node,
	tagName: string | string[],
	transform: (node: JSDocTag, tag: ParsedJsDocTag) => T | undefined,
	context: ParseComponentMembersContext
): T[] | undefined {
	const { ts } = context;

	const jsDoc = getJsDoc(node, ts);

	if (jsDoc != null && jsDoc.tags != null) {
		const items = jsDoc.tags
			.filter(tag => (Array.isArray(tagName) ? tagName : [tagName]).includes(tag.tag.toLowerCase()))
			.map(tag => {
				const parsed = parseJsDocTagComment(tag);
				return transform(tag.node, parsed);
			})
			.filter((item): item is NonNullable<typeof item> => item != null);

		if (items.length > 0) {
			context.emitContinue && context.emitContinue();
			return items;
		}
	}

	return undefined;
}
