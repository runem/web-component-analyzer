import { SourceFile } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { executeFunctionsUntilMatch } from "../../util/execute-functions-until-match";

export function isLibSourceFile(sourceFile: SourceFile, context: AnalyzerVisitContext): boolean {
	const result = executeFunctionsUntilMatch(context.flavors, "isLibSourceFile", sourceFile, context);

	if (result != null) {
		return result.value;
	}

	return false;
}
