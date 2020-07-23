import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { ComponentFeatureBase } from "../../types/features/component-feature";
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

function isLWCComponent(component: ComponentFeatureBase, context: AnalyzerVisitContext) {
	// How do we know that we are dealing with LWC components?
	// Currently assume that it is always the case
	return true;
}

export const refineFeature: AnalyzerFlavor["refineFeature"] = {
	member: (member: ComponentMember, context: AnalyzerVisitContext): ComponentMember | undefined  => {
		if(isLWCComponent(member,context)) {
			const  visibility = hasApiDecorator(member.node,context) ? "public" : "protected";
			return {
				...member,
				visibility
			}
		}
		return member;
	},
	method: (method: ComponentMethod, context: AnalyzerVisitContext): ComponentMethod | undefined => {
		if(isLWCComponent(method,context)) {
			const  visibility = hasApiDecorator(method.node,context) ? "public" : "protected";
			return {
				...method,
				visibility
			}
		}
		return method;
	}
};
