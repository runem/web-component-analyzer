import { basename, relative } from "path";
import { isSimpleType, toSimpleType } from "ts-simple-type";
import * as tsModule from "typescript";
import { Node, Program, SourceFile, Type, TypeChecker } from "typescript";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
import { ComponentDeclaration, ComponentHeritageClause } from "../../analyze/types/component-declaration";
import { ComponentFeatureBase } from "../../analyze/types/features/component-feature";
import { JsDoc } from "../../analyze/types/js-doc";
import { findParent, getNodeName, resolveDeclarations } from "../../analyze/util/ast-util";
import { getMixinHeritageClauses, getSuperclassHeritageClause, visitAllHeritageClauses } from "../../analyze/util/component-declaration-util";
import { getJsDoc } from "../../analyze/util/js-doc-util";
import { arrayDefined } from "../../util/array-util";
import { getTypeHintFromMethod } from "../../util/get-type-hint-from-method";
import { getTypeHintFromType } from "../../util/get-type-hint-from-type";
import { filterVisibility } from "../../util/model-util";
import { TransformerConfig } from "../transformer-config";
import { TransformerFunction } from "../transformer-function";
import {
	AttributeDoc,
	ClassDoc,
	ClassMember,
	CSSPartDoc,
	CSSPropertyDoc,
	CustomElementDefinitionDoc,
	CustomElementDoc,
	EventDoc,
	ExportDoc,
	FieldDoc,
	FunctionDoc,
	MethodDoc,
	MixinDoc,
	ModuleDoc,
	PackageDoc,
	Parameter,
	Reference,
	SlotDoc,
	VariableDoc
} from "./schema";

interface TransformerContext {
	config: TransformerConfig;
	checker: TypeChecker;
	program: Program;
	ts: typeof tsModule;
}

/**
 * Transforms results to json using the schema found in the PR at https://github.com/webcomponents/custom-elements-json/pull/9
 * @param results
 * @param program
 * @param config
 */
export const json2Transformer: TransformerFunction = (results: AnalyzerResult[], program: Program, config: TransformerConfig): string => {
	const context: TransformerContext = {
		config,
		checker: program.getTypeChecker(),
		program,
		ts: tsModule
	};

	// Flatten analyzer results expanding inherited declarations into the declaration array.
	const flattenedAnalyzerResults = flattenAnalyzerResults(results);

	// Transform all analyzer results into modules
	const modules = flattenedAnalyzerResults.map(result => analyzerResultToModuleDoc(result, context));

	const htmlData: PackageDoc = {
		version: "experimental",
		modules
	};

	return JSON.stringify(htmlData, null, 2);
};

/**
 * Transforms an analyzer result into a module doc
 * @param result
 * @param context
 */
function analyzerResultToModuleDoc(result: AnalyzerResult, context: TransformerContext): ModuleDoc {
	// Get all export docs from the analyzer result
	const exports = getExportsDocsFromAnalyzerResult(result, context);

	return {
		path: getRelativePath(result.sourceFile.fileName, context),
		exports: exports.length === 0 ? undefined : exports
	};
}

/**
 * Returns ExportDocs in an analyzer result
 * @param result
 * @param context
 */
function getExportsDocsFromAnalyzerResult(result: AnalyzerResult, context: TransformerContext): ExportDoc[] {
	// Return all class- and variable-docs
	return [
		...getDefinitionDocsFromAnalyzerResult(result, context),
		...getClassDocsFromAnalyzerResult(result, context),
		...getVariableDocsFromAnalyzerResult(result, context),
		...getFunctionDocsFromAnalyzerResult(result, context)
	];
}

/**
 * Returns FunctionDocs in an analyzer result
 * @param result
 * @param context
 */
function getFunctionDocsFromAnalyzerResult(result: AnalyzerResult, context: TransformerContext): FunctionDoc[] {
	// TODO: support function exports
	return [];
}

