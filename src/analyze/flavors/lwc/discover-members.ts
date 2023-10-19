import type { GetAccessorDeclaration, Node, PropertyDeclaration, PropertySignature, SetAccessorDeclaration } from "typescript";
import { ComponentMember } from "../../types/features/component-member";
import { getMemberVisibilityFromNode, getModifiersFromNode } from "../../util/ast-util";
import { getJsDoc } from "../../util/js-doc-util";
import { lazy } from "../../util/lazy";
import { resolveNodeValue } from "../../util/resolve-node-value";
import { camelToDashCase } from "../../util/text-util";
import { AnalyzerDeclarationVisitContext } from "../analyzer-flavor";
import { hasLwcApiPropertyDecorator } from "./utils";

/**
 * Parses LWC related declaration members.
 * This is primary by looking at the "@api" decorator
 * @param node
 * @param context
 */
export function discoverMembers(node: Node, context: AnalyzerDeclarationVisitContext): ComponentMember[] | undefined {
	const { ts } = context;

	// Never pick up members not declared directly on the declaration node being traversed
	if (node.parent !== context.declarationNode) {
		return undefined;
	}
	// @api myProp = "hello";
	if (ts.isSetAccessor(node) || ts.isGetAccessor(node) || ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) {
		return parsePropertyDecorator(node, context);
	}
}

/**
 * Visits a LWC property decorator and returns members based on it.
 * @param node
 * @param context
 */
function parsePropertyDecorator(
	node: SetAccessorDeclaration | GetAccessorDeclaration | PropertyDeclaration | PropertySignature,
	context: AnalyzerDeclarationVisitContext
): ComponentMember[] | undefined {
	const { ts, checker } = context;

	// Parse the content of a possible lit "@api" decorator.
	const lwcApi = hasLwcApiPropertyDecorator(node, context);

	if (lwcApi) {
		const propName = node.name.getText();

		// In LWC, the attribute name is deduced from the property name
		// There is currently no way to for it to a different value
		const attrName = lwcAttrName(propName);

		// Find the default value for this property
		const initializer = "initializer" in node ? node.initializer : undefined;
		const resolvedDefaultValue = initializer != null ? resolveNodeValue(initializer, context) : undefined;
		const def = resolvedDefaultValue != null ? resolvedDefaultValue.value : initializer?.getText();

		// Find if the property/attribute is required
		//const required = ("initializer" in node && isPropertyRequired(node, context.checker)) || undefined;
		const required = undefined;

		const jsDoc = getJsDoc(node, ts);

		// Emit a property with "attrName"
		return [
			{
				priority: "high",
				kind: "property",
				propName,
				attrName,
				type: lazy(() => {
					const propType = checker.getTypeAtLocation(node);
					return propType;
				}),
				node,
				default: def,
				required,
				jsDoc,
				visibility: getMemberVisibilityFromNode(node, ts),
				reflect: undefined,
				modifiers: getModifiersFromNode(node, ts)
			}
		];
	}

	return undefined;
}

const HTMLAttrs: { [name: string]: string } = {
	accessKey: "accesskey",
	bgColor: "bgcolor",
	colSpan: "colspan",
	contentEditable: "contenteditable",
	crossOrigin: "crossorigin",
	dateTime: "datetime",
	htmlFor: "for",
	formAction: "formaction",
	isMap: "ismap",
	maxLength: "maxlength",
	minLength: "minlength",
	noValidate: "novalidate",
	readOnly: "readonly",
	rowSpan: "rowspan",
	tabIndex: "tabindex",
	useMap: "usemap"
};

// LWC attribute names
// https://lwc.dev/guide/javascript#html-attribute-names
function lwcAttrName(propName: string) {
	// Look for a global HTML name
	const htmlAttr: string = HTMLAttrs[propName];
	if (htmlAttr) {
		return htmlAttr;
	}
	// Calculate the attribute name from the property
	return camelToDashCase(propName).toLowerCase();
}
