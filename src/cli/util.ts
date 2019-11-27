import { toTypeString } from "ts-simple-type";
import { TypeChecker } from "typescript";
import { AnalyzerResult } from "../analyze/types/analyzer-result";
import { VisibilityKind } from "../analyze/types/visibility-kind";

/**
 * Flattens an array.
 * @param array
 */
export function flatten<T>(array: T[][]): T[] {
	return array.reduce((acc, a) => [...acc, ...a], []);
}

const VISIBILITY_NUMBER_MAP: Record<VisibilityKind, number> = {
	private: 1,
	protected: 2,
	public: 3
};

export function filterVisibility<T extends { visibility?: VisibilityKind }>(visibility: VisibilityKind, array: T[]): T[] {
	const target = VISIBILITY_NUMBER_MAP[visibility];
	return array.filter(item => VISIBILITY_NUMBER_MAP[item.visibility || "public"] >= target);
}

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