function getDefinitionDocsFromAnalyzerResult(result: AnalyzerResult, context: TransformerContext): CustomElementDefinitionDoc[] {
	return arrayDefined(
		result.componentDefinitions.map(definition => {
			// It's not possible right now to model a tag name where the
			//   declaration couldn't be resolved because the "declaration" is required
			if (definition.declaration == null) {
				return undefined;
			}

			return {
				kind: "definition",
				name: definition.tagName,
				declaration: getReferenceForNode(definition.declaration.node, context)
			};
		})
	);
}

/**
 * Returns VariableDocs in an analyzer result
 * @param result
 * @param context
 */
function getVariableDocsFromAnalyzerResult(result: AnalyzerResult, context: TransformerContext): VariableDoc[] {
	const varDocs: VariableDoc[] = [];

	// Get all export symbols in the source file
	const symbol = context.checker.getSymbolAtLocation(result.sourceFile)!;
	if (symbol == null) {
		return [];
	}

	const exports = context.checker.getExportsOfModule(symbol);

	// Convert all export variables to VariableDocs
	for (const exp of exports) {
		switch (exp.flags) {
			case tsModule.SymbolFlags.BlockScopedVariable:
			case tsModule.SymbolFlags.Variable: {
				const node = exp.valueDeclaration;

				if (node && tsModule.isVariableDeclaration(node)) {
					// Get the nearest variable statement in order to read the jsdoc
					const variableStatement = findParent(node, tsModule.isVariableStatement) || node;
					const jsDoc = getJsDoc(variableStatement, tsModule);

					varDocs.push({
						kind: "variable",
						name: node.name.getText(),
						description: jsDoc?.description,
						type: getTypeHintFromType(context.checker.getTypeAtLocation(node), context.checker, context.config),
						summary: getSummaryFromJsDoc(jsDoc)
					});
				}
				break;
			}
		}
	}

	return varDocs;
}

/**
 * Returns ClassDocs in an analyzer result
 * @param result
 * @param context
 */
function getClassDocsFromAnalyzerResult(result: AnalyzerResult, context: TransformerContext): (ClassDoc | CustomElementDoc | MixinDoc)[] {
	const classDocs: ClassDoc[] = [];

	// Convert all declarations to class docs
	for (const decl of result.declarations || []) {
		const doc = getExportsDocFromDeclaration(decl, result, context);
		if (doc != null) {
			classDocs.push(doc);
		}
	}

	return classDocs;
}

/**
 * Converts a component declaration to ClassDoc, CustomElementDoc or MixinDoc
 * @param declaration
 * @param result
 * @param context
 */
function getExportsDocFromDeclaration(
	declaration: ComponentDeclaration,
	result: AnalyzerResult,
	context: TransformerContext
): ClassDoc | CustomElementDoc | MixinDoc | undefined {
	// Only include "mixin" and "class" in the output. Interfaces are not outputted..
	if (declaration.kind === "interface") {
		return undefined;
	}

	// Get the superclass of this declaration
	const superclassHeritage = getSuperclassHeritageClause(declaration);
	const superclassRef = superclassHeritage == null ? undefined : getReferenceFromHeritageClause(superclassHeritage, context);

	// Get all mixins
	const mixinHeritage = getMixinHeritageClauses(declaration);
	const mixinRefs = arrayDefined(mixinHeritage.map(h => getReferenceFromHeritageClause(h, context)));

	const members = getClassMemberDocsFromDeclaration(declaration, context);

	const classDoc: ClassDoc | MixinDoc = {
		kind: "class",
		superclass: superclassRef,
		mixins: mixinRefs.length > 0 ? mixinRefs : undefined,
		description: declaration.jsDoc?.description,
		name: declaration.symbol?.name || getNodeName(declaration.node, { ts: tsModule }) || "",
		members: members.length > 0 ? members : undefined,
		summary: getSummaryFromJsDoc(declaration.jsDoc)
	};

	// Find the first corresponding custom element definition for this declaration
	const definition = result.componentDefinitions.find(def => def.declaration?.node === declaration.node);

	if (definition != null) {
		const events = getEventDocsFromDeclaration(declaration, context);
		const slots = getSlotDocsFromDeclaration(declaration, context);
		const attributes = getAttributeDocsFromDeclaration(declaration, context);
		const cssProperties = getCSSPropertyDocsFromDeclaration(declaration, context);
		const cssParts = getCSSPartDocsFromDeclaration(declaration, context);

		// Return a custom element doc if a definition was found
		const customElementDoc: CustomElementDoc = {
			...classDoc,
			tagName: definition.tagName,
			events: events.length > 0 ? events : undefined,
			slots: slots.length > 0 ? slots : undefined,
			attributes: attributes.length > 0 ? attributes : undefined,
			cssProperties: cssProperties.length > 0 ? cssProperties : undefined,
			cssParts: cssParts.length > 0 ? cssParts : undefined
		};

		return customElementDoc;
	}

	return classDoc;
}

