import { JsDoc } from "../types/js-doc";

/**
 * Merge jsdoc with a "main" jsdoc.
 * The main jsdoc keeps its comment.
 * The inherited js docs only extend with annotations.
 * @param mainJsDoc
 * @param inheritedJsDocs
 */
export function mergeJsDocs(mainJsDoc: JsDoc | undefined, inheritedJsDocs: (JsDoc | undefined)[]): JsDoc | undefined {
	const jsDoc = inheritedJsDocs.reduce((jsDoc: JsDoc, extendJsDoc) => {
		if (extendJsDoc == null) return jsDoc;

		return {
			...jsDoc,
			node: jsDoc.node,
			tags: [...(jsDoc.tags || []), ...(extendJsDoc.tags || [])]
		};
	}, mainJsDoc || {});

	if (jsDoc.comment == null && (jsDoc.tags == null || jsDoc.tags.length === 0)) return undefined;

	return jsDoc;
}
