import { basename, relative } from "path";
import * as tsModule from "typescript";
import { Node, Program, SourceFile, Type, TypeChecker } from "typescript";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
import { ComponentDeclaration } from "../../analyze/types/component-declaration";
import { JsDoc } from "../../analyze/types/js-doc";
import { findParent } from "../../analyze/util/ast-util";
import { getJsDoc } from "../../analyze/util/js-doc-util";
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

/**
 * Transforms results to json using the schema found in the PR at https://github.com/webcomponents/custom-elements-json/pull/9
 * @param results
 * @param program
 * @param config
 */
export const json2Transformer: TransformerFunction = (results: AnalyzerResult[], program: Program, config: TransformerConfig): string => {
	const checker = program.getTypeChecker();

	// Transform all analyzer results into modules
	const modules = results.map(result => analyzerResultToModuleDoc(result, checker, config));

	const htmlData: PackageDoc = {
		version: "experimental",
		modules
	};

	return JSON.stringify(htmlData, null, 2);
};

/**
 * Transforms an analyzer result into a module doc
 * @param result
 * @param checker
 * @param config
 */
function analyzerResultToModuleDoc(result: AnalyzerResult, checker: TypeChecker, config: TransformerConfig): ModuleDoc {
	// Get all export docs from the analyzer result
	const exports = getExportsDocsFromAnalyzerResult(result, checker, config);

	return {
		path: getRelativePath(result.sourceFile.fileName, config),
		exports: exports.length === 0 ? undefined : exports
	};
}

/**
 * Returns ExportDocs in an analyzer result
 * @param result
 * @param checker
 * @param config
 */
function getExportsDocsFromAnalyzerResult(result: AnalyzerResult, checker: TypeChecker, config: TransformerConfig): ExportDoc[] {
	// Return all class- and variable-docs
	return [
		...getClassDocsFromAnalyzerResult(result, checker, config),
		...getVariableDocsFromAnalyzerResult(result, checker, config),
		...getFunctionDocsFromAnalyzerResult(result, checker, config)
	];
}

/**
 * Returns FunctionDocs in an analyzer result
 * @param result
 * @param checker
 * @param config
 */
function getFunctionDocsFromAnalyzerResult(result: AnalyzerResult, checker: TypeChecker, config: TransformerConfig): FunctionDoc[] {
	// TODO: support function exports
	return [];
}

/**
 * Returns VariableDocs in an analyzer result
 * @param result
 * @param checker
 * @param config
 */
