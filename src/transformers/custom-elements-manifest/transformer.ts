import { basename, relative } from "path";
import * as tsModule from "typescript";
import { SimpleType } from "ts-simple-type";
import { Node, Program, SourceFile, Type, TypeChecker } from "typescript";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
import { ComponentDeclaration, ComponentHeritageClause } from "../../analyze/types/component-declaration";
import { ComponentFeatureBase } from "../../analyze/types/features/component-feature";
import { JsDoc } from "../../analyze/types/js-doc";
import { findParent, getNodeName, resolveDeclarations } from "../../analyze/util/ast-util";
import { getMixinHeritageClauses, getSuperclassHeritageClause, visitAllHeritageClauses } from "../../analyze/util/component-declaration-util";
import { getJsDoc } from "../../analyze/util/js-doc-util";
import { arrayDefined } from "../../util/array-util";
import { getTypeHintFromType } from "../../util/get-type-hint-from-type";
import { filterVisibility } from "../../util/model-util";
import { TransformerConfig } from "../transformer-config";
import { TransformerFunction } from "../transformer-function";
import * as schema from "./schema";

interface TransformerContext {
	config: TransformerConfig;
	checker: TypeChecker;
	program: Program;
	ts: typeof tsModule;
}

/**
 * Transforms results to a custom elements manifest
 * @param results
 * @param program
 * @param config
 */
export const transformer: TransformerFunction = (results: AnalyzerResult[], program: Program, config: TransformerConfig): string => {
	const context: TransformerContext = {
		config,
		checker: program.getTypeChecker(),
		program,
		ts: tsModule
	};

	// Flatten analyzer results expanding inherited declarations into the declaration array.
	const flattenedAnalyzerResults = flattenAnalyzerResults(results);

	// Transform all analyzer results into modules
	const modules = flattenedAnalyzerResults.map(result => resultToModule(result, context));

	const manifest: schema.Package = {
		schemaVersion: "experimental",
		modules
	};

	return JSON.stringify(manifest, null, 2);
};

/**
 * Transforms an analyzer result into a module
 * @param result
 * @param context
 */
function resultToModule(result: AnalyzerResult, context: TransformerContext): schema.JavaScriptModule {
	const exports = getExportsFromResult(result, context);
	const declarations = getDeclarationsFromResult(result, context);

	return {
		kind: "javascript-module",
		path: getRelativePath(result.sourceFile.fileName, context),
		declarations: declarations.length === 0 ? undefined : declarations,
		exports: exports.length === 0 ? undefined : exports
	};
}

/**
 * Returns exports in an analyzer result
 * @param result
 * @param context
 */
function getExportsFromResult(result: AnalyzerResult, context: TransformerContext): schema.Export[] {
	return [...getCustomElementExportsFromResult(result, context)];
}

/**
 * Returns declarations in an analyzer result
 * @param result
 * @param context
 */
function getDeclarationsFromResult(result: AnalyzerResult, context: TransformerContext): schema.Declaration[] {
	return [
		...getClassesFromResult(result, context),
		...getFunctionsFromResult(result, context),
		...getVariablesFromResult(result, context)
		// TODO (43081j):
		// ...getCustomElementsFromResult(result, context)
	];
}

/**
 * Returns functions in an analyzer result
 * @param result
 * @param context
 */
function getFunctionsFromResult(result: AnalyzerResult, context: TransformerContext): schema.FunctionDeclaration[] {
	// TODO: support function exports
	return [];
}

function* getCustomElementExportsFromResult(result: AnalyzerResult, context: TransformerContext): IterableIterator<schema.CustomElementExport> {
	for (const definition of result.componentDefinitions) {
		// It's not possible right now to model a tag name where the
		//   declaration couldn't be resolved because the "declaration" is required
		if (definition.declaration == null) {
			continue;
		}

		yield {
			kind: "custom-element-definition",
			name: definition.tagName,
			declaration: getReferenceForNode(definition.declaration.node, context)
		};
	}
}

/**
 * Returns variables in an analyzer result
 * @param result
 * @param context
 */
function* getVariablesFromResult(result: AnalyzerResult, context: TransformerContext): IterableIterator<schema.VariableDeclaration> {
	// Get all export symbols in the source file
	const symbol = context.checker.getSymbolAtLocation(result.sourceFile);
	if (symbol == null) {
		return;
	}

	const exports = context.checker.getExportsOfModule(symbol);

	// Convert all export variables to VariableDocs
	for (const exp of exports) {
		switch (exp.flags) {
			case tsModule.SymbolFlags.BlockScopedVariable:
			case tsModule.SymbolFlags.Variable: {
				const node = exp.valueDeclaration;

				if (tsModule.isVariableDeclaration(node)) {
					// Get the nearest variable statement in order to read the jsdoc
					const variableStatement = findParent(node, tsModule.isVariableStatement) || node;
					const jsDoc = getJsDoc(variableStatement, tsModule);

					yield {
						kind: "variable",
						name: node.name.getText(),
						description: jsDoc?.description,
						type: typeToSchemaType(context, context.checker.getTypeAtLocation(node)),
						summary: getSummaryFromJsDoc(jsDoc)
					};
				}
				break;
			}
		}
	}
}

