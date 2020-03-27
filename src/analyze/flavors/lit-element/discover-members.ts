import { SimpleTypeKind } from "ts-simple-type";
import { Node, PropertyLikeDeclaration, PropertySignature, ReturnStatement, SetAccessorDeclaration } from "typescript";
import { LitElementPropertyConfig } from "../../types/features/lit-element-property-config";
import { getMemberVisibilityFromNode, getModifiersFromNode, getNodeSourceFileLang, hasModifier } from "../../util/ast-util";
import { getExtendsForInheritanceTree } from "../../util/inheritance-tree-util";
import { getJsDoc, getJsDocType } from "../../util/js-doc-util";
import { lazy } from "../../util/lazy";
import { resolveNodeValue } from "../../util/resolve-node-value";
import { camelToDashCase } from "../../util/text-util";
import { AnalyzerDeclarationVisitContext, ComponentMemberResult } from "../analyzer-flavor";
import { getLitElementPropertyDecoratorConfig, getLitPropertyOptions, parseLitPropertyOption } from "./parse-lit-property-configuration";

/**
 * Parses lit-related declaration members.
 * This is primary by looking at the "@property" decorator and the "static get properties()".
 * @param node
 * @param context
 */
export function discoverMembers(node: Node, context: AnalyzerDeclarationVisitContext): ComponentMemberResult[] | undefined {
	const { ts } = context;

	// Never pick up members not declared directly on the declaration node being traversed
	if (node.parent !== context.declarationNode) {
		return undefined;
	}

	// static get properties() { return { myProp: {type: String} } }
	if (ts.isGetAccessor(node) && hasModifier(node, ts.SyntaxKind.StaticKeyword)) {
		const name = node.name.getText();
		if (name === "properties" && node.body != null) {
			const returnStatement = node.body.statements.find<ReturnStatement>(ts.isReturnStatement.bind(ts));
			if (returnStatement != null) {
				return parseStaticProperties(returnStatement, context);
			}
		}
	}

	// @property({type: String}) myProp = "hello";
	else if (ts.isSetAccessor(node) || ts.isGetAccessor(node) || ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) {
		return parsePropertyDecorator(node, context);
	}
}

/**
 * Visits a lit property decorator and returns members based on it.
 * @param node
 * @param context
 */
function parsePropertyDecorator(
	node: SetAccessorDeclaration | PropertyLikeDeclaration | PropertySignature,
	context: AnalyzerDeclarationVisitContext
): ComponentMemberResult[] | undefined {
	const { ts, checker } = context;

	// Parse the content of a possible lit "@property" decorator.
	const litConfig = getLitElementPropertyDecoratorConfig(node, context);

	if (litConfig != null) {
		const propName = node.name.getText();

		// Get the attribute based on the configuration
		const attrName = getLitAttributeName(propName, litConfig, context);

		// Find the default value for this property
		const initializer = "initializer" in node ? node.initializer : undefined;
		const resolvedDefaultValue = initializer != null ? resolveNodeValue(initializer, context) : undefined;
		const def = resolvedDefaultValue != null ? resolvedDefaultValue.value : initializer?.getText();

		// Find our if the property/attribute is required
		//const required = ("initializer" in node && isPropertyRequired(node, context.checker)) || undefined;
		const required = undefined;

		const jsDoc = getJsDoc(node, ts);

		// Emit a property with "attrName"
		return [
			{
				priority: "high",
				member: {
					kind: "property",
					propName,
					attrName,
					type: lazy(() => {
						const propType = checker.getTypeAtLocation(node);
						const inJavascriptFile = getNodeSourceFileLang(node) === "js";
						return inJavascriptFile && typeof litConfig.type === "object" && litConfig.type.kind === SimpleTypeKind.ANY ? litConfig.type : propType;
					}),
					node,
					default: def,
					required,
					jsDoc,
					meta: litConfig,
					visibility: getMemberVisibilityFromNode(node, ts),
					reflect: litConfig.reflect ? "both" : attrName != null ? "to-property" : undefined,
					modifiers: getModifiersFromNode(node, ts)
				}
			}
		];
	}

	return undefined;
}

