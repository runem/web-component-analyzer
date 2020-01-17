import { analyzeText, AnalyzeTextResult, VirtualSourceFile } from "../../src/analyze/analyze-text";
import { AnalyzerOptions } from "../../src/analyze/types/analyzer-options";
import { getCurrentTsModule } from "./ts-test";

/**
 * Calls the "analyzeText" function, but with the current ts module
 * @param inputFiles
 * @param config
 */
export function analyzeTextWithCurrentTsModule(
	inputFiles: VirtualSourceFile[] | VirtualSourceFile,
	config: Partial<AnalyzerOptions> = {}
): AnalyzeTextResult {
	const tsModule = getCurrentTsModule();
	return analyzeText(inputFiles, {
		ts: tsModule,
		...config
	});
}
