import { AnalyzerFlavor } from "../analyzer-flavor";
import { discoverDefinitions } from "./discover-definitions";
import { discoverEvents } from "./discover-events";
import { discoverGlobalFeatures } from "./discover-global-features";
import { discoverInheritance } from "./discover-inheritance";
import { discoverMembers } from "./discover-members";
import { discoverMethods } from "./discover-methods";
import { excludeNode } from "./exclude-node";

/**
 * A flavor that discovers using standard custom element rules
 */
export class CustomElementFlavor implements AnalyzerFlavor {
	excludeNode = excludeNode;

	discoverDefinitions = discoverDefinitions;

	discoverFeatures = {
		member: discoverMembers,
		event: discoverEvents,
		method: discoverMethods
	};

	discoverGlobalFeatures = discoverGlobalFeatures;

	discoverInheritance = discoverInheritance;
}
