import { basename, relative } from "path";
import { isSimpleType, SimpleType, toSimpleType } from "ts-simple-type";
import * as tsModule from "typescript";
import { Declaration, FunctionDeclaration, Node, Program, SourceFile, Symbol, Type, TypeChecker, VariableDeclaration } from "typescript";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
import { ComponentDeclaration, ComponentHeritageClause } from "../../analyze/types/component-declaration";
import { ComponentFeatureBase } from "../../analyze/types/features/component-feature";
import { JsDoc } from "../../analyze/types/js-doc";
import { findParent, getNodeName, hasFlag, isAliasSymbol, resolveDeclarations } from "../../analyze/util/ast-util";
import { getMixinHeritageClauses, getSuperclassHeritageClause, visitAllHeritageClauses } from "../../analyze/util/component-declaration-util";
import { getJsDoc } from "../../analyze/util/js-doc-util";
import { arrayDefined } from "../../util/array-util";
import { getTypeHintFromType } from "../../util/get-type-hint-from-type";
import { filterVisibility } from "../../util/model-util";
import { TransformerConfig } from "../transformer-config";
import { TransformerFunction } from "../transformer-function";
import {
	Attribute as AttributeSchema,
	ClassDeclaration as ClassDeclarationSchema,
	ClassField as ClassFieldSchema,
	ClassMember as ClassMemberSchema,
	ClassMethod as ClassMethodSchema,
	CssCustomProperty as CssCustomPropertySchema,
	CssPart as CssPartSchema,
	CustomElement as CustomElementSchema,
	Declaration as DeclarationSchema,
	Event as EventSchema,
	Export as ExportSchema,
	FunctionDeclaration as FunctionDeclarationSchema,
	MixinDeclaration as MixinDeclarationSchema,
	Module as ModuleSchema,
	Package as PackageSchema,
	Parameter as ParameterSchema,
	Reference as ReferenceSchema,
	Slot as SlotSchema,
	Type as TypeSchema,
	TypeReference as TypeReferenceSchema,
	VariableDeclaration as VariableDeclarationSchema
} from "./schema";

interface TransformerContext {
	config: TransformerConfig;
	checker: TypeChecker;
	program: Program;
	ts: typeof tsModule;
	emitDeclaration(decl: Node): void;
}

/**
 * Transforms results to json using the schema found here: https://github.com/webcomponents/custom-elements-manifest
 * @param results
 * @param program
 * @param config
 */
export const json2Transformer: TransformerFunction = (results: AnalyzerResult[], program: Program, config: TransformerConfig): string => {
	const context: TransformerContext = {
		config,
		checker: program.getTypeChecker(),
		program,
		ts: tsModule,
		emitDeclaration() {
			// noop
		}
	};

	// Flatten analyzer results expanding inherited declarations into the declaration array.
	const flattenedAnalyzerResults = flattenAnalyzerResults(results);

	// Transform all analyzer results into modules
	const modules = flattenedAnalyzerResults.map(result => analyzerResultToModuleSchema(result, context));

	const packageData: PackageSchema = {
		schemaVersion: "0.0.1", // TODO: Find out what version this is
		modules
	};

	return JSON.stringify(packageData, null, 2);
};

/**
 * Transforms an analyzer result into a Module
 * @param result
 * @param context
 */
function analyzerResultToModuleSchema(result: AnalyzerResult, context: TransformerContext): ModuleSchema {
	// Only "javascript-module" are analyzed for now

	const exportedDeclarations = new Set<Node>();

	// Get all exports from the analyzer result
	const exports = analyzerResultToExportSchema(result, {
		...context,
		emitDeclaration(decl: Node) {
			exportedDeclarations.add(decl);
		}
	});

	// Get all declarations from the analyzer result
	const declarations = analyzerResultToDeclarationSchema(exportedDeclarations, result, context);

	return {
		kind: "javascript-module",
		path: getRelativePath(result.sourceFile.fileName, context),
		exports: exports.length === 0 ? undefined : exports,
		declarations,
		summary: undefined, // TODO: include this field if the SourceFile has a top-level comment with JSDoc tag "@summary"
		description: undefined // TODO: include this field if the SourceFile has a top-level comment without any JSDoc tags.,
	};
}

/**
 * Returns Export from an analyzer result
 * @param result
 * @param context
 */
