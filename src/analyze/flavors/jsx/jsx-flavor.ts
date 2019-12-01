import { AnalyzerFlavor } from "../analyzer-flavor";
import { discoverDefinitions } from "./discover-definitions";
import { discoverGlobalFeatures } from "./discover-global-features";

export class JSXFlavor implements AnalyzerFlavor {
	discoverDefinitions = discoverDefinitions;

	discoverGlobalFeatures = discoverGlobalFeatures;
}
