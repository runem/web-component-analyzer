/**
 * @fileoverview A collection of utilities for computing custom element
 * manifest declarations and exports from a given analyzer result.
 *
 * The entrypoint here is the `getDeclarationsFromResult` function which
 * is responsible for traversing the internal analyzer result model
 * and mapping to the appropriate manifest model.
 *
 * For example, mapping known exports into a list of manifest declarations.
 */
import * as tsModule from 'typescript';
import {isSimpleType, toSimpleType} from 'ts-simple-type';
import {ComponentDeclaration} from '../../analyze/types/component-declaration';
import {
	getMixinHeritageClauses,
	getSuperclassHeritageClause
} from '../../analyze/util/component-declaration-util';
import {findParent, getNodeName} from '../../analyze/util/ast-util';
import {getJsDoc} from '../../analyze/util/js-doc-util';
import {getTypeHintFromType} from '../../util/get-type-hint-from-type';
import {AnalyzerResult} from '../../analyze/types/analyzer-result';
import * as schema from 'custom-elements-manifest';
import {TransformerContext} from '../transformer-context';
import {
	typeToSchemaType,
	getSummaryFromJsDoc,
	getParameterFromJsDoc,
	getReturnFromJsDoc,
	getReferenceFromHeritageClause,
	getInheritedFromReference
} from './utils';

/**
 * Computes the exported symbols of a result (e.g. variables, functions, etc.)
 * @param result
 * @param context
 */
function* getExportedDeclarationsFromResult(
	result: AnalyzerResult,
	context: TransformerContext
): IterableIterator<schema.Declaration> {
	// Get all exported symbols in the source file
	const symbol = context.checker.getSymbolAtLocation(result.sourceFile);

	if (symbol == null) {
		return;
	}

	const exports = context.checker.getExportsOfModule(symbol);

	// Iterate through exported symbols the typescript compiler detected
	for (const exp of exports) {
		const node = exp.valueDeclaration;
		const variableFlags = tsModule.SymbolFlags.BlockScopedVariable | tsModule.SymbolFlags.Variable;

		// Produce the correct manifest declaration for each symbol
		if (exp.flags & variableFlags && node && tsModule.isVariableDeclaration(node)) {
			// Get the nearest variable statement in order to read the jsdoc
			const variableStatement = findParent(node, tsModule.isVariableStatement) || node;
			const jsDoc = getJsDoc(variableStatement, tsModule);

			yield {
				kind: 'variable',
				name: node.name.getText(),
				description: jsDoc?.description,
				type: typeToSchemaType(context, context.checker.getTypeAtLocation(node)),
				summary: getSummaryFromJsDoc(jsDoc)
			};
		}

		if (
			exp.flags & tsModule.SymbolFlags.Function &&
			tsModule.isFunctionDeclaration(node) &&
			node.name
		) {
			const jsDoc = getJsDoc(node, tsModule);
			const parameters: schema.Parameter[] = [];
			let returnType: tsModule.Type | undefined = undefined;

			for (const param of node.parameters) {
				const name = param.name.getText();
				const {description, typeHint} = getParameterFromJsDoc(name, jsDoc);
				const type = typeToSchemaType(
					context,
					typeHint ?? (param.type != null ? context.checker.getTypeAtLocation(param.type) : undefined)
				);

				parameters.push({
					name,
					type,
					description,
					optional: param.questionToken !== undefined
				});
			}

			const signature = context.checker.getSignatureFromDeclaration(node);
			if (signature != null) {
				returnType = context.checker.getReturnTypeOfSignature(signature);
			}

			const {description: returnDescription, typeHint: returnTypeHint} = getReturnFromJsDoc(jsDoc);

			yield {
				kind: 'function',
				name: node.name.getText(),
				description: jsDoc?.description,
				summary: getSummaryFromJsDoc(jsDoc),
				parameters,
				return: {
					type: typeToSchemaType(context, returnTypeHint || returnType),
					description: returnDescription
				}
			};
		}
	}
}

/**
 * Computes the class fields for a given component declaration
 * @param declaration
 * @param context
 */
function* getClassFieldsForComponent(
	declaration: ComponentDeclaration,
	context: TransformerContext
): IterableIterator<schema.ClassField> {
	const visibility = context.config.visibility ?? 'public';
	for (const member of declaration.members) {
		if (member.visibility === visibility && member.propName != null) {
			yield {
				kind: 'field',
				name: member.propName,
				privacy: member.visibility,
				description: member.jsDoc?.description,
				type: typeToSchemaType(context, member.typeHint || member.type?.()),
				default: member.default != null ? JSON.stringify(member.default) : undefined,
				inheritedFrom: getInheritedFromReference(declaration, member, context),
				summary: getSummaryFromJsDoc(member.jsDoc)
				// TODO: "static"
			};
		}
	}
}

