import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { ComponentEvent } from "../../types/features/component-event";
import { ComponentMember } from "../../types/features/component-member";
import { getJsDoc } from "../../util/js-doc-util";
import { lazy } from "../../util/lazy";
import { resolveNodeValue } from "../../util/resolve-node-value";
import { AnalyzerFlavor } from "../analyzer-flavor";

/**
 * Discovers global feature defined on "HTMLElementEventMap" or "HTMLElement"
 */
export const discoverGlobalFeatures: AnalyzerFlavor["discoverGlobalFeatures"] = {
	event: (node: Node, context: AnalyzerVisitContext): ComponentEvent[] | undefined => {
		const { ts, checker } = context;

		if (context.ts.isInterfaceDeclaration(node) && ["HTMLElementEventMap", "GlobalEventHandlersEventMap"].includes(node.name.text)) {
			const events: ComponentEvent[] = [];

			for (const member of node.members) {
				if (ts.isPropertySignature(member)) {
					const name = resolveNodeValue(member.name, context)?.value;

					if (name != null && typeof name === "string") {
						events.push({
							node: member,
							jsDoc: getJsDoc(member, ts),
							name: name,
							type: lazy(() => checker.getTypeAtLocation(member))
						});
					}
				}
			}

			context?.emitContinue?.();

			return events;
		}
	},
	member: (node: Node, context: AnalyzerVisitContext): ComponentMember[] | undefined => {
		const { ts } = context;

		if (context.ts.isInterfaceDeclaration(node) && node.name.text === "HTMLElement") {
			const members: ComponentMember[] = [];

			for (const member of node.members) {
				if (ts.isPropertySignature(member)) {
					const name = resolveNodeValue(member.name, context)?.value;

					if (name != null && typeof name === "string") {
						members.push({
							priority: "medium",
							node: member,
							jsDoc: getJsDoc(member, ts),
							kind: "property",
							propName: name,
							type: lazy(() => context.checker.getTypeAtLocation(member))
						});
					}
				}
			}

			context?.emitContinue?.();

			return members;
		}
	}
};