function analyzerResultToExportSchema(result: AnalyzerResult, context: TransformerContext): ExportSchema[] {
	const exports: ExportSchema[] = [];

	// Add all custom element definitions to the Exports array
	for (const componentDefinition of result.componentDefinitions) {
		const declaration = componentDefinition.declaration?.node;

		if (declaration == null) {
			continue;
		}

		exports.push({
			kind: "custom-element-definition",
			name: componentDefinition.tagName,
			declaration: nodeToReferenceSchema(declaration, context)
		});

		context.emitDeclaration(declaration);
	}

	// Get the symbol representing the source file
	const fileSymbol = context.checker.getSymbolAtLocation(result.sourceFile);

	// Loop through all exports in the source file
	for (const [exportName, exportSymbol] of ((fileSymbol?.exports?.entries() as unknown) || []) as Iterable<[string, Symbol]>) {
		// Find corresponding definition from the AnalyzerResult and skip if found (we just added all custom element definitions above)
		const hasCustomElementDefinition = result.componentDefinitions.some(definition => definition.declaration?.symbol === exportSymbol);
		if (hasCustomElementDefinition) {
			continue;
		}

		// Resolve the symbol to a declaration Node
		const declaration = resolveSymbolDeclaration(exportSymbol, context);

		// Handle namespace exports
		if (context.ts.isNamespaceExport(declaration)) {
			const sourceFile = resolveSymbolDeclaration(exportSymbol, context, { resolveAlias: true }) as Node;

			const module = context.ts.isSourceFile(sourceFile)
				? getRelativePath(sourceFile.fileName, context)
				: declaration.parent.moduleSpecifier?.getText();

			exports.push({
				kind: "js",
				name: exportName,
				declaration: {
					module,
					name: "*"
				}
			});
		}

		// Add export declarations
		else if (context.ts.isExportDeclaration(declaration)) {
			const isExportStar = hasFlag(exportSymbol.flags, context.ts.SymbolFlags.ExportStar);

			if (isExportStar) {
				exports.push({
					kind: "js",
					name: "*",
					declaration: {
						module: declaration.moduleSpecifier?.getText(),
						name: "*"
					}
				});
			} else {
				exports.push({
					kind: "js",
					name: exportName,
					declaration: nodeToReferenceSchema(exportSymbol, context)
				});

				context.emitDeclaration(declaration);
			}
		}

		// Anything else, such as ClassDeclaration and FunctionDeclaration
		else if (
			context.ts.isClassDeclaration(declaration) ||
			context.ts.isFunctionDeclaration(declaration) ||
			context.ts.isVariableDeclaration(declaration)
		) {
			exports.push({
				kind: "js",
				name: exportName,
				declaration: nodeToReferenceSchema(exportSymbol, context)
			});

			context.emitDeclaration(declaration);
		}
	}

	return exports;
}

/**
 * Converts all exported TS declarations to Declarations.
 * These are converted and added "deep" (through the "emitDeclaration" callback),
 * so that all declarations reachable from exports are described here.
 * @param exportedDeclarations
 * @param result
 * @param context
 */
function analyzerResultToDeclarationSchema(
	exportedDeclarations: Set<Node>,
	result: AnalyzerResult,
	context: TransformerContext
): DeclarationSchema[] {
	const declarationNodes = new Set<Node>(exportedDeclarations);

	context = {
		...context,
		emitDeclaration(decl: Node) {
			declarationNodes.add(decl);
		}
	};

	const declarations: DeclarationSchema[] = [];

	const emittedNodes = new Set<Node>();

	// Convert declarations until "delcarationNodes" is empty
	let declNode: Node | undefined;
	while ((declNode = declarationNodes.values().next()?.value) != null) {
		declarationNodes.delete(declNode);

		if (emittedNodes.has(declNode) || declNode.getSourceFile() !== result.sourceFile) {
			continue;
		}

		emittedNodes.add(declNode);

		const componentDeclaration = result.declarations?.find(componentDecl => componentDecl?.node === declNode);

		// Convert the node
		let declarationSchema: DeclarationSchema | undefined;

		if (componentDeclaration != null) {
			declarationSchema = componentDeclarationToDeclarationSchema(componentDeclaration, result, context);
		} else if (context.ts.isFunctionDeclaration(declNode)) {
			declarationSchema = functionDeclarationToFunctionDeclarationSchema(declNode, context);
		} else if (context.ts.isVariableDeclaration(declNode)) {
			declarationSchema = variableDeclarationToVariableDeclarationSchema(declNode, context);
		}

		if (declarationSchema != null) {
			declarations.push(declarationSchema);
		}
	}

	return declarations;
}

