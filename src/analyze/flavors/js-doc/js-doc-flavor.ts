import { AnalyzerFlavor } from "../analyzer-flavor";
import { discoverDefinitions } from "./discover-definitions";
import { discoverFeatures } from "./discover-features";
import { discoverGlobalFeatures } from "./discover-global-features";
import { refineDeclaration } from "./refine-declaration";
import { refineFeature } from "./refine-feature";

/**
 * Flavors for analyzing jsdoc related features
 */
export class JsDocFlavor implements AnalyzerFlavor {
	discoverDefinitions = discoverDefinitions;

	discoverFeatures = discoverFeatures;

	discoverGlobalFeatures = discoverGlobalFeatures;

	refineFeature = refineFeature;

	refineDeclaration = refineDeclaration;
}
