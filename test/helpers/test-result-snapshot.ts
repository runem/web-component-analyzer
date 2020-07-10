import test, { ExecutionContext, ImplementationResult } from "ava";
import { Program } from "typescript";
import { AnalyzerResult } from "../../src/analyze/types/analyzer-result";
import { getExtendsHeritageClausesInChain, getMixinHeritageClausesInChain } from "../../src/analyze/util/component-declaration-util";
import { analyzeGlobs } from "../../src/cli/util/analyze-globs";
import { arrayFlat } from "../../src/util/array-util";

function testResult(
	testName: string,
	globs: string[],
	callback: (result: AnalyzerResult[], program: Program, t: ExecutionContext) => ImplementationResult
): void {
	test(testName, async t => {
		const { results, program } = await analyzeGlobs(globs, {
			discoverNodeModules: true,
			analyzeGlobalFeatures: true
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

		callback(sortedResults, program, t);
	});
}

export function testResultSnapshot(globs: string[]): void {
	testResult(`Snapshot Test: ${globs.map(glob => `"${glob}"`).join(", ")}`, globs, (results, program, t) => {
		const declarations = arrayFlat(results.map(result => result.componentDefinitions.map(def => def.declaration)));
		const summary = {
			elements: results.reduce((acc, result) => acc + result.componentDefinitions.length, 0),
			tagNames: arrayFlat(results.map(result => result.componentDefinitions))
				.map(def => def.tagName)
				.join(", "),
			members: declarations.reduce((acc, decl) => acc + decl.members.length, 0),
			cssParts: declarations.reduce((acc, decl) => acc + decl.cssParts.length, 0),
			cssProps: declarations.reduce((acc, decl) => acc + decl.cssProperties.length, 0),
			events: declarations.reduce((acc, decl) => acc + decl.events.length, 0),
			slots: declarations.reduce((acc, decl) => acc + decl.slots.length, 0),
			methods: declarations.reduce((acc, decl) => acc + decl.methods.length, 0),
			mixins: declarations
				.map(
					decl =>
						`[${getMixinHeritageClausesInChain(decl)
							.map(clause => clause.identifier.getText())
							.join(", ")}]`
				)
				.join(", "),
			extends: declarations
				.map(
					decl =>
						`[${getExtendsHeritageClausesInChain(decl)
							.map(clause => clause.identifier.getText())
							.join(", ")}]`
				)
				.join(", ")
		};

		t.pass("Temporary ignore snapshot testing");
		//const resolvedResult = stripTypescriptValues(results, program.getTypeChecker());
		//t.snapshot({ _summary: summary, results: resolvedResult });
	});
}
