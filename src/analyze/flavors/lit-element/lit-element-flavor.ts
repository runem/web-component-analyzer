import { AnalyzerFlavor } from "../analyzer-flavor";
import { discoverDefinitions } from "./discover-definitions";
import { discoverMembers } from "./discover-members";

export class LitElementFlavor implements AnalyzerFlavor {
	discoverDefinitions = discoverDefinitions;

	discoverFeatures = {
		member: discoverMembers
	};
}
