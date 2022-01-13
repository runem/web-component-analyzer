import { getTypeHintFromType } from "../../util/get-type-hint-from-type";
import { Program, TypeChecker } from "typescript";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
import { ComponentDefinition } from "../../analyze/types/component-definition";
import { ComponentEvent } from "../../analyze/types/features/component-event";
import { ComponentMember } from "../../analyze/types/features/component-member";
import { arrayDefined } from "../../util/array-util";
import { TransformerConfig } from "../transformer-config";
import { TransformerFunction } from "../transformer-function";
import { HtmlAttribute, GenericContributionsHost, WebtypesSchema, HtmlElement, BaseContribution, Js } from "./webtypes-schema";
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

	const webtypesJson: WebtypesSchema = {
		$schema: "http://json.schemastore.org/web-types",
		name: "web-components", // TODO as param
		version: "experimental",
		//"default-icon": "icons/lit.png",
		"js-types-syntax": "typescript", // TODO as param
		// framework: "lit",
		// "framework-config": {
		// 	"enable-when": {
		// 		"node-packages": ["lit"],
		// 		"file-extensions": ["ts", "js", "tsx", "jsx"]
		// 	}
		// },
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
		name: definition.tagName
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

	return build;
}

function componentEventToAttr(event: ComponentEvent, checker: TypeChecker, config: TransformerConfig): GenericContributionsHost | undefined {
	return {
		name: event.name
	};
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
		}
	};

	if (member?.jsDoc?.description) attr.description = member.jsDoc.description;

	return attr;
}
