import { relative } from "path";
import { Node } from "typescript";
import { AnalyzeComponentsResult } from "../../../analyze/analyze-components";

/**
 * Prints all diagnostics of the analyze components result.
 * @param result
 */
export function printResultDiagnostics(result: AnalyzeComponentsResult | AnalyzeComponentsResult[]) {
	if (Array.isArray(result)) {
		return result.forEach(printResultDiagnostics);
	}

	const { diagnostics } = result;

	// Return right away if there are no diagnostics
	if (diagnostics.length === 0) return;

	// Pretty-print the filename
	const fileName = relative(process.cwd(), result.sourceFile.fileName);
	console.log(`${diagnostics.length} diagnostics in "${fileName}"`);

	// Print all diagnostics
	for (const diagnostic of diagnostics) {
		console.log(`️${getSeverityBox(diagnostic.severity)} ${getFileLocation(diagnostic.node)}: ${diagnostic.message}`);
	}

	console.log("");
}

/**
 * Returns the location of the node.
 * @param node
 */
function getFileLocation(node: Node): string {
	const { line } = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart());
	return `line ${line + 1}`;
}

/**
 * Returns a "severity box": a colored box with a label.
 * @param severity
 */
function getSeverityBox(severity: "error" | "warning"): string {
	switch (severity) {
		case "error":
			return "\x1b[0;30;41m error \x1b[0m";
		case "warning":
			return "\x1b[0;30;43m warning \x1b[0m";
		default:
			return "";
	}
}