/**
 * Returns if we are in a Polymer context.
 * @param context
 */
function inPolymerFlavorContext(context: AnalyzerDeclarationVisitContext): boolean {
	const declaration = context.getDeclaration();

	// TODO: find a better way to construct a cache key
	const cacheKey = `isPolymerFlavorContext:${context.sourceFile?.fileName || "unknown"}`;

	if (context.cache.general.has(cacheKey)) {
		return context.cache.general.get(cacheKey) as boolean;
	}

	let result = false;

	// Use "@polymer" jsdoc tag to indicate that this is polymer context
	if (declaration.jsDoc?.tags?.some(t => t.tag === "polymer" || t.tag === "polymerElement")) {
		result = true;
	}

	const extnds = getExtendsForInheritanceTree(declaration.inheritanceTree);
	if (extnds.has("PolymerElement") || extnds.has("Polymer.Element")) {
		result = true;
	}

	context.cache.general.set(cacheKey, result);

	return result;
}

/**
 * Returns an attribute name based on a property name and a lit-configuration
 * @param propName
 * @param litConfig
 * @param context
 */
function getLitAttributeName(propName: string, litConfig: LitElementPropertyConfig, context: AnalyzerDeclarationVisitContext): string | undefined {
	// Don't emit attribute if the value is specifically "false"
	if (litConfig.attribute === false) {
		return undefined;
	}

	// Get the attribute name either by looking at "{attribute: ...}" or just taking the property name.
	let attrName = typeof litConfig.attribute === "string" ? litConfig.attribute : propName;

	if (inPolymerFlavorContext(context)) {
		// From the documentation: https://polymer-library.polymer-project.org/3.0/docs/devguide/properties#attribute-reflection
		attrName = camelToDashCase(attrName).toLowerCase();
	}

	return attrName;
}

/**
 * Visits static properties
 * static get properties() { return { myProp: {type: String, attribute: "my-attr"} } }
 * @param returnStatement
 * @param context
 */
function parseStaticProperties(returnStatement: ReturnStatement, context: AnalyzerDeclarationVisitContext): ComponentMemberResult[] {
	const { ts } = context;

	const memberResults: ComponentMemberResult[] = [];

	if (returnStatement.expression != null && ts.isObjectLiteralExpression(returnStatement.expression)) {
		const isPolymerFlavor = inPolymerFlavorContext(context);

		// Each property in the object literal expression corresponds to a class field.
		for (const propNode of returnStatement.expression.properties) {
			// Get propName
			const propName = propNode.name != null && ts.isIdentifier(propNode.name) ? propNode.name.text : undefined;
			if (propName == null) {
				continue;
			}

			// Parse the lit property config for this property
			// Treat non-object-literal-expressions like the "type" (to support Polymer specific syntax)
			const litConfig = ts.isPropertyAssignment(propNode)
				? ts.isObjectLiteralExpression(propNode.initializer)
					? getLitPropertyOptions(propNode.initializer, context)
					: isPolymerFlavor
					? parseLitPropertyOption(
							{
								kind: "type",
								initializer: propNode.initializer,
								config: {}
							},
							context
					  )
					: {}
				: {};

			// Get attrName based on the litConfig
			const attrName = getLitAttributeName(propName, litConfig, context);

			// Get more metadata
			const jsDoc = getJsDoc(propNode, ts);

			const emitAttribute = litConfig.attribute !== false;

			// Emit either the attribute or the property
			memberResults.push({
				priority: "high",
				member: {
					kind: "property",
					type: lazy(() => {
						return (jsDoc && getJsDocType(jsDoc)) || (typeof litConfig.type === "object" && litConfig.type) || { kind: SimpleTypeKind.ANY };
					}),
					propName: propName,
					attrName: emitAttribute ? attrName : undefined,
					jsDoc,
					node: propNode,
					meta: litConfig,
					default: litConfig.default,
					reflect: litConfig.reflect ? "both" : attrName != null ? "to-property" : undefined
				}
			});
		}
	}

	return memberResults;
}
