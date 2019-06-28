import test, { ExecutionContext, ImplementationResult } from "ava";
import { AnalyzeComponentsResult } from "../../src/analyze/analyze-components";
import { analyzeGlobs } from "../../src/cli/analyze-globs";
import { stripTypescriptValues } from "./strip-typescript-values";

export function testResult(
	testName: string,
	globs: string[],
	callback: (result: AnalyzeComponentsResult[], t: ExecutionContext) => ImplementationResult
) {
	test(testName, async t => {
		const { results } = await analyzeGlobs(globs, {
			analyzeLibraries: true
		});

		const nonEmptyResults = results.filter(result => result.componentDefinitions.length > 0);

		if (nonEmptyResults.length === 0) {
			t.fail("Didn't find any components");
		}

		const sortedResults = nonEmptyResults
			.sort((a, b) => (a.sourceFile.fileName < b.sourceFile.fileName ? -1 : 1))
			.map(result => ({
				...result,
				componentDefinitions: result.componentDefinitions.sort((a, b) => (a.tagName < b.tagName ? -1 : 1))
			}));

		callback(sortedResults, t);
	});
}

export function testResultSnapshot(globs: string[]) {
	testResult(`Snapshot Test: ${globs.map(glob => `"${glob}"`).join(", ")}`, globs, (result, t) => {
		t.snapshot(stripTypescriptValues(result));
	});
}
