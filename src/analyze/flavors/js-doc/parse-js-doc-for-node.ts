import { JSDocTag, Node } from "typescript";
import { JsDocTagParsed } from "../../types/js-doc";
import { getJsDoc } from "../../util/js-doc-util";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";

export function parseJsDocForNode<T>(
	node: Node,
	tagNames: string[],
	transform: (tagNode: JSDocTag | undefined, parsed: JsDocTagParsed) => T | undefined,
	context: AnalyzerVisitContext
): T[] | undefined {
	const { tags } = getJsDoc(node, tagNames, context.ts) || {};

	if (tags != null && tags.length > 0) {
		context.emitContinue?.();
		return tags.map(tag => transform(tag.node, tag.parsed())).filter((item): item is NonNullable<typeof item> => item != null);
	}

	return undefined;
}