/**
 * Returns event docs for a declaration
 * @param declaration
 * @param context
 */
function getEventDocsFromDeclaration(declaration: ComponentDeclaration, context: TransformerContext): EventDoc[] {
	return filterVisibility(context.config.visibility, declaration.events).map(event => {
		const type = event.type?.() || { kind: "ANY" };
		const simpleType = isSimpleType(type) ? type : toSimpleType(type, context.checker);

		const typeName = simpleType.kind === "GENERIC_ARGUMENTS" ? simpleType.target.name : simpleType.name;
		const customEventDetailType = typeName === "CustomEvent" && simpleType.kind === "GENERIC_ARGUMENTS" ? simpleType.typeArguments[0] : undefined;

		return {
			description: event.jsDoc?.description,
			name: event.name,
			inheritedFrom: getInheritedFromReference(declaration, event, context),
			type: typeName == null || simpleType.kind === "ANY" ? "Event" : typeName,
			detailType: customEventDetailType != null ? getTypeHintFromType(customEventDetailType, context.checker, context.config) : undefined
		};
	});
}

/**
 * Returns slot docs for a declaration
 * @param declaration
 * @param context
 */
function getSlotDocsFromDeclaration(declaration: ComponentDeclaration, context: TransformerContext): SlotDoc[] {
	return declaration.slots.map(slot => ({
		description: slot.jsDoc?.description,
		name: slot.name || "",
		inheritedFrom: getInheritedFromReference(declaration, slot, context)
	}));
}

/**
 * Returns css properties for a declaration
 * @param declaration
 * @param context
 */
function getCSSPropertyDocsFromDeclaration(declaration: ComponentDeclaration, context: TransformerContext): CSSPropertyDoc[] {
	return declaration.cssProperties.map(cssProperty => ({
		name: cssProperty.name,
		description: cssProperty.jsDoc?.description,
		type: cssProperty.typeHint,
		default: cssProperty.default != null ? JSON.stringify(cssProperty.default) : undefined,
		inheritedFrom: getInheritedFromReference(declaration, cssProperty, context)
	}));
}

/**
 * Returns css parts for a declaration
 * @param declaration
 * @param context
 */
function getCSSPartDocsFromDeclaration(declaration: ComponentDeclaration, context: TransformerContext): CSSPartDoc[] {
	return declaration.cssParts.map(cssPart => ({
		name: cssPart.name,
		description: cssPart.jsDoc?.description,
		inheritedFrom: getInheritedFromReference(declaration, cssPart, context)
	}));
}

/**
 * Returns attribute docs for a declaration
 * @param declaration
 * @param context
 */
