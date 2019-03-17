import { AnalyzeComponentsConfig } from "../analyze/analyze-components";

export interface WcaCliConfig {
	debug?: boolean;
	outFile?: string;
	outDir?: string;
	format?: "json" | "md" | "markdown" | "vscode";
	analyzeLibraries?: boolean;
	markdown?: {
		titleLevel?: number;
	};
	analyze?: AnalyzeComponentsConfig;
}
