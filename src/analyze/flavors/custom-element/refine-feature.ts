import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { isNamePrivate } from "../../util/ast-util";
import { AnalyzerFlavor, ComponentMemberResult } from "../analyzer-flavor";

export const refineFeature: AnalyzerFlavor["refineFeature"] = {
	member: (memberResult: ComponentMemberResult, context: AnalyzerVisitContext): ComponentMemberResult | undefined => {
		const { member } = memberResult;

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
	}
};