function getAttributeDocsFromDeclaration(declaration: ComponentDeclaration, context: TransformerContext): AttributeDoc[] {
	const attributeDocs: AttributeDoc[] = [];

	for (const member of filterVisibility(context.config.visibility, declaration.members)) {
		if (member.attrName != null) {
			attributeDocs.push({
				name: member.attrName,
				fieldName: member.propName,
				defaultValue: member.default != null ? JSON.stringify(member.default) : undefined,
				description: member.jsDoc?.description,
				type: getTypeHintFromType(member.typeHint || member.type?.(), context.checker, context.config),
				inheritedFrom: getInheritedFromReference(declaration, member, context)
			});
		}
	}

	return attributeDocs;
}

/**
 * Returns class member docs for a declaration
 * @param declaration
 * @param context
 */
function getClassMemberDocsFromDeclaration(declaration: ComponentDeclaration, context: TransformerContext): ClassMember[] {
	return [...getFieldDocsFromDeclaration(declaration, context), ...getMethodDocsFromDeclaration(declaration, context)];
}

/**
 * Returns method docs for a declaration
 * @param declaration
 * @param context
 */
function getMethodDocsFromDeclaration(declaration: ComponentDeclaration, context: TransformerContext): MethodDoc[] {
	const methodDocs: MethodDoc[] = [];

	for (const method of filterVisibility(context.config.visibility, declaration.methods)) {
		const parameters: Parameter[] = [];
		let returnType: Type | undefined = undefined;

		const node = method.node;
		if (node !== undefined && tsModule.isMethodDeclaration(node)) {
			// Build a list of parameters
			for (const param of node.parameters) {
				const name = param.name.getText();

				const { description, typeHint } = getParameterFromJsDoc(name, method.jsDoc);

				parameters.push({
					name: name,
					type: getTypeHintFromType(
						typeHint || (param.type != null ? context.checker.getTypeAtLocation(param.type) : undefined),
						context.checker,
						context.config
					),
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
			type: getTypeHintFromMethod(method, context.checker),
			description: method.jsDoc?.description,
			parameters,
			return: {
				description: returnDescription,
				type: getTypeHintFromType(returnTypeHint || returnType, context.checker, context.config)
			},
			inheritedFrom: getInheritedFromReference(declaration, method, context),
			summary: getSummaryFromJsDoc(method.jsDoc)
			// TODO: "static"
		});
	}

	return methodDocs;
}

/**
 * Returns field docs from a declaration
 * @param declaration
 * @param context
 */
function getFieldDocsFromDeclaration(declaration: ComponentDeclaration, context: TransformerContext): FieldDoc[] {
	const fieldDocs: FieldDoc[] = [];

	for (const member of filterVisibility(context.config.visibility, declaration.members)) {
		if (member.propName != null) {
			fieldDocs.push({
				kind: "field",
				name: member.propName,
				privacy: member.visibility,
				description: member.jsDoc?.description,
				type: getTypeHintFromType(member.typeHint || member.type?.(), context.checker, context.config),
				default: member.default != null ? JSON.stringify(member.default) : undefined,
				inheritedFrom: getInheritedFromReference(declaration, member, context),
				summary: getSummaryFromJsDoc(member.jsDoc)
				// TODO: "static"
			});
		}
	}

	return fieldDocs;
}

function getInheritedFromReference(
	onDeclaration: ComponentDeclaration,
	feature: ComponentFeatureBase,
	context: TransformerContext
): Reference | undefined {
	if (feature.declaration != null && feature.declaration !== onDeclaration) {
		return getReferenceForNode(feature.declaration.node, context);
	}

	return undefined;
}

/**
 * Returns a Reference to a node
 * @param node
 * @param context
 */
function getReferenceForNode(node: Node, context: TransformerContext): Reference {
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
function getReferenceFromHeritageClause(heritage: ComponentHeritageClause, context: TransformerContext): Reference | { name: string } | undefined {
	const node = heritage.declaration?.node;
	const identifier = heritage.identifier;

	// Return a reference for this node if any
	if (node != null) {
		return getReferenceForNode(node, context);
	}

	// Try to get declaration of the identifier if no node was found
	const [declaration] = resolveDeclarations(identifier, context);
	if (declaration != null) {
		return getReferenceForNode(declaration, context);
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
