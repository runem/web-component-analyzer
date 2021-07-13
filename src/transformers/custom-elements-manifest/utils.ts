import { basename, relative } from "path";
import { SimpleType } from "ts-simple-type";
import { Node, SourceFile, Type } from "typescript";
import { TransformerContext } from "../transformer-context";
import { JsDoc } from "../../analyze/types/js-doc";
import * as schema from "./schema";
import { getNodeName, resolveDeclarations } from "../../analyze/util/ast-util";
import { ComponentDeclaration, ComponentHeritageClause } from "../../analyze/types/component-declaration";
import { ComponentFeatureBase } from "../../analyze/types/features/component-feature";
import { getTypeHintFromType } from "../../util/get-type-hint-from-type";

/**
 * Returns a Reference to a node
 * @param node
 * @param context
 */
export function getReferenceForNode(node: Node, context: TransformerContext): schema.Reference {
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

export function getInheritedFromReference(
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
 * Returns a relative path based on "cwd" in the config
 * @param fullPath
 * @param context
 */
export function getRelativePath(fullPath: string, context: TransformerContext): string {
	return context.config.cwd != null ? `./${relative(context.config.cwd, fullPath)}` : basename(fullPath);
}

/**
 * Returns the name of the package (if any)
 * @param sourceFile
 */
export function getPackageName(sourceFile: SourceFile): string | undefined {
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
 * Returns description and typeHint based on jsdoc for a specific parameter name
 * @param name
 * @param jsDoc
 */
export function getParameterFromJsDoc(name: string, jsDoc: JsDoc | undefined): { description?: string; typeHint?: string } {
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
export function getReturnFromJsDoc(jsDoc: JsDoc | undefined): { description?: string; typeHint?: string } {
	const tag = jsDoc?.tags?.find(tag => ["returns", "return"].includes(tag.tag));

	if (tag == null) {
		return {};
	}

	const parsed = tag.parsed();
	return { description: parsed.description, typeHint: parsed.type };
}

/**
 * Converts a typescript type to a schema type
 * @param context
 * @param type
 */
export function typeToSchemaType(context: TransformerContext, type: string | Type | SimpleType | undefined): schema.Type | undefined {
	const hint = getTypeHintFromType(type, context.checker, context.config);

	if (!hint) {
		return undefined;
	}

	return {
		text: hint
	};
}

/**
 * Returns the content of the summary jsdoc tag if any
 * @param jsDoc
 */
export function getSummaryFromJsDoc(jsDoc: JsDoc | undefined): string | undefined {
	const summaryTag = jsDoc?.tags?.find(tag => tag.tag === "summary");

	if (summaryTag == null) {
		return undefined;
	}

	return summaryTag.comment;
}

/**
 * Converts a heritage clause into a reference
 * @param heritage
 * @param context
 */
export function getReferenceFromHeritageClause(heritage: ComponentHeritageClause, context: TransformerContext): schema.Reference | undefined {
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