/**
 * Converts a component declaration to ClassDeclaration, CustomElementDeclaration or MixinDeclaration
 * @param declaration
 * @param result
 * @param context
 */
function componentDeclarationToDeclarationSchema(
	declaration: ComponentDeclaration,
	result: AnalyzerResult,
	context: TransformerContext
): DeclarationSchema | undefined {
	// Only include "mixin" and "class" in the output. Interfaces are not outputted..
	if (declaration.kind === "interface") {
		return undefined;
	}

	// Get the superclass of this declaration
	const superclassHeritage = getSuperclassHeritageClause(declaration);
	const superclassRef = superclassHeritage == null ? undefined : heritageClauseToReferenceSchema(superclassHeritage, context);

	// Get all mixins
	const mixinHeritage = getMixinHeritageClauses(declaration);
	const mixinRefs = arrayDefined(mixinHeritage.map(h => heritageClauseToReferenceSchema(h, context)));

	const members = componentDeclarationToClassMemberSchema(declaration, context);

	const classDoc: ClassDeclarationSchema = {
		kind: "class",
		superclass: superclassRef,
		mixins: mixinRefs.length > 0 ? mixinRefs : undefined,
		description: declaration.jsDoc?.description,
		name: declaration.symbol?.name || getNodeName(declaration.node, { ts: tsModule }) || "",
		members: members.length > 0 ? members : undefined,
		summary: getSummaryFromJsDoc(declaration.jsDoc)
	};

	// TODO: Properly implement mixins
	if (declaration.kind === "mixin") {
		const mixinDoc: MixinDeclarationSchema = {
			...classDoc,
			kind: "mixin"
		};

		return mixinDoc;
	}

	// Find the first corresponding custom element definition for this declaration
	const definition = result.componentDefinitions.find(def => def.declaration?.node === declaration.node);

	if (definition != null) {
		const events = componentDeclarationToEventSchema(declaration, context);
		const slots = componentDeclarationToSlotSchema(declaration, context);
		const attributes = componentDeclarationToAttributeSchema(declaration, context);
		const cssProperties = componentDeclarationToCSSPropertySchema(declaration, context);
		const cssParts = componentDeclarationToCSSPartSchema(declaration, context);

		// Return a custom element doc if a definition was found
		const customElementDoc: CustomElementSchema = {
			...classDoc,
			tagName: definition.tagName,
			events: events.length > 0 ? events : undefined,
			slots: slots.length > 0 ? slots : undefined,
			attributes: attributes.length > 0 ? attributes : undefined,
			cssProperties: cssProperties.length > 0 ? cssProperties : undefined,
			parts: cssParts.length > 0 ? cssParts : undefined
		};

		return customElementDoc;
	}

	return classDoc;
}

/**
 * Returns FunctionDeclaration in an analyzer result
 * @param node
 * @param context
 */
function functionDeclarationToFunctionDeclarationSchema(
	node: FunctionDeclaration,
	context: TransformerContext
): FunctionDeclarationSchema | undefined {
	// TODO: support function exports
	return undefined;
}

/**
 * Returns VariableDeclaration from an analyzer result
 * @param node
 * @param context
 */
function variableDeclarationToVariableDeclarationSchema(node: VariableDeclaration, context: TransformerContext): VariableDeclarationSchema {
	// Get the nearest variable statement in order to read the jsdoc
	const variableStatement = findParent(node, tsModule.isVariableStatement) || node;
	const jsDoc = getJsDoc(variableStatement, tsModule);

	return {
		kind: "variable",
		name: node.name.getText(),
		description: jsDoc?.description,
		type: typeToTypeSchema(context.checker.getTypeAtLocation(node), context),
		summary: getSummaryFromJsDoc(jsDoc)
	};
}

/**
 * Returns Events for a declaration
 * @param declaration
 * @param context
 */