/**
 * Computes the methods for a given component declaration
 * @param declaration
 * @param context
 */
function* getMethodsForComponent(
	declaration: ComponentDeclaration,
	context: TransformerContext
): IterableIterator<schema.ClassMethod> {
	const visibility = context.config.visibility ?? 'public';
	for (const method of declaration.methods) {
		const parameters: schema.Parameter[] = [];
		const node = method.node;
		let returnType: tsModule.Type | undefined = undefined;

		if (
			method.visibility === visibility &&
			node !== undefined &&
			tsModule.isMethodDeclaration(node)
		) {
			for (const param of node.parameters) {
				const name = param.name.getText();
				const {description, typeHint} = getParameterFromJsDoc(name, method.jsDoc);

				parameters.push({
					name: name,
					type: typeToSchemaType(
						context,
						typeHint || (param.type != null ? context.checker.getTypeAtLocation(param.type) : undefined)
					),
					description: description,
					optional: param.questionToken !== undefined
				});
			}

			// Get return type
			const signature = context.checker.getSignatureFromDeclaration(node);
			if (signature != null) {
				returnType = context.checker.getReturnTypeOfSignature(signature);
			}
		}

		// Get return info from jsdoc
		const {description: returnDescription, typeHint: returnTypeHint} = getReturnFromJsDoc(
			method.jsDoc
		);

		yield {
			kind: 'method',
			name: method.name,
			privacy: method.visibility,
			description: method.jsDoc?.description,
			parameters,
			return: {
				description: returnDescription,
				type: typeToSchemaType(context, returnTypeHint || returnType)
			},
			inheritedFrom: getInheritedFromReference(declaration, method, context),
			summary: getSummaryFromJsDoc(method.jsDoc)
			// TODO: "static"
		};
	}
}

/**
 * Computes the class members for a given component declaration
 * @param declaration
 * @param context
 */
function* getClassMembersForDeclaration(
	declaration: ComponentDeclaration,
	context: TransformerContext
): IterableIterator<schema.ClassMember[]> {
	yield* getClassFieldsForComponent(declaration, context);
	yield* getMethodsForComponent(declaration, context);
}

/**
 * Computes the events for a given component declaration
 * @param declaration
 * @param context
 */
function* getEventsFromComponent(
	declaration: ComponentDeclaration,
	context: TransformerContext
): IterableIterator<schema.Event> {
	const visibility = context.config.visibility ?? 'public';
	for (const event of declaration.events) {
		if (event.visibility === visibility) {
			const type = event.type?.() ?? {kind: 'ANY'};
			const simpleType = isSimpleType(type) ? type : toSimpleType(type, context.checker);
			const typeName =
				simpleType.kind === 'GENERIC_ARGUMENTS' ? simpleType.target.name : simpleType.name;
			yield {
				description: event.jsDoc?.description,
				name: event.name,
				inheritedFrom: getInheritedFromReference(declaration, event, context),
				type:
					typeName === null || typeName === undefined || simpleType.kind === 'ANY'
						? {text: 'Event'}
						: {text: typeName}
			};
		}
	}
}

/**
 * Computes the slots for a given component declaration
 * @param declaration
 * @param context
 */
function* getSlotsFromComponent(
	declaration: ComponentDeclaration,
	context: TransformerContext
): IterableIterator<schema.Slot> {
	for (const slot of declaration.slots) {
		yield {
			description: slot.jsDoc?.description,
			name: slot.name ?? ''
		};
	}
}

/**
 * Computes the attributes for a given component declaration
 * @param declaration
 * @param context
 */
function* getAttributesFromComponent(
	declaration: ComponentDeclaration,
	context: TransformerContext
): IterableIterator<schema.Attribute> {
	const visibility = context.config.visibility ?? 'public';
	for (const member of declaration.members) {
		if (member.visibility === visibility && member.attrName) {
			const type = getTypeHintFromType(
				member.typeHint ?? member.type?.(),
				context.checker,
				context.config
			);
			yield {
				name: member.attrName,
				fieldName: member.propName,
				default: member.default != null ? JSON.stringify(member.default) : undefined,
				description: member.jsDoc?.description,
				type: type === undefined ? undefined : {text: type},
				inheritedFrom: getInheritedFromReference(declaration, member, context)
			};
		}
	}
}

