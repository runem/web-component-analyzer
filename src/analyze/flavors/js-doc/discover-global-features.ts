import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { ComponentCssPart } from "../../types/features/component-css-part";
import { ComponentCssProperty } from "../../types/features/component-css-property";
import { ComponentEvent } from "../../types/features/component-event";
import { ComponentMember } from "../../types/features/component-member";
import { ComponentSlot } from "../../types/features/component-slot";
import { isExtensionInterface } from "../../util/ast-util";
import { AnalyzerFlavor } from "../analyzer-flavor";
import { discoverFeatures } from "./discover-features";

export const discoverGlobalFeatures: AnalyzerFlavor["discoverGlobalFeatures"] = {
	csspart: (node: Node, context: AnalyzerVisitContext): ComponentCssPart[] | undefined => {
		if (isExtensionInterface(node, context, "HTMLElement")) {
			return discoverFeatures.csspart?.(node, context);
		}
	},
	cssproperty: (node: Node, context: AnalyzerVisitContext): ComponentCssProperty[] | undefined => {
		if (isExtensionInterface(node, context, "HTMLElement")) {
			return discoverFeatures.cssproperty?.(node, context);
		}
	},
	event: (node: Node, context: AnalyzerVisitContext): ComponentEvent[] | undefined => {
		if (isExtensionInterface(node, context, "HTMLElement")) {
			return discoverFeatures.event?.(node, context);
		}
	},
	slot: (node: Node, context: AnalyzerVisitContext): ComponentSlot[] | undefined => {
		if (isExtensionInterface(node, context, "HTMLElement")) {
			return discoverFeatures.slot?.(node, context);
		}
	},
	member: (node: Node, context: AnalyzerVisitContext): ComponentMember[] | undefined => {
		if (isExtensionInterface(node, context, "HTMLElement")) {
			return discoverFeatures?.member?.(node, context);
		}
	}
};
