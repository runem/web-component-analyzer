import { toTypeString } from "ts-simple-type";
import { TypeChecker } from "typescript";
import { AnalyzeComponentsResult } from "../../analyze/analyze-components";

/**
 * Pretty print the results for debugging.
 * @param results
 * @param checker
 */
export function debugJsonTransformer(results: AnalyzeComponentsResult[], checker: TypeChecker): any[] {
	return results.map(result => {
		const tags = result.componentDefinitions.map(({ declaration, tagName }) => ({
			fileName: declaration.node.getSourceFile().fileName,
			tagName,
			description: declaration.jsDoc && declaration.jsDoc.comment,
			deprecated: declaration.deprecated,
			members: declaration.members.map(res => ({
				...res,
				type: toTypeString(res.type, checker),
				node: null
			})),
			slots: declaration.slots.map(slot => ({
				name: slot.name,
				description: slot.jsDoc && slot.jsDoc.comment
			})),
			events: declaration.events.map(event => ({
				name: event.name,
				description: event.jsDoc && event.jsDoc.comment
			})),
			cssProperties: declaration.cssProperties.map(cssProperty => ({
				name: cssProperty.name,
				description: cssProperty.jsDoc && cssProperty.jsDoc.comment
			}))
		}));

		const events = result.globalEvents.map(event => event.name);

		return {
			fileName: result.sourceFile.fileName,
			tags,
			events
		};
	});
}
