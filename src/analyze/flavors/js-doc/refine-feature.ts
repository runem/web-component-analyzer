import { SimpleType } from "ts-simple-type";
import { Type } from "typescript";
import { ComponentEvent } from "../../types/features/component-event";
import { ComponentMemberReflectKind } from "../../types/features/component-member";
import { ComponentMethod } from "../../types/features/component-method";
import { JsDoc } from "../../types/js-doc";
import { ModifierKind } from "../../types/modifier-kind";
import { VisibilityKind } from "../../types/visibility-kind";
import { parseJsDocTypeExpression } from "../../util/js-doc-util";
import { lazy } from "../../util/lazy";
import { AnalyzerFlavor, ComponentMemberResult } from "../analyzer-flavor";

export const refineFeature: AnalyzerFlavor["refineFeature"] = {
	event: (event: ComponentEvent) => {
		if (event.jsDoc == null || event.jsDoc.tags == null) return event;

		return [applyJsDocDeprecated, applyJsDocVisibility, applyJsDocType].reduce(
			(event, applyFunc) => (applyFunc as Function)(event, event.jsDoc),
			event
		);
	},
	method: (method: ComponentMethod) => {
		if (method.jsDoc == null || method.jsDoc.tags == null) return method;

		method = [applyJsDocDeprecated, applyJsDocVisibility].reduce((method, applyFunc) => (applyFunc as Function)(method, method.jsDoc), method);

		return method;
	},
	member: (memberResult: ComponentMemberResult) => {
		const member = memberResult.member;

		// Return right away if the member doesn't have jsdoc
		if (member.jsDoc == null || member.jsDoc.tags == null) return memberResult;
		const jsDoc = member.jsDoc;

		const newMember = [
			applyJsDocDeprecated,
			applyJsDocVisibility,
			applyJsDocAttribute,
			applyJsDocRequired,
			applyJsDocDefault,
			applyJsDocReflect,
			applyJsDocType,
			applyJsDocModifiers
		].reduce((member, applyFunc) => (applyFunc as Function)(member, jsDoc), member);

		// only member
		return {
			priority: memberResult.priority,
			member: newMember
		};
	}
};

function applyJsDocDeprecated<T extends { deprecated?: boolean | string }>(feature: T, jsDoc: JsDoc): T {
	const deprecatedTag = jsDoc.tags?.find(tag => tag.tag === "deprecated");

	if (deprecatedTag != null) {
		return {
			...feature,
			deprecated: deprecatedTag.comment || true
		};
	}

	return feature;
}

function applyJsDocVisibility<T extends { visibility?: VisibilityKind }>(feature: T, jsDoc: JsDoc): T {
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
						}
					default:
						return undefined;
				}
			})()
		};
	}

	return feature;
}

function applyJsDocAttribute<T extends { attrName?: string; propName?: string }>(feature: T, jsDoc: JsDoc): T {
	const attributeTag = jsDoc.tags?.find(tag => ["attr", "attribute"].includes(tag.tag));

	if (attributeTag != null && feature.attrName == null) {
		return {
			...feature,
			attrName: attributeTag.parsed().name || feature.propName
		};
	}

	return feature;
}

function applyJsDocRequired<T extends { required?: boolean }>(feature: T, jsDoc: JsDoc): T {
	const requiredTag = jsDoc.tags?.find(tag => ["optional", "required"].includes(tag.tag));

	if (requiredTag != null) {
		return {
			...feature,
			required: requiredTag.tag === "required"
		};
	}

	return feature;
}

function applyJsDocModifiers<T extends { modifiers?: Set<ModifierKind> }>(feature: T, jsDoc: JsDoc): T {
	const readonlyTag = jsDoc.tags?.find(tag => tag.tag === "readonly");

	if (readonlyTag != null) {
		return {
			...feature,
			modifiers: (feature.modifiers != null ? new Set(feature.modifiers) : new Set()).add("readonly")
		};
	}

	return feature;
}

function applyJsDocDefault<T extends { default?: any }>(feature: T, jsDoc: JsDoc): T {
	const defaultTag = jsDoc.tags?.find(tag => tag.tag === "default");

	if (defaultTag != null) {
		return {
			...feature,
			default: defaultTag.comment
		};
	}

	return feature;
}

function applyJsDocReflect<T extends { reflect?: ComponentMemberReflectKind }>(feature: T, jsDoc: JsDoc): T {
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

function applyJsDocType<T extends { typeHint?: any; type?: () => SimpleType | Type }>(feature: T, jsDoc: JsDoc): T {
	const typeTag = jsDoc.tags?.find(tag => tag.tag === "type");

	if (typeTag != null && feature.typeHint == null) {
		const parsed = typeTag.parsed();

		if (parsed.type != null && parsed.type.length > 0) {
			return {
				...feature,
				typeHint: parsed.type,
				type: feature.type ?? lazy(() => parseJsDocTypeExpression(parsed.type || ""))
			};
		}
	}

	return feature;
}
