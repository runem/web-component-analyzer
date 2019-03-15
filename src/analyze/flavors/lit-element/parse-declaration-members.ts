import { isAssignableToType, SimpleType, SimpleTypeKind, toSimpleType, toTypeString } from "ts-simple-type";
import { Node, PropertyLikeDeclaration, PropertySignature, ReturnStatement, SetAccessorDeclaration } from "typescript";
import { ComponentMember } from "../../types/component-member";
import { hasModifier, hasPublicSetter, isPropertyRequired } from "../../util/ast-util";
import { isValidAttributeName } from "../../util/is-valid-attribute-name";
import { getJsDoc } from "../../util/js-doc-util";
import { resolveNodeValue } from "../../util/resolve-node-value";
import { FlavorVisitContext, ParseComponentMembersContext } from "../parse-component-flavor";
import { getLitPropertyConfiguration, getLitPropertyOptions, LitPropertyConfiguration } from "./parse-lit-property-configuration";

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
				return visitStaticProperties(returnStatement, context);
			}
		}
	}

	// @property({type: String}) myProp = "hello";
	else if ((ts.isSetAccessorDeclaration(node) || ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) && hasPublicSetter(node, ts)) {
		visitPropertyDecorator(node, context);
	}
}

/**
 * Visits a lit property decorator and returns members based on it.
 * @param node
 * @param context
 */
function visitPropertyDecorator(node: SetAccessorDeclaration | PropertyLikeDeclaration | PropertySignature, context: ParseComponentMembersContext): ComponentMember[] | undefined {
	const { ts, checker } = context;

	// Parse the content of a possible lit "@property" decorator.
	const litConfig = getLitPropertyConfiguration(node, context);

	if (litConfig != null) {
		const propName = node.name.getText();
		const propType = checker.getTypeAtLocation(node);
		const simplePropType = toSimpleType(propType, checker);

		const type = simplePropType.kind === SimpleTypeKind.ANY && litConfig.type != null ? litConfig.type : propType;

		// Don't emit anything if "attribute" is false.
		// "Custom Element Flavor" takes care of parsing the property then.
		if (litConfig.attribute === false) {
			return;
		}

		// Look at diagnostics is on.
		if (context.config.diagnostics) {
			validateLitPropertyConfig(node, litConfig, { propName, simplePropType }, context);
		}

		// Get the attribute name either by looking at "{attribute: ...}" or just taking the property name.
		const attrName = typeof litConfig.attribute === "string" ? litConfig.attribute : propName;

		// Find the default value for this property
		const def = "initializer" in node && node.initializer != null ? resolveNodeValue(node.initializer, context) : undefined;

		// Find our if the property/attribute is required
		const required = ("initializer" in node && isPropertyRequired(node, context.checker)) || undefined;

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
				jsDoc: getJsDoc(node, ts)
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
function visitStaticProperties(returnStatement: ReturnStatement, context: FlavorVisitContext): ComponentMember[] {
	const { ts } = context;

	const members: ComponentMember[] = [];

	if (returnStatement.expression != null && ts.isObjectLiteralExpression(returnStatement.expression)) {
		// Each property in the object literal expression coreesponds to a class property.
		for (const propNode of returnStatement.expression.properties) {
			// Parse the lit property config for this property
			const propConfig = ts.isPropertyAssignment(propNode) && ts.isObjectLiteralExpression(propNode.initializer) ? getLitPropertyOptions(propNode.initializer, context) : {};

			const type = propConfig.type || { kind: SimpleTypeKind.ANY };
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
					jsDoc: getJsDoc(propNode, ts),
					node: propNode
				});
			}
		}
	}

	return members;
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
	const { checker } = context;

	if (litConfig.type != null) {
		if (!isAssignableToType(litConfig.type, simplePropType)) {
			context.emitDiagnostics({
				node: (litConfig.node && litConfig.node.type) || node,
				message: `@property type '${toTypeString(simplePropType)}' is not assignable to '${toTypeString(litConfig.type)}'`,
				severity: "warning"
			});
		}
	}

	if (litConfig.type == null && !litConfig.hasConverter && simplePropType.kind !== SimpleTypeKind.ANY) {
		if (isAssignableToType({ kind: SimpleTypeKind.STRING }, simplePropType, checker)) {
			//logger.debug(node.name.getText(), `You need to add {type: STRING}`);
		} else if (isAssignableToType({ kind: SimpleTypeKind.NUMBER }, simplePropType, checker)) {
			context.emitDiagnostics({
				node,
				severity: "warning",
				message: `You need to add '{type: Number}' to @property decorator for '${propName}'`
			});
		} else if (isAssignableToType({ kind: SimpleTypeKind.BOOLEAN }, simplePropType, checker)) {
			context.emitDiagnostics({
				node,
				severity: "warning",
				message: `You need to add '{type: Boolean}' to @property decorator for '${propName}'`
			});
		} else if (
			isAssignableToType(
				{
					kind: SimpleTypeKind.ARRAY,
					type: { kind: SimpleTypeKind.ANY }
				},
				simplePropType,
				checker
			)
		) {
			context.emitDiagnostics({
				node,
				severity: "warning",
				message: `You need to add '{type: Array}' to @property decorator for '${propName}'`
			});
		} else {
			context.emitDiagnostics({
				node,
				severity: "warning",
				message: `You need to add '{type: Object}' to @property decorator for '${propName}'`
			});
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
				node,
				severity: "error",
				message: `Invalid attribute name '${litConfig.attribute}'`
			});
		}
	}
}
