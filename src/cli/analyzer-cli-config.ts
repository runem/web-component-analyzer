import * as tsModule from "typescript";
import { ComponentFeature } from "../analyze/types/features/component-feature";
import { VisibilityKind } from "../analyze/types/visibility-kind";
import { TransformerKind } from "../transformers/transformer-kind";

export interface AnalyzerCliConfig {
	glob?: string[];

	dry?: boolean;
	verbose?: boolean;
	outFile?: string;
	outFiles?: string;
	outDir?: string;

	format?: TransformerKind;
	visibility?: VisibilityKind;

	features?: ComponentFeature[];
	discoverLibraryFiles?: boolean;
	analyzeGlobalFeatures?: boolean;

	markdown?: {
		titleLevel?: number;
	};

	ts?: typeof tsModule;
}
