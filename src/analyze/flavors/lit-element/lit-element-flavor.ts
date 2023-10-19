import { AnalyzerFlavor } from "../analyzer-flavor";
import { discoverDefinitions } from "./discover-definitions";
import { discoverMembers } from "./discover-members";
import { excludeNode } from "./exclude-node";
import { refineFeature } from "./refine-feature";
import { discoverEvents } from "./discover-events";

/**
 * Flavors for analyzing LitElement related features: https://lit-element.polymer-project.org/
 */
export class LitElementFlavor implements AnalyzerFlavor {
	excludeNode = excludeNode;

	discoverDefinitions = discoverDefinitions;

	discoverFeatures = {
		member: discoverMembers,
		event: discoverEvents
	};

	refineFeature = refineFeature;
}
