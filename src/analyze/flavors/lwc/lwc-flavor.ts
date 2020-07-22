// import { AnalyzerFlavor } from "../analyzer-flavor";
// //import { discoverDefinitions } from "./discover-definitions";
// import { discoverDefinitions } from "../js-doc/discover-definitions";
// import { discoverMembers } from "../lit-element/discover-members";

import { AnalyzerFlavor } from "../analyzer-flavor";
import { discoverDefinitions } from "./discover-definitions";
import { discoverMembers } from "./discover-members";

export class LWCFlavor implements AnalyzerFlavor {
	discoverDefinitions = discoverDefinitions;
	discoverFeatures = {
		member: discoverMembers
	};
}