function componentDeclarationToEventSchema(declaration: ComponentDeclaration, context: TransformerContext): EventSchema[] {
	return filterVisibility(context.config.visibility, declaration.events).map(event => {
		const type = event.type?.() || { kind: "ANY" };
		const simpleType = isSimpleType(type) ? type : toSimpleType(type, context.checker);

		const typeName = simpleType.kind === "GENERIC_ARGUMENTS" ? simpleType.target.name : simpleType.name;
		const customEventDetailType = typeName === "CustomEvent" && simpleType.kind === "GENERIC_ARGUMENTS" ? simpleType.typeArguments[0] : undefined;

		return {
			description: event.jsDoc?.description,
			name: event.name,
			inheritedFrom: componentDeclarationToInheritedReferenceSchema(declaration, event, context),
			type: typeToTypeSchema(typeName == null || simpleType.kind === "ANY" ? "Event" : typeName, context) || { type: "Event" },
			detailType: customEventDetailType != null ? getTypeHintFromType(customEventDetailType, context.checker, context.config) : undefined
		};
	});
}

/**
 * Returns Slots for a declaration
 * @param declaration
 * @param context
 */
function componentDeclarationToSlotSchema(declaration: ComponentDeclaration, context: TransformerContext): SlotSchema[] {
	return declaration.slots.map(slot => ({
		description: slot.jsDoc?.description,
		name: slot.name || "",
		inheritedFrom: componentDeclarationToInheritedReferenceSchema(declaration, slot, context)
	}));
}

/**
 * Returns CSSProperties for a declaration
 * @param declaration
 * @param context
 */
function componentDeclarationToCSSPropertySchema(declaration: ComponentDeclaration, context: TransformerContext): CssCustomPropertySchema[] {
	return declaration.cssProperties.map(cssProperty => ({
		name: cssProperty.name,
		description: cssProperty.jsDoc?.description,
		type: cssProperty.typeHint,
		default: cssProperty.default != null ? JSON.stringify(cssProperty.default) : undefined,
		inheritedFrom: componentDeclarationToInheritedReferenceSchema(declaration, cssProperty, context)
	}));
}

/**
 * Returns CSSParts for a declaration
 * @param declaration
 * @param context
 */
function componentDeclarationToCSSPartSchema(declaration: ComponentDeclaration, context: TransformerContext): CssPartSchema[] {
	return declaration.cssParts.map(cssPart => ({
		name: cssPart.name,
		description: cssPart.jsDoc?.description,
		inheritedFrom: componentDeclarationToInheritedReferenceSchema(declaration, cssPart, context)
	}));
}

/**
 * Returns Attributes for a declaration
 * @param declaration
 * @param context
 */
function componentDeclarationToAttributeSchema(declaration: ComponentDeclaration, context: TransformerContext): AttributeSchema[] {
	const attributeDocs: AttributeSchema[] = [];

	for (const member of filterVisibility(context.config.visibility, declaration.members)) {
		if (member.attrName != null) {
			attributeDocs.push({
				name: member.attrName,
				fieldName: member.propName,
				defaultValue: member.default != null ? JSON.stringify(member.default) : undefined,
				description: member.jsDoc?.description,
				type: typeToTypeSchema(member.typeHint || member.type?.(), context),
				inheritedFrom: componentDeclarationToInheritedReferenceSchema(declaration, member, context)
			});
		}
	}

	return attributeDocs;
}

/**
 * Returns ClassMember for a declaration
 * @param declaration
 * @param context
 */
function componentDeclarationToClassMemberSchema(declaration: ComponentDeclaration, context: TransformerContext): ClassMemberSchema[] {
	return [...componentDeclarationToClassFieldSchema(declaration, context), ...componentDeclarationToClassMethodSchema(declaration, context)];
}

/**
 * Returns ClassMethod for a declaration
 * @param declaration
 * @param context
 */
function componentDeclarationToClassMethodSchema(declaration: ComponentDeclaration, context: TransformerContext): ClassMethodSchema[] {
	const methodDocs: ClassMethodSchema[] = [];

	for (const method of filterVisibility(context.config.visibility, declaration.methods)) {
		const parameters: ParameterSchema[] = [];
		let returnType: Type | undefined = undefined;

		const node = method.node;
		if (node !== undefined && tsModule.isMethodDeclaration(node)) {
			// Build a list of parameters
			for (const param of node.parameters) {
				const name = param.name.getText();

				const { description, typeHint } = getParameterFromJsDoc(name, method.jsDoc);

				parameters.push({
					name: name,
					type: typeToTypeSchema(typeHint || (param.type != null ? context.checker.getTypeAtLocation(param.type) : undefined), context),
					description: description
				});
			}

			// Get return type
			const signature = context.checker.getSignatureFromDeclaration(node);
			if (signature != null) {
				returnType = context.checker.getReturnTypeOfSignature(signature);
			}
		}

		// Get return info from jsdoc
		const { description: returnDescription, typeHint: returnTypeHint } = getReturnFromJsDoc(method.jsDoc);

		methodDocs.push({
			kind: "method",
			name: method.name,
			privacy: method.visibility,
			description: method.jsDoc?.description,
			parameters,
			return: {
				description: returnDescription,
				type: typeToTypeSchema(returnTypeHint || returnType, context)
			},
			inheritedFrom: componentDeclarationToInheritedReferenceSchema(declaration, method, context),
			summary: getSummaryFromJsDoc(method.jsDoc)
			// TODO: "static"
		});
	}

	return methodDocs;
}

