import { toTypeString } from "ts-simple-type";
import { TypeChecker } from "typescript";
import { AnalyzerResult } from "../analyze/types/analyzer-result";

/**
 * Pretty print the results for debugging.
 * @param results
 * @param checker
 */
export function prepareResultForPrettyPrint(results: AnalyzerResult[], checker: TypeChecker): any[] {
	return results.map(result => {
		const tags = result.componentDefinitions.map(definition => {
			const { tagName } = definition;
			const declaration = definition.declaration();

			return {
				fileNames: Array.from(declaration.declarationNodes).map(node => node.getSourceFile().fileName),
				tagName,
				description: declaration.jsDoc?.description,
				deprecated: declaration.deprecated,
				members: declaration.members.map(res => ({
					...res,
					type: res.typeHint || (res.type != null ? toTypeString(res.type(), checker) : undefined),
					node: null
				})),
				slots: declaration.slots.map(slot => ({
					name: slot.name,
					description: slot.jsDoc?.description
				})),
				events: declaration.events.map(event => ({
					name: event.name,
					description: event.jsDoc?.description
				})),
				cssProperties: declaration.cssProperties.map(cssProperty => ({
					name: cssProperty.name,
					description: cssProperty.jsDoc?.description
				}))
			};
		});

		const events = result.globalEvents.map(event => event.name);

		return {
			fileName: result.sourceFile.fileName,
			tags,
			events
		};
	});
}
