import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { ComponentMember, ComponentMemberReflectKind } from "../../types/features/component-member";
import { JsDoc } from "../../types/js-doc";
import { VisibilityKind } from "../../types/visibility-kind";
import { parseSimpleJsDocTypeExpression } from "../../util/js-doc-util";
import { lazy } from "../../util/lazy";
import { AnalyzerFlavor } from "../analyzer-flavor";

/**
 * Refines features by looking at the jsdoc tags on the feature
 */
export const refineFeature: AnalyzerFlavor["refineFeature"] = {
	event: (event, context) => {
		if (event.jsDoc == null || event.jsDoc.tags == null) return event;

		// Check if the feature has "@ignore" jsdoc tag
		if (hasIgnoreJsDocTag(event.jsDoc)) {
			return undefined;
		}

		return [applyJsDocDeprecated, applyJsDocVisibility, applyJsDocType].reduce(
			(event, applyFunc) => (applyFunc as Function)(event, event.jsDoc, context),
			event
		);
	},
	method: (method, context) => {
		if (method.jsDoc == null || method.jsDoc.tags == null) return method;

		// Check if the feature has "@ignore" jsdoc tag
		if (hasIgnoreJsDocTag(method.jsDoc)) {
			return undefined;
		}

		method = [applyJsDocDeprecated, applyJsDocVisibility].reduce(
			(method, applyFunc) => (applyFunc as Function)(method, method.jsDoc, context),
			method
		);

		return method;
	},
	member: (member, context) => {
		// Return right away if the member doesn't have jsdoc
		if (member.jsDoc == null || member.jsDoc.tags == null) return member;

		// Check if the feature has "@ignore" jsdoc tag
		if (hasIgnoreJsDocTag(member.jsDoc)) {
			return undefined;
		}

		return [
			applyJsDocDeprecated,
			applyJsDocVisibility,
			applyJsDocRequired,
			applyJsDocDefault,
			applyJsDocReflect,
			applyJsDocType,
			applyJsDocAttribute,
			applyJsDocModifiers
		].reduce((member, applyFunc) => (applyFunc as Function)(member, member.jsDoc, context), member);
	}
};

/**
 * Applies the "@deprecated" jsdoc tag
 * @param feature
 * @param jsDoc
 */
function applyJsDocDeprecated<T extends Partial<Pick<ComponentMember, "deprecated">>>(feature: T, jsDoc: JsDoc): T {
	const deprecatedTag = jsDoc.tags?.find(tag => tag.tag === "deprecated");

	if (deprecatedTag != null) {
		return {
			...feature,
			deprecated: deprecatedTag.comment || true
		};
	}

	return feature;
}

/**
 * Applies the "@access" jsdoc tag
 * @param feature
 * @param jsDoc
 */
function applyJsDocVisibility<T extends Partial<Pick<ComponentMember, "visibility">>>(feature: T, jsDoc: JsDoc): T {
	const visibilityTag = jsDoc.tags?.find(tag => ["public", "protected", "private", "package", "access"].includes(tag.tag)); // member + method

	if (visibilityTag != null) {
		return {
			...feature,
			visibility: ((): VisibilityKind | undefined => {
				switch (visibilityTag.tag) {
					case "public":
						return "public";
					case "protected":
						return "protected";
					case "package":
					case "private":
						return "private";
					case "access":
						switch (visibilityTag.parsed().name) {
							case "public":
								return "public";
							case "protected":
								return "protected";
							case "private":
							case "package":
								return "private";
							default:
								return undefined;
						}
					default:
						return undefined;
				}
			})()
		};
	}

	return feature;
}

/**
 * Applies the "@attribute" jsdoc tag
 * @param feature
 * @param jsDoc
 * @param context
 */
