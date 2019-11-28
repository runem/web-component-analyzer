import { AnalyzerConfig } from "../analyze/types/analyzer-config";
import { VisibilityKind } from "../analyze/types/visibility-kind";
import { TransformerKind } from "../transformers/transformer-kind";

export interface AnalyzerCliConfig {
	debug?: boolean;
	outFile?: string;
	outDir?: string;
	format?: TransformerKind;
	discoverLibraryFiles?: boolean;
	visibility?: VisibilityKind;
	markdown?: {
		titleLevel?: number;
	};
	analyze?: AnalyzerConfig;
}
