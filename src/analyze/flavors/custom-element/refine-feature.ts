import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { ComponentMethod } from "../../types/features/component-method";
import { isNamePrivate } from "../../util/text-util";
import { AnalyzerFlavor, ComponentMemberResult } from "../analyzer-flavor";

export const refineFeature: AnalyzerFlavor["refineFeature"] = {
	member: (memberResult: ComponentMemberResult, context: AnalyzerVisitContext): ComponentMemberResult | undefined => {
		const { member } = memberResult;

		// Outscope "static" members for now
		if (member?.modifiers?.has("static")) {
			return undefined;
		}

		if (member.visibility == null) {
			const name = member.kind === "attribute" ? member.attrName : member.propName;
			if (isNamePrivate(name)) {
				return {
					...memberResult,
					member: {
						...member,
						visibility: "private"
					}
				};
			}
		}

		return memberResult;
	},
	method: (method: ComponentMethod, context: AnalyzerVisitContext): ComponentMethod | undefined => {
		// Outscope "statics" for now
		if (method.visibility == null && isNamePrivate(method.name)) {
			return {
				...method,
				visibility: "private"
			};
		}

		return method;
	}
};