function getVariableDocsFromAnalyzerResult(result: AnalyzerResult, checker: TypeChecker, config: TransformerConfig): VariableDoc[] {
	const varDocs: VariableDoc[] = [];

	// Get all export symbols in the source file
	const symbol = checker.getSymbolAtLocation(result.sourceFile)!;
	const exports = checker.getExportsOfModule(symbol);

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

					varDocs.push({
						kind: "variable",
						name: node.name.getText(),
						description: jsDoc?.description,
						type: getTypeHintFromType(checker.getTypeAtLocation(node), checker, config)
						// TODO: "summary"
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
 * @param checker
 * @param config
 */
function getClassDocsFromAnalyzerResult(
	result: AnalyzerResult,
	checker: TypeChecker,
	config: TransformerConfig
): (ClassDoc | CustomElementDoc | MixinDoc)[] {
	const classDocs: ClassDoc[] = [];

	// Convert all declarations to class docs
	for (const decl of result.declarations || []) {
		const doc = getExportsDocFromDeclaration(decl, result, checker, config);
		classDocs.push(doc);
	}

	return classDocs;
}

/**
 * Converts a component declaration to ClassDoc, CustomElementDoc or MixinDoc
 * @param declaration
 * @param result
 * @param checker
 * @param config
 */
function getExportsDocFromDeclaration(
	declaration: ComponentDeclaration,
	result: AnalyzerResult,
	checker: TypeChecker,
	config: TransformerConfig
): ClassDoc | CustomElementDoc | MixinDoc {
	// Get all mixins from the inheritance tree
	//const mixins = declaration.inheritanceTree.inherits?.filter(i => i.kind === "mixin");

	// Get all superclasses from the inheritance tree
	const superclass = declaration.inheritanceTree.inherits?.filter(i => i.kind === "class")?.[0];
	const superclassNode = superclass?.resolved?.[0]?.node;
	const superclassRef =
		superclassNode != null ? getReference(superclassNode, config) : superclass != null ? { name: superclass.identifier.getText() } : undefined;

	const classDoc: ClassDoc = {
		kind: "class",
		superclass: superclassRef,
		// TODO: implement support for outputting mixins
		/*mixins:
			mixins != null
				? arrayDefined(
						mixins.map(mixin => {
							const node = mixin.resolved?.[0]?.node;
							return node != null ? getReference(node, config) : undefined;
						})
				  )
				: undefined,*/
		description: declaration.jsDoc?.description,
		name: getNameFromDeclarationNode(declaration.node)!,
		members: getClassMemberDocsFromDeclaration(declaration, checker, config)
		// TODO: "summary"
	};

	// Find the first corresponding custom element definition for this declaration
	const definition = result.componentDefinitions.find(def => def.declaration().node === declaration.node);

	if (definition != null) {
		// Return a custom element doc if a definition was found
		const customElementDoc: CustomElementDoc = {
			...classDoc,
			tagName: definition.tagName,
			events: getEventDocsFromDeclaration(declaration, checker, config),
			slots: getSlotDocsFromDeclaration(declaration, checker, config),
			attributes: getAttributeDocsFromDeclaration(declaration, checker, config),
			cssProperties: getCSSPropertyDocsFromDeclaration(declaration, checker, config),
			cssParts: getCSSPartDocsFromDeclaration(declaration, checker, config)
		};

		return customElementDoc;
	}

	return classDoc;
}

/**
 * Returns event docs for a declaration
 * @param declaration
 * @param checker
 * @param config
 */
function getEventDocsFromDeclaration(declaration: ComponentDeclaration, checker: TypeChecker, config: TransformerConfig): EventDoc[] {
	return filterVisibility(config.visibility, declaration.events).map(event => ({
		description: event.jsDoc?.description,
		name: event.name,
		detailType: getTypeHintFromType(event.typeHint || event.type?.(), checker, config),
		type: "Event"
		// TODO: missing "type"
	}));
}

/**
 * Returns slot docs for a declaration
 * @param declaration
 * @param checker
 * @param config
 */
function getSlotDocsFromDeclaration(declaration: ComponentDeclaration, checker: TypeChecker, config: TransformerConfig): SlotDoc[] {
	return declaration.slots.map(slot => ({
		description: slot.jsDoc?.description,
		name: slot.name || ""
	}));
}

/**
 * Returns css properties for a declaration
 * @param declaration
 * @param checker
 * @param config
 */
function getCSSPropertyDocsFromDeclaration(declaration: ComponentDeclaration, checker: TypeChecker, config: TransformerConfig): CSSPropertyDoc[] {
	return declaration.cssProperties.map(cssProperty => ({
		name: cssProperty.name,
		description: cssProperty.jsDoc?.description,
		type: cssProperty.typeHint,
		default: cssProperty.default != null ? JSON.stringify(cssProperty.default) : undefined
	}));
}

/**
 * Returns css parts for a declaration
 * @param declaration
 * @param checker
 * @param config
 */
function getCSSPartDocsFromDeclaration(declaration: ComponentDeclaration, checker: TypeChecker, config: TransformerConfig): CSSPartDoc[] {
	return declaration.cssParts.map(cssPart => ({
		name: cssPart.name,
		description: cssPart.jsDoc?.description
	}));
}

/**
 * Returns attribute docs for a declaration
 * @param declaration
 * @param checker
 * @param config
 */
function getAttributeDocsFromDeclaration(declaration: ComponentDeclaration, checker: TypeChecker, config: TransformerConfig): AttributeDoc[] {
	const attributeDocs: AttributeDoc[] = [];

	for (const member of filterVisibility(config.visibility, declaration.members)) {
		if (member.attrName != null) {
			attributeDocs.push({
				name: member.attrName,
				fieldName: member.propName,
				defaultValue: member.default != null ? JSON.stringify(member.default) : undefined,
				description: member.jsDoc?.description,
				type: getTypeHintFromType(member.typeHint || member.type?.(), checker, config)
			});
		}
	}

	return attributeDocs;
}

/**
 * Returns class member docs for a declaration
 * @param declaration
 * @param checker
 * @param config
 */
function getClassMemberDocsFromDeclaration(declaration: ComponentDeclaration, checker: TypeChecker, config: TransformerConfig): ClassMember[] {
	return [...getFieldDocsFromDeclaration(declaration, checker, config), ...getMethodDocsFromDeclaration(declaration, checker, config)];
}

/**
 * Returns method docs for a declaration
 * @param declaration
 * @param checker
 * @param config
 */
function getMethodDocsFromDeclaration(declaration: ComponentDeclaration, checker: TypeChecker, config: TransformerConfig): MethodDoc[] {
	const methodDocs: MethodDoc[] = [];

	for (const method of filterVisibility(config.visibility, declaration.methods)) {
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
					type: getTypeHintFromType(typeHint || (param.type != null ? checker.getTypeAtLocation(param.type) : undefined), checker, config),
					description: description
				});
			}

			// Get return type
			const signature = checker.getSignatureFromDeclaration(node);
			if (signature != null) {
				returnType = checker.getReturnTypeOfSignature(signature);
			}
		}

		// Get return info from jsdoc
		const { description: returnDescription, typeHint: returnTypeHint } = getReturnFromJsDoc(method.jsDoc);

		methodDocs.push({
			kind: "method",
			name: method.name,
			privacy: method.visibility,
			type: getTypeHintFromMethod(method, checker),
			description: method.jsDoc?.description,
			parameters,
			return: {
				description: returnDescription,
				type: getTypeHintFromType(returnTypeHint || returnType, checker, config)
			}
			// TODO: "summary" and "static"
		});
	}

	return methodDocs;
}