/**
 * Returns FieldDocs from a declaration
 * @param declaration
 * @param context
 */
function componentDeclarationToClassFieldSchema(declaration: ComponentDeclaration, context: TransformerContext): ClassFieldSchema[] {
	const fieldDocs: ClassFieldSchema[] = [];

	for (const member of filterVisibility(context.config.visibility, declaration.members)) {
		if (member.propName != null) {
			fieldDocs.push({
				kind: "field",
				name: member.propName,
				privacy: member.visibility,
				description: member.jsDoc?.description,
				type: typeToTypeSchema(member.typeHint || member.type?.(), context),
				default: member.default != null ? JSON.stringify(member.default) : undefined,
				inheritedFrom: componentDeclarationToInheritedReferenceSchema(declaration, member, context),
				summary: getSummaryFromJsDoc(member.jsDoc)
				// TODO: "static"
			});
		}
	}

	return fieldDocs;
}

function componentDeclarationToInheritedReferenceSchema(
	onDeclaration: ComponentDeclaration,
	feature: ComponentFeatureBase,
	context: TransformerContext
): ReferenceSchema | undefined {
	if (feature.declaration != null && feature.declaration !== onDeclaration) {
		return nodeToReferenceSchema(feature.declaration.node, context);
	}

	return undefined;
}

/**
 * Returns a Reference to a node
 * @param node
 * @param context
 */
function nodeToReferenceSchema(node: Node | Symbol, context: TransformerContext): ReferenceSchema {
	if (!("getSourceFile" in node)) {
		node = resolveSymbolDeclaration(node, context);
	}

	const sourceFile = node.getSourceFile();
	const name = getNodeName(node, context) as string;

	// Test if the source file is from a typescript lib
	// TODO: Find a better way of checking this
	const isLib = sourceFile.isDeclarationFile && sourceFile.fileName.match(/typescript\/lib.*\.d\.ts$/) != null;
	if (isLib) {
		// Only return the name of the declaration if it's from lib
		return {
			name
		};
	}

	context.emitDeclaration(node);

	// Test if the source file is located in a package
	const packageName = getPackageName(sourceFile);
	if (packageName != null) {
		return {
			name,
			package: packageName
		};
	}

	// Get the module path name
	const module = getRelativePath(sourceFile.fileName, context);
	return {
		name,
		module
	};
}

/**
 * Returns the name of the package (if any)
 * @param sourceFile
 */
