import { SimpleTypeKind } from "ts-simple-type";
import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { ComponentEvent } from "../../types/features/component-event";
import { isExtensionInterface } from "../../util/ast-util";
import { getJsDoc } from "../../util/js-doc-util";
import { lazy } from "../../util/lazy";
import { resolveNodeValue } from "../../util/resolve-node-value";
import { AnalyzerFlavor, ComponentMemberResult } from "../analyzer-flavor";

export const discoverGlobalFeatures: AnalyzerFlavor["discoverGlobalFeatures"] = {
	event: (node: Node, context: AnalyzerVisitContext): ComponentEvent[] | undefined => {
		const { ts } = context;

		if (isExtensionInterface(node, context, "HTMLElementEventMap")) {
			const events: ComponentEvent[] = [];

			for (const member of node.members) {
				if (ts.isPropertySignature(member)) {
					const name = resolveNodeValue(member.name, context)?.value;

					if (name != null) {
						events.push({
							node: member.initializer || member,
							jsDoc: getJsDoc(member, ts),
							name: name,
							type: lazy(() => ({ kind: SimpleTypeKind.ANY }))
						});
					}
				}
			}

			context?.emitContinue?.();

			return events;
		}
	},
	member: (node: Node, context: AnalyzerVisitContext): ComponentMemberResult[] | undefined => {
		const { ts } = context;

		if (isExtensionInterface(node, context, "HTMLElement")) {
			const members: ComponentMemberResult[] = [];

			for (const member of node.members) {
				if (ts.isPropertySignature(member)) {
					const name = resolveNodeValue(member.name, context)?.value;

					if (name != null) {
						members.push({
							priority: "medium",
							member: {
								node: member,
								jsDoc: getJsDoc(member, ts),
								kind: "property",
								propName: name,
								type: lazy(() => context.checker.getTypeAtLocation(member))
							}
						});
					}
				}
			}

			context?.emitContinue?.();

			return members;
		}
	}
};