/**
 * Returns field docs from a declaration
 * @param declaration
 * @param checker
 * @param config
 */
function getFieldDocsFromDeclaration(declaration: ComponentDeclaration, checker: TypeChecker, config: TransformerConfig): FieldDoc[] {
	const fieldDocs: FieldDoc[] = [];

	for (const member of filterVisibility(config.visibility, declaration.members)) {
		if (member.propName != null) {
			fieldDocs.push({
				kind: "field",
				name: member.propName,
				privacy: member.visibility,
				description: member.jsDoc?.description,
				type: getTypeHintFromType(member.typeHint || member.type?.(), checker, config),
				default: member.default != null ? JSON.stringify(member.default) : undefined
				// TODO: "static" and "summary"
			});
		}
	}

	return fieldDocs;
}

/**
 * Returns a Reference to a node
 * @param node
 * @param config
 */
function getReference(node: Node, config: TransformerConfig): Reference {
	const sourceFile = node.getSourceFile();
	const name = getNameFromDeclarationNode(node) as string;

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
	const module = getRelativePath(sourceFile.fileName, config);
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
 * @param config
 */
function getRelativePath(fullPath: string, config: TransformerConfig) {
	return config.cwd != null ? `./${relative(config.cwd, fullPath)}` : basename(fullPath);
}

/**
 * Returns the name of a given node
 * @param node
 */
function getNameFromDeclarationNode(node: Node): string | undefined {
	if (tsModule.isInterfaceDeclaration(node) || tsModule.isClassDeclaration(node) || tsModule.isFunctionDeclaration(node)) {
		return node.name?.text;
	}

	return undefined;
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