function applyJsDocAttribute<T extends Partial<Pick<ComponentMember, "propName" | "attrName" | "default" | "type" | "typeHint">>>(
	feature: T,
	jsDoc: JsDoc,
	context: AnalyzerVisitContext
): T {
	const attributeTag = jsDoc.tags?.find(tag => ["attr", "attribute"].includes(tag.tag));

	if (attributeTag != null && feature.attrName == null) {
		const parsed = attributeTag.parsed();

		const result: T = {
			...feature,
			attrName: attributeTag.parsed().name || feature.propName,
			default: feature.default ?? parsed.default
		};

		// @attr jsdoc tag can also include the type of attribute
		if (parsed.type != null && result.typeHint == null) {
			result.typeHint = parsed.type;
			result.type = feature.type ?? lazy(() => parseSimpleJsDocTypeExpression(parsed.type || "", context));
		}

		return result;
	}

	return feature;
}

/**
 * Applies the "@required" jsdoc tag
 * @param feature
 * @param jsDoc
 */
function applyJsDocRequired<T extends Partial<Pick<ComponentMember, "required">>>(feature: T, jsDoc: JsDoc): T {
	const requiredTag = jsDoc.tags?.find(tag => ["optional", "required"].includes(tag.tag));

	if (requiredTag != null) {
		return {
			...feature,
			required: requiredTag.tag === "required"
		};
	}

	return feature;
}

/**
 * Applies the "@readonly" jsdoc tag
 * @param feature
 * @param jsDoc
 */
function applyJsDocModifiers<T extends Partial<Pick<ComponentMember, "modifiers">>>(feature: T, jsDoc: JsDoc): T {
	const readonlyTag = jsDoc.tags?.find(tag => tag.tag === "readonly");

	if (readonlyTag != null) {
		return {
			...feature,
			modifiers: (feature.modifiers != null ? new Set(feature.modifiers) : new Set()).add("readonly")
		};
	}

	return feature;
}

/**
 * Applies the "@default" jsdoc tag
 * @param feature
 * @param jsDoc
 */
function applyJsDocDefault<T extends Partial<Pick<ComponentMember, "default">>>(feature: T, jsDoc: JsDoc): T {
	const defaultTag = jsDoc.tags?.find(tag => tag.tag === "default");

	if (defaultTag != null) {
		return {
			...feature,
			default: defaultTag.comment
		};
	}

	return feature;
}

/**
 * Applies the "@reflect" jsdoc tag
 * @param feature
 * @param jsDoc
 */
function applyJsDocReflect<T extends Partial<Pick<ComponentMember, "reflect">>>(feature: T, jsDoc: JsDoc): T {
	const reflectTag = jsDoc.tags?.find(tag => tag.tag === "reflect");

	if (reflectTag != null && feature.reflect == null) {
		return {
			...feature,
			reflect: ((): ComponentMemberReflectKind | undefined => {
				switch (reflectTag.comment) {
					case "to-attribute":
						return "to-attribute";
					case "to-property":
						return "to-property";
					case "both":
						return "both";
					default:
						return undefined;
				}
			})()
		};
	}

	return feature;
}

/**
 * Applies the "@type" jsdoc tag
 * @param feature
 * @param jsDoc
 * @param context
 */
function applyJsDocType<T extends Partial<Pick<ComponentMember, "type" | "typeHint">>>(feature: T, jsDoc: JsDoc, context: AnalyzerVisitContext): T {
	const typeTag = jsDoc.tags?.find(tag => tag.tag === "type");

	if (typeTag != null && feature.typeHint == null) {
		const parsed = typeTag.parsed();

		if (parsed.type != null && parsed.type.length > 0) {
			return {
				...feature,
				typeHint: parsed.type,
				type: feature.type ?? lazy(() => parseSimpleJsDocTypeExpression(parsed.type || "", context))
			};
		}
	}

	return feature;
}

/**
 * Returns if jsdoc contains an ignore node
 * @param jsDoc
 */
function hasIgnoreJsDocTag(jsDoc: JsDoc): boolean {
	return jsDoc?.tags?.find(tag => tag.tag === "ignore") != null;
}
