import { AnalyzerFlavor } from "../analyzer-flavor";
import { discoverDefinitions } from "./discover-definitions";

export class JSXFlavor implements AnalyzerFlavor {
	discoverDefinitions = discoverDefinitions;

	// TODO: Check JSX.IntrinsicAttributes interface when scanning for "global" properties/attributes
}