/**
 * Returns classes in an analyzer result
 * @param result
 * @param context
 */
function* getClassesFromResult(result: AnalyzerResult, context: TransformerContext): IterableIterator<schema.Declaration> {
	if (result.declarations) {
		for (const decl of result.declarations) {
			const doc = getDeclarationFromDeclaration(decl, result, context);
			if (doc) {
				yield doc;
			}
		}
	}
}

/**
 * Converts a component declaration to schema declaration
 * @param declaration
 * @param result
 * @param context
 */
function getDeclarationFromDeclaration(
	declaration: ComponentDeclaration,
	result: AnalyzerResult,
	context: TransformerContext
): schema.Declaration | undefined {
	if (declaration.kind === "interface") {
		return undefined;
	}

	// Get the superclass of this declaration
	const superclassHeritage = getSuperclassHeritageClause(declaration);
	const superclassRef = superclassHeritage === undefined ? undefined : getReferenceFromHeritageClause(superclassHeritage, context);

	// Get all mixins
	const mixinHeritage = getMixinHeritageClauses(declaration);
	const mixinRefs = arrayDefined(mixinHeritage.map(h => getReferenceFromHeritageClause(h, context)));

	const members = getClassMembersForDeclaration(declaration, context);

	const classDecl: schema.ClassDeclaration = {
		kind: "class",
		superclass: superclassRef,
		mixins: mixinRefs.length > 0 ? mixinRefs : undefined,
		description: declaration.jsDoc?.description,
		name: declaration.symbol?.name || getNodeName(declaration.node, { ts: tsModule }) || "",
		members: members.length > 0 ? members : undefined,
		summary: getSummaryFromJsDoc(declaration.jsDoc)
	};

	return classDecl;
}

/**
 * Returns class member docs for a declaration
 * @param declaration
 * @param context
 */
function getClassMembersForDeclaration(declaration: ComponentDeclaration, context: TransformerContext): schema.ClassMember[] {
	return [...getClassFieldsForDeclaration(declaration, context), ...getMethodsForDeclaration(declaration, context)];
}

/**
 * Returns method docs for a declaration
 * @param declaration
 * @param context
 */
function* getMethodsForDeclaration(declaration: ComponentDeclaration, context: TransformerContext): IterableIterator<schema.ClassMethod> {
	for (const method of filterVisibility(context.config.visibility, declaration.methods)) {
		const parameters: schema.Parameter[] = [];
		const node = method.node;
		let returnType: Type | undefined = undefined;

		if (node !== undefined && tsModule.isMethodDeclaration(node)) {
			for (const param of node.parameters) {
				const name = param.name.getText();
				const { description, typeHint } = getParameterFromJsDoc(name, method.jsDoc);

				parameters.push({
					name: name,
					type: typeToSchemaType(context, typeHint || (param.type != null ? context.checker.getTypeAtLocation(param.type) : undefined)),
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
		const { description: returnDescription, typeHint: returnTypeHint } = getReturnFromJsDoc(method.jsDoc);

		yield {
			kind: "method",
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
 * Returns fields from a declaration
 * @param declaration
 * @param context
 */
function* getClassFieldsForDeclaration(declaration: ComponentDeclaration, context: TransformerContext): IterableIterator<schema.ClassField> {
	for (const member of filterVisibility(context.config.visibility, declaration.members)) {
		if (member.propName != null) {
			yield {
				kind: "field",
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

function getInheritedFromReference(
	onDeclaration: ComponentDeclaration,
	feature: ComponentFeatureBase,
	context: TransformerContext
): schema.Reference | undefined {
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
function getReferenceForNode(node: Node, context: TransformerContext): schema.Reference {
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
function getReferenceFromHeritageClause(heritage: ComponentHeritageClause, context: TransformerContext): schema.Reference | undefined {
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

function typeToSchemaType(context: TransformerContext, type: string | Type | SimpleType | undefined): schema.Type | undefined {
	const hint = getTypeHintFromType(type, context.checker, context.config);

	if (!hint) {
		return undefined;
	}

	return {
		text: hint
	};
}