function getPackageName(sourceFile: SourceFile): string | undefined {
	// TODO: Make it possible to access the ModuleResolutionHost
	//  in order to resolve the package using "resolveModuleNames"
	//  The following approach is very, very naive and is only temporary.
	const match = sourceFile.fileName.match(/node_modules\/(.*?)\//);

	if (match != null) {
		return match[1];
	}

	return undefined;
}

/**
 * Returns a relative path based on "cwd" in the config
 * @param fullPath
 * @param context
 */
function getRelativePath(fullPath: string, context: TransformerContext) {
	return context.config.cwd != null ? `./${relative(context.config.cwd, fullPath)}` : basename(fullPath);
}

/**
 * Returns description and typeHint based on jsdoc for a specific parameter name
 * @param name
 * @param jsDoc
 */
function getParameterFromJsDoc(name: string, jsDoc: JsDoc | undefined): { description?: string; typeHint?: string } {
	if (jsDoc?.tags == undefined) {
		return {};
	}

	for (const tag of jsDoc.tags) {
		const parsed = tag.parsed();

		if (parsed.tag === "param" && parsed.name === name) {
			return { description: parsed.description, typeHint: parsed.type };
		}
	}

	return {};
}

/**
 * Get return description and return typeHint from jsdoc
 * @param jsDoc
 */
function getReturnFromJsDoc(jsDoc: JsDoc | undefined): { description?: string; typeHint?: string } {
	const tag = jsDoc?.tags?.find(tag => ["returns", "return"].includes(tag.tag));

	if (tag == null) {
		return {};
	}

	const parsed = tag.parsed();
	return { description: parsed.description, typeHint: parsed.type };
}

/**
 * Converts a heritage clause into a reference
 * @param heritage
 * @param context
 */
function heritageClauseToReferenceSchema(heritage: ComponentHeritageClause, context: TransformerContext): ReferenceSchema | undefined {
	const node = heritage.declaration?.node;
	const identifier = heritage.identifier;

	// Return a reference for this node if any
	if (node != null) {
		return nodeToReferenceSchema(node, context);
	}

	// Try to get declaration of the identifier if no node was found
	const [declaration] = resolveDeclarations(identifier, context);
	if (declaration != null) {
		return nodeToReferenceSchema(declaration, context);
	}

	// Just return the name of the reference if nothing could be resolved
	const name = getNodeName(identifier, context);
	if (name != null) {
		return { name };
	}

	return undefined;
}

/**
 * Flatten all analyzer results with inherited declarations
 * @param results
 */
function flattenAnalyzerResults(results: AnalyzerResult[]): AnalyzerResult[] {
	// Keep track of declarations in each source file
	const declarationMap = new Map<SourceFile, Set<ComponentDeclaration>>();

	/**
	 * Add a declaration to the declaration map
	 * @param declaration
	 */
	function addDeclarationToMap(declaration: ComponentDeclaration) {
		const sourceFile = declaration.node.getSourceFile();

		const exportDocs = declarationMap.get(sourceFile) || new Set();

		if (!declarationMap.has(sourceFile)) {
			declarationMap.set(sourceFile, exportDocs);
		}

		exportDocs.add(declaration);
	}

	for (const result of results) {
		for (const decl of result.declarations || []) {
			// Add all existing declarations to the map
			addDeclarationToMap(decl);

			visitAllHeritageClauses(decl, clause => {
				// Flatten all component declarations
				if (clause.declaration != null) {
					addDeclarationToMap(clause.declaration);
				}
			});
		}
	}

	// Return new results with flattened declarations
	return results.map(result => {
		const declarations = declarationMap.get(result.sourceFile);

		return {
			...result,
			declarations: declarations != null ? Array.from(declarations) : result.declarations
		};
	});
}

/**
 * Returns the content of the summary jsdoc tag if any
 * @param jsDoc
 */
function getSummaryFromJsDoc(jsDoc: JsDoc | undefined): string | undefined {
	const summaryTag = jsDoc?.tags?.find(tag => tag.tag === "summary");

	if (summaryTag == null) {
		return undefined;
	}

	return summaryTag.comment;
}

function resolveSymbolDeclaration(symbol: Symbol, context: TransformerContext, { resolveAlias }: { resolveAlias?: boolean } = {}): Declaration {
	if (resolveAlias && isAliasSymbol(symbol, context.ts)) {
		symbol = context.checker.getAliasedSymbol(symbol);
	}

	const decl = symbol.valueDeclaration || symbol.getDeclarations()?.[0];
	if (decl == null) {
		throw new Error(`Couldn't find declaration for symbol: ${symbol.name}`);
	}

	return decl;
}

/**
 * Converts a Typescript Type to a TypeSchema
 * @param type
 * @param context
 */
function typeToTypeSchema(type: string | Type | SimpleType | undefined, context: TransformerContext): TypeSchema | undefined {
	if (type == null) {
		return undefined;
	}

	const typeReferences: TypeReferenceSchema[] = [];

	if (typeof type !== "string" && "flags" in type && type.symbol != null) {
		// Emit the reference
		const declNode = resolveSymbolDeclaration(type.symbol, context);

		if (declNode != null) {
			const ref = nodeToReferenceSchema(declNode, context);

			typeReferences.push({
				...ref,
				start: declNode.getStart(),
				end: declNode.getEnd()
			});

			context.emitDeclaration(declNode);
		}
	}

	const typeHint = getTypeHintFromType(type, context.checker, context.config);

	if (typeHint == null) {
		return undefined;
	}

	return {
		type: typeHint,
		references: typeReferences.length > 0 ? typeReferences : undefined
	};
}