/**
 * Computes the CSS properties for a given component declaration
 * @param declaration
 * @param context
 */
function* getCSSPropertiesFromComponent(
	declaration: ComponentDeclaration,
	context: TransformerContext
): IterableIterator<schema.CssCustomProperty> {
	for (const cssProperty of declaration.cssProperties) {
		// TODO (43081j): somehow populate the syntax property
		yield {
			name: cssProperty.name,
			description: cssProperty.jsDoc?.description,
			default: cssProperty.default != null ? JSON.stringify(cssProperty.default) : undefined
		};
	}
}

/**
 * Computes the CSS parts (::part) for a given component declaration
 * @param declaration
 * @param context
 */
function* getCSSPartsFromComponent(
	declaration: ComponentDeclaration,
	context: TransformerContext
): IterableIterator<schema.CssPart> {
	for (const cssPart of declaration.cssParts) {
		yield {
			name: cssPart.name,
			description: cssPart.jsDoc?.description
		};
	}
}

/**
 * Computes the manifest declaration of a given component declaration
 * @param declaration
 * @param result
 * @param context
 */
function getDeclarationForComponent(
	declaration: ComponentDeclaration,
	result: AnalyzerResult,
	context: TransformerContext
): schema.Declaration | undefined {
	if (declaration.kind === 'interface') {
		return undefined;
	}

	const superClassClause = getSuperclassHeritageClause(declaration);
	const superClass = superClassClause
		? getReferenceFromHeritageClause(superClassClause, context)
		: undefined;
	const definition = result.componentDefinitions.find(
		(def) => def.declaration?.node === declaration.node
	);
	const mixinClauses = getMixinHeritageClauses(declaration);
	const mixins = mixinClauses
		.map((c) => getReferenceFromHeritageClause(c, context))
		.filter((c): c is schema.Reference => c !== undefined);
	const members = [...getClassMembersForDeclaration(declaration, context)];
	const name = declaration.symbol?.name ?? getNodeName(declaration.node, {ts: tsModule});

	if (!name) {
		return undefined;
	}

	const classDecl: schema.ClassDeclaration = {
		kind: 'class',
		name,
		superclass: superClass,
		mixins: mixins.length > 0 ? mixins : undefined,
		description: declaration.jsDoc?.description,
		members: members.length > 0 ? members : undefined,
		summary: getSummaryFromJsDoc(declaration.jsDoc)
	};

	if (!definition) {
		return classDecl;
	}

	const events = [...getEventsFromComponent(declaration, context)];
	const slots = [...getSlotsFromComponent(declaration, context)];
	const attributes = [...getAttributesFromComponent(declaration, context)];
	const cssProperties = [...getCSSPropertiesFromComponent(declaration, context)];
	const cssParts = [...getCSSPartsFromComponent(declaration, context)];

	// Return a custom element doc if a definition was found
	const customElementDoc: schema.CustomElementDeclaration = {
		...classDecl,
		customElement: true,
		tagName: definition.tagName,
		events: events.length > 0 ? events : undefined,
		slots: slots.length > 0 ? slots : undefined,
		attributes: attributes.length > 0 ? attributes : undefined,
		cssProperties: cssProperties.length > 0 ? cssProperties : undefined,
		cssParts: cssParts.length > 0 ? cssParts : undefined
	};

	return customElementDoc;
}

/**
 * Computes the manifest declarations for a given analyzer result
 * @param result
 * @param context
 */
function* getComponentDeclarationsFromResult(
	result: AnalyzerResult,
	context: TransformerContext
): IterableIterator<schema.Declaration> {
	if (result.declarations) {
		for (const decl of result.declarations) {
			const schemaDecl = getDeclarationForComponent(decl, result, context);
			if (schemaDecl) {
				yield schemaDecl;
			}
		}
	}

	for (const definition of result.componentDefinitions) {
		if (definition.declaration) {
			const schemaDecl = getDeclarationForComponent(definition.declaration, result, context);
			if (schemaDecl) {
				yield schemaDecl;
			}
		}
	}
}

/**
 * Returns declarations in an analyzer result
 * @param result
 * @param context
 */
export function* getDeclarationsFromResult(
	result: AnalyzerResult,
	context: TransformerContext
): IterableIterator<schema.Declaration[]> {
	yield* getExportedDeclarationsFromResult(result, context);
	yield* getComponentDeclarationsFromResult(result, context);
}
