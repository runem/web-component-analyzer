import { isAssignableToSimpleTypeKind, SimpleType, SimpleTypeKind, toSimpleType, toTypeString } from "ts-simple-type";
import { Node, PropertyLikeDeclaration, PropertySignature, ReturnStatement, SetAccessorDeclaration } from "typescript";
import { ComponentMember } from "../../types/component-member";
import { hasModifier, hasPublicSetter, isPropertyRequired } from "../../util/ast-util";
import { isValidAttributeName } from "../../util/is-valid-attribute-name";
import { getJsDoc, getJsDocType } from "../../util/js-doc-util";
import { resolveNodeValue } from "../../util/resolve-node-value";
import { joinArray } from "../../util/text-util";
import { FlavorVisitContext, ParseComponentMembersContext } from "../parse-component-flavor";
import { getLitElementPropertyDecorator, getLitPropertyConfiguration, getLitPropertyOptions, LitPropertyConfiguration } from "./parse-lit-property-configuration";

/**
 * Parses lit-related declaration members.
 * This is primary by looking at the "@property" decorator and the "static get properties()".
 * @param node
 * @param context
 */
export function parseDeclarationMembers(node: Node, context: ParseComponentMembersContext): ComponentMember[] | undefined {
	const { ts } = context;

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
	else if ((ts.isSetAccessorDeclaration(node) || ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) && hasPublicSetter(node, ts)) {
		return parsePropertyDecorator(node, context);
	}
}

/**
 * Visits a lit property decorator and returns members based on it.
 * @param node
 * @param context
 */
function parsePropertyDecorator(node: SetAccessorDeclaration | PropertyLikeDeclaration | PropertySignature, context: ParseComponentMembersContext): ComponentMember[] | undefined {
	const { ts, checker } = context;

	// Parse the content of a possible lit "@property" decorator.
	const litConfig = getLitPropertyConfiguration(node, context);

	if (litConfig != null) {
		const propName = node.name.getText();
		const propType = checker.getTypeAtLocation(node);
		const simplePropType = toSimpleType(propType, checker);

		const inJavascriptFile = node.getSourceFile().fileName.endsWith(".js");
		const type = inJavascriptFile ? litConfig.type || { kind: SimpleTypeKind.ANY } : propType;

		// Don't emit anything if "attribute" is false.
		// "Custom Element Flavor" takes care of parsing the property then.
		if (litConfig.attribute === false) {
			return;
		}

		// Look at diagnostics is on.
		if (context.config.diagnostics) {
			validateLitPropertyConfig(
				getLitElementPropertyDecorator(node, context) || node,
				litConfig,
				{
					propName,
					simplePropType
				},
				context
			);
		}

		// Get the attribute name either by looking at "{attribute: ...}" or just taking the property name.
		const attrName = typeof litConfig.attribute === "string" ? litConfig.attribute : propName;

		// Find the default value for this property
		const def = "initializer" in node && node.initializer != null ? resolveNodeValue(node.initializer, context) : undefined;

		// Find our if the property/attribute is required
		const required = ("initializer" in node && isPropertyRequired(node, context.checker)) || undefined;

		const jsDoc = getJsDoc(node, ts);

		// Emit a property with "attrName"
		return [
			{
				kind: "property",
				propName,
				attrName,
				type,
				node,
				default: def,
				required,
				jsDoc
			}
		];
	}

	return undefined;
}

/**
 * Visits static properties
 * static get properties() { return { myProp: {type: String, attribute: "my-attr"} } }
 * @param returnStatement
 * @param context
 */
function parseStaticProperties(returnStatement: ReturnStatement, context: FlavorVisitContext): ComponentMember[] {
	const { ts } = context;

	const members: ComponentMember[] = [];

	if (returnStatement.expression != null && ts.isObjectLiteralExpression(returnStatement.expression)) {
		// Each property in the object literal expression coreesponds to a class property.
		for (const propNode of returnStatement.expression.properties) {
			// Parse the lit property config for this property
			const propConfig = ts.isPropertyAssignment(propNode) && ts.isObjectLiteralExpression(propNode.initializer) ? getLitPropertyOptions(propNode.initializer, context) : {};

			const jsDoc = getJsDoc(propNode, ts);

			const type = (jsDoc && getJsDocType(jsDoc)) || propConfig.type || { kind: SimpleTypeKind.ANY };
			const propName = propNode.name != null && ts.isIdentifier(propNode.name) ? propNode.name.text : "";
			const attrName = typeof propConfig.attribute === "string" ? propConfig.attribute : propName;

			const emitAttribute = propConfig.attribute !== false;
			const emitProperty = propName != null;

			// Emit either the attribute or the property
			if (emitProperty) {
				members.push({
					kind: "property",
					type,
					propName: propName,
					attrName: emitAttribute ? attrName : undefined,
					jsDoc,
					node: propNode
				});
			}
		}
	}

	return members;
}

/**
 * Returns a string, that can be used in a lit @property decorator for the type key, representing the simple type kind.
 * @param simpleTypeKind
 */
function toLitPropertyTypeString(simpleTypeKind: SimpleTypeKind): string {
	switch (simpleTypeKind) {
		case SimpleTypeKind.STRING:
			return "String";
		case SimpleTypeKind.NUMBER:
			return "Number";
		case SimpleTypeKind.BOOLEAN:
			return "Boolean";
		case SimpleTypeKind.ARRAY:
			return "Array";
		case SimpleTypeKind.OBJECT:
			return "Object";
		default:
			return "";
	}
}

/**
 * Runs through a lit configuration and validates against the "simplePropType".
 * Emits diagnostics through the context.
 * @param node
 * @param litConfig
 * @param propName
 * @param simplePropType
 * @param context
 */
