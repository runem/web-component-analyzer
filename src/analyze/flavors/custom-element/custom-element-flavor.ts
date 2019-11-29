import { AnalyzerFlavor } from "../analyzer-flavor";
import { discoverDefinitions } from "./discover-definitions";
import { discoverEvents } from "./discover-events";
import { discoverInheritance } from "./discover-inheritance";
import { discoverMembers } from "./discover-members";
import { discoverMethods } from "./discover-methods";
import { excludeNode } from "./exclude-node";
import { refineFeature } from "./refine-feature";

export class CustomElementFlavor implements AnalyzerFlavor {
	excludeNode = excludeNode;

	discoverDefinitions = discoverDefinitions;

	discoverFeatures = {
		member: discoverMembers,
		event: discoverEvents,
		method: discoverMethods
	};

	refineFeature = refineFeature;

	discoverInheritance = discoverInheritance;
}
