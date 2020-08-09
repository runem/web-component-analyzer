import { AnalyzerFlavor } from "../analyzer-flavor";
import { discoverMembers } from "./discover-members";
import { discoverDefinitions } from "./discover-definitions";
import { refineFeature } from "./refine-feature";

/**
 * Flavors for analyzing LWC related features: https://lwc.dev/
 */
export class LwcFlavor implements AnalyzerFlavor {
	discoverDefinitions = discoverDefinitions;
	discoverFeatures = {
		member: discoverMembers
	};

	refineFeature = refineFeature;
}
