import * as tsModule from "typescript";
import { SourceFile, TypeChecker } from "typescript";
import { CustomElementFlavor } from "./flavors/custom-element/custom-element-flavor";
import { JsDocFlavor } from "./flavors/js-doc/js-doc-flavor";
import { LitElementFlavor } from "./flavors/lit-element/lit-element-flavor";
import { FlavorVisitContext, ParseComponentFlavor } from "./flavors/parse-component-flavor";
import { StencilFlavor } from "./flavors/stencil/stencil-flavor";
import { parseComponentDefinitions } from "./parse/parse-definitions";
import { parseGlobalEvents } from "./parse/parse-global-events";
import { ComponentDefinition } from "./types/component-definition";
import { ComponentDiagnostic } from "./types/component-diagnostic";
import { EventDeclaration } from "./types/event-types";

const DEFAULT_FLAVORS = [new LitElementFlavor(), new CustomElementFlavor(), new JsDocFlavor(), new StencilFlavor()];

/**
 * Options to give when analyzing components
 */
export interface AnalyzeComponentsOptions {
	checker: TypeChecker;
	ts?: typeof tsModule;
	flavors?: ParseComponentFlavor[];
	config?: AnalyzeComponentsConfig;
}

/**
 * Configuration to give when analyzing components.
 */
export interface AnalyzeComponentsConfig {
	diagnostics?: boolean;
	analyzeLibDom?: boolean;
	analyzeHTMLElement?: boolean;
}

/**
 * The result returned after components have been analyzed.
 */
export interface AnalyzeComponentsResult {
	sourceFile: SourceFile;
	componentDefinitions: ComponentDefinition[];
	globalEvents: EventDeclaration[];
	diagnostics: ComponentDiagnostic[];
}

/**
 * Analyzes all components in a source file.
 * @param sourceFile
 * @param options
 */
export function analyzeComponents(sourceFile: SourceFile, options: AnalyzeComponentsOptions): AnalyzeComponentsResult {
	const diagnostics: ComponentDiagnostic[] = [];

	// Assign defaults
	const flavors = options.flavors || DEFAULT_FLAVORS;
	const ts = options.ts || tsModule;
	const checker = options.checker;

	// Create context
	const context: FlavorVisitContext = {
		checker,
		ts,
		config: options.config || {},
		emitDiagnostics(diagnostic: ComponentDiagnostic): void {
			diagnostics.push(diagnostic);
		}
	};

	// Parse all components
	const componentDefinitions = parseComponentDefinitions(sourceFile, flavors, context);

	// Parse all global events
	const globalEvents = parseGlobalEvents(sourceFile, flavors, context);

	return {
		sourceFile,
		globalEvents,
		componentDefinitions,
		diagnostics
	};
}