function validateLitPropertyConfig(
	node: Node,
	litConfig: LitPropertyConfiguration,
	{ propName, simplePropType }: { propName: string; simplePropType: SimpleType },
	context: ParseComponentMembersContext
) {
	if (litConfig.type != null && litConfig.type.kind) {
		if (litConfig.type.kind === SimpleTypeKind.FUNCTION) {
			const isFunction = isAssignableToSimpleTypeKind(simplePropType, [SimpleTypeKind.FUNCTION], { op: "or" });

			context.emitDiagnostics({
				node: (litConfig.node && litConfig.node.type) || node,
				message: `'Function' is not a valid default converter${isFunction ? ". Have you considered {attribute: false}?" : ""}'`,
				severity: "warning"
			});
			return;
		}
	}

	// Test assignments to all possible type kinds
	const isAssignableTo: Partial<Record<SimpleTypeKind, boolean>> = {
		[SimpleTypeKind.STRING]: isAssignableToSimpleTypeKind(simplePropType, [SimpleTypeKind.STRING, SimpleTypeKind.STRING_LITERAL], { op: "or" }),
		[SimpleTypeKind.NUMBER]: isAssignableToSimpleTypeKind(simplePropType, [SimpleTypeKind.NUMBER, SimpleTypeKind.NUMBER_LITERAL], { op: "or" }),
		[SimpleTypeKind.BOOLEAN]: isAssignableToSimpleTypeKind(simplePropType, [SimpleTypeKind.BOOLEAN, SimpleTypeKind.BOOLEAN_LITERAL], { op: "or" }),
		[SimpleTypeKind.ARRAY]: isAssignableToSimpleTypeKind(simplePropType, [SimpleTypeKind.ARRAY, SimpleTypeKind.TUPLE], { op: "or" }),
		[SimpleTypeKind.OBJECT]: isAssignableToSimpleTypeKind(simplePropType, [SimpleTypeKind.OBJECT, SimpleTypeKind.INTERFACE, SimpleTypeKind.CLASS], { op: "or" }),
		[SimpleTypeKind.ANY]: isAssignableToSimpleTypeKind(simplePropType, SimpleTypeKind.ANY)
	};

	// Collect type kinds that can be used in as "type" in the @property decorator
	const acceptedTypeKinds = Object.entries(isAssignableTo)
		.filter(([, assignable]) => assignable)
		.map(([kind]) => kind as SimpleTypeKind)
		.filter(kind => kind !== SimpleTypeKind.ANY);

	// Test the @property type against the actual type if a type has been provided
	if (litConfig.type != null) {
		// Report error if the @property type is not assignable to the actual type
		if (isAssignableTo[litConfig.type.kind] === false && isAssignableTo[SimpleTypeKind.ANY] === false) {
			// Suggest what to use instead
			if (acceptedTypeKinds.length >= 1) {
				const potentialKindText = joinArray(acceptedTypeKinds.map(kind => `'${toLitPropertyTypeString(kind)}'`), ", ", "or");

				context.emitDiagnostics({
					node: (litConfig.node && litConfig.node.type) || node,
					message: `@property type should be ${potentialKindText} instead of '${toLitPropertyTypeString(litConfig.type.kind)}'`,
					severity: "warning"
				});
			}

			// If no suggesting can be provided, report that they are not assignable
			// The OBJECT @property type is an escape from this error
			else if (litConfig.type.kind !== SimpleTypeKind.OBJECT) {
				context.emitDiagnostics({
					node: (litConfig.node && litConfig.node.type) || node,
					message: `@property type '${toTypeString(litConfig.type)}' is not assignable to the actual type '${toTypeString(simplePropType)}'`,
					severity: "warning"
				});
			}
		}
	}

	// If no type has been specified, suggest what to use as the @property type
	else {
		if (!litConfig.hasConverter && litConfig.attribute !== false) {
			// Don't do anything if there are multiple possibilities for a type.
			if (isAssignableTo[SimpleTypeKind.ANY]) {
			}

			// Don't report errors because String conversion is default
			else if (isAssignableTo[SimpleTypeKind.STRING]) {
			}

			// Suggest what to use instead if there are multiple accepted @property types for this property
			else if (acceptedTypeKinds.length > 0) {
				// Suggest types to use and include "{attribute: false}" if the @property type is ARRAY or OBJECT
				const acceptedTypeText = joinArray(
					[
						...acceptedTypeKinds.map(kind => `'{type: ${toLitPropertyTypeString(kind)}}'`),
						...(isAssignableTo[SimpleTypeKind.ARRAY] || isAssignableTo[SimpleTypeKind.OBJECT] ? ["'{attribute: false}'"] : [])
					],
					", ",
					"or"
				);

				context.emitDiagnostics({
					node,
					severity: "warning",
					message: `Missing ${acceptedTypeText} on @property decorator for '${propName}'`
				});
			}
		}
	}

	/*if (litConfig.attribute !== false && !isAssignableToPrimitiveType(simplePropType)) {
	 context.emitDiagnostics({
	 node,
	 severity: "warning",
	 message: `You need to add '{attribute: false}' to @property decorator for '${propName}' because '${toTypeString(simplePropType)}' type is not a primitive`
	 });
	 }*/

	if (typeof litConfig.attribute === "string") {
		if (!isValidAttributeName(litConfig.attribute)) {
			context.emitDiagnostics({
				node: (litConfig.node && litConfig.node.attribute) || node,
				severity: "error",
				message: `Invalid attribute name '${litConfig.attribute}'`
			});
		}
	}
}
