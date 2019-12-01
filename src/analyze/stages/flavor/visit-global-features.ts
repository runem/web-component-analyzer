import { Node } from "typescript";
import { arrayDefined } from "../../../util/array-util";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { VisitFeatureEmitMap, visitFeaturesWithVisitMaps } from "./visit-features";

export function visitGlobalFeatures<ReturnType>(node: Node, context: AnalyzerVisitContext, emitMap: Partial<VisitFeatureEmitMap>) {
	const visitMaps = arrayDefined(context.flavors.map(flavor => flavor.discoverGlobalFeatures));

	visitFeaturesWithVisitMaps(node, context, visitMaps, emitMap);
}
