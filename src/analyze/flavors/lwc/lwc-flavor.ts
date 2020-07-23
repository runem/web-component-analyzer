import { AnalyzerFlavor } from "../analyzer-flavor";
import { discoverMembers } from "./discover-members";
import { refineFeature } from "./refine-feature";

/**
 * Flavors for analyzing LWC related features: https://lwc.dev/
 */
export class LwcFlavor implements AnalyzerFlavor {
	discoverFeatures = {
		member: discoverMembers
	};

	refineFeature = refineFeature;
}
