import * as tsModule from "typescript";
import { Program, SourceFile } from "typescript";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
import { ComponentDeclaration } from "../../analyze/types/component-declaration";
import { visitAllHeritageClauses } from "../../analyze/util/component-declaration-util";
import { TransformerConfig } from "../transformer-config";
import { TransformerFunction } from "../transformer-function";
import * as schema from "./schema";
import { TransformerContext } from "../transformer-context";
import { getExportsFromResult } from "./get-exports";
import { getDeclarationsFromResult } from "./get-declarations";
import { getRelativePath } from "./utils";

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
		schemaVersion: "1.0.0",
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
