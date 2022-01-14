import { getTypeHintFromType } from "../../util/get-type-hint-from-type";
import { Program, TypeChecker } from "typescript";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
import { ComponentDefinition } from "../../analyze/types/component-definition";
import { ComponentEvent } from "../../analyze/types/features/component-event";
import { ComponentCssProperty } from "../../analyze/types/features/component-css-property";
import { ComponentMember } from "../../analyze/types/features/component-member";
import { arrayDefined } from "../../util/array-util";
import { TransformerConfig } from "../transformer-config";
import { TransformerFunction } from "../transformer-function";
import { HtmlAttribute, WebtypesSchema, HtmlElement, BaseContribution, Js, GenericJsContribution, CssProperty } from "./webtypes-schema";
import { getFirst } from "../../util/set-util";
import { relative } from "path";

/**
 * Transforms results to json.
 * @param results
 * @param program
 * @param config
 */
export const webtypesTransformer: TransformerFunction = (results: AnalyzerResult[], program: Program, config: TransformerConfig): string => {
	const checker = program.getTypeChecker();

	// Grab all definitions
	const definitions = results.map(res => res.componentDefinitions).reduce((acc, cur) => [...acc, ...cur], []);

	// Transform all definitions into "tags"
	const elements = definitions.map(d => definitionToHTMLElement(d, checker, config));

	const webTypeConfig = config.webTypes;

	const webtypesJson: WebtypesSchema = {
		$schema: "http://json.schemastore.org/web-types",
		name: webTypeConfig?.name ?? "",
		version: webTypeConfig?.version ?? "",
		...(webTypeConfig?.framework ? { name: webTypeConfig?.framework } : {}),
		...(webTypeConfig?.["js-types-syntax"] ? { "js-types-syntax": webTypeConfig?.["js-types-syntax"] } : {}),
		...(webTypeConfig?.["default-icon"] ? { "default-icon": webTypeConfig?.["default-icon"] } : {}),
		...(webTypeConfig?.["framework-config"] ? { "framework-config": webTypeConfig?.["framework-config"] } : {}),
		...(webTypeConfig?.["description-markup"] ? { "description-markup": webTypeConfig?.["description-markup"] } : {}),
		contributions: {
			html: {
				elements: elements
			}
		}
	};

	return JSON.stringify(webtypesJson, null, 4);
};

function definitionToHTMLElement(definition: ComponentDefinition, checker: TypeChecker, config: TransformerConfig): HtmlElement {
	const declaration = definition.declaration;

	if (declaration == null) {
		return {
			name: definition.tagName,
			attributes: []
		};
	}

	const build: HtmlElement = {
		name: definition.tagName,
		...(declaration.deprecated !== undefined ? { deprecated: true } : {})
	};

	// Build description
	if (declaration?.jsDoc?.description) build.description = declaration.jsDoc.description;

	// Build source section
	const node = getFirst(definition.identifierNodes);
	const fileName = node?.getSourceFile().fileName;
	const path = fileName != null && config.cwd != null ? `./${relative(config.cwd, fileName)}` : undefined;

	if (node?.getText() && path) {
		build.source = {
			module: path,
			symbol: node.getText()
		};
	}

	// Build attributes
	const customElementAttributes = arrayDefined(declaration.members.map(d => componentMemberToAttr(d.attrName, d, checker, config)));
	if (customElementAttributes.length > 0) build.attributes = customElementAttributes;

	const js: Js = {};

	// Build properties
	const customElementProperties = arrayDefined(declaration.members.map(d => componentMemberToAttr(d.propName, d, checker, config)));
	if (customElementProperties.length > 0) js.properties = customElementProperties;

	// Build events
	const eventAttributes = arrayDefined(declaration.events.map(e => componentEventToAttr(e, checker, config)));
	if (eventAttributes.length > 0) js.events = eventAttributes;

	if (js.properties || js.events) build.js = js;

	// Build css properties
	const cssProperties = arrayDefined(declaration.cssProperties.map(e => componentCssPropertiesToAttr(e, checker, config)));
	if (cssProperties.length > 0) {
		build.css = {
			properties: cssProperties
		};
	}

	return build;
}

function componentEventToAttr(event: ComponentEvent, checker: TypeChecker, config: TransformerConfig): GenericJsContribution {
	// console.log(event);
	const builtEvent: GenericJsContribution = {
		name: event.name
	};

	if (event?.jsDoc?.description) builtEvent.description = event.jsDoc.description;

	return builtEvent;
}

function componentCssPropertiesToAttr(cssProperty: ComponentCssProperty, checker: TypeChecker, config: TransformerConfig): CssProperty {
	const builtCssProp: CssProperty = {
		name: cssProperty.name
	};

	if (cssProperty?.jsDoc?.description) builtCssProp.description = cssProperty.jsDoc.description;

	return builtCssProp;
}

function componentMemberToAttr(
	propName: string | undefined,
	member: ComponentMember,
	checker: TypeChecker,
	config: TransformerConfig
): BaseContribution | undefined {
	if (propName == null) {
		return undefined;
	}

	// const isFunction = member.attrName == null;

	const types: string[] | string = getTypeHintFromType(member.typeHint ?? member.type?.(), checker, config)?.split(" | ") ?? [];
	// if (isFunction) {
	// 	types = []; // TODO find a way to support function signatures, types includes signature as string
	// }
	//
	// if (types.length == 1) {
	// 	types = types[0];
	// }

	const attr: HtmlAttribute = {
		name: propName,
		value: {
			type: types,
			required: new Boolean(member.required).valueOf(),
			...(member.default !== undefined ? { default: JSON.stringify(member.default) } : {})
		},
		...(member.deprecated !== undefined ? { deprecated: true } : {})
	};

	if (member?.jsDoc?.description) attr.description = member.jsDoc.description;

	return attr;
}
