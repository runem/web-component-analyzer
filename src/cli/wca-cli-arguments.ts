import { AnalyzerConfig } from "../analyze/types/analyzer-config";
import { VisibilityKind } from "../analyze/types/visibility-kind";

export interface WcaCliConfig {
	debug?: boolean;
	outFile?: string;
	outDir?: string;
	format?: "json" | "md" | "markdown" | "vscode" | "debug";
	discoverLibraryFiles?: boolean;
	visibility?: VisibilityKind;
	markdown?: {
		titleLevel?: number;
	};
	analyze?: AnalyzerConfig;
}
