import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { ComponentMember } from "../../types/features/component-member";
import { Node } from "typescript";

import { ComponentMethod } from "../../types/features/component-method";
import { AnalyzerFlavor } from "../analyzer-flavor";

// In LWC, the public properties & methods must be tagged with @api
// everything else becomes protected and not accessible externally
function hasApiDecorator(node: Node|undefined, context: AnalyzerVisitContext) {
	const { ts } = context;
	if(node && node.decorators) {
		for (const decorator of node.decorators) {
			const expression = decorator.expression;
	
			// We find the first decorator calling specific identifier name (found in LWC_PROPERTY_DECORATOR_KINDS)
			if (ts.isIdentifier(expression)) {
				const identifier = expression;
				const kind = identifier.text;
				if (kind==="api") {
					return true;
				}
			}
		}
	}
	return false;
}

export const refineFeature: AnalyzerFlavor["refineFeature"] = {
	member: (member: ComponentMember, context: AnalyzerVisitContext): ComponentMember | undefined  => {
		const  visibility = hasApiDecorator(member.node,context) ? "public" : "protected";
		return {
			...member,
			visibility
		}
	},
	method: (method: ComponentMethod, context: AnalyzerVisitContext): ComponentMethod | undefined => {
		const  visibility = hasApiDecorator(method.node,context) ? "public" : "protected";
		return {
			...method,
			visibility
		}
	}
};
