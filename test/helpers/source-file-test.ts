import test, { ExecutionContext, ImplementationResult } from "ava";
import { analyzeComponents, AnalyzeComponentsResult } from "../../src/analyze/analyze-components";
import { CompileResult, compileTypescript } from "../../src/cli/compile";
import { stripTypescriptValues } from "./strip-typescript-values";

const _compiledResult = compileTypescript("./dev/src/index.ts");
const _compiledResultMap = new Map<string, CompileResult>();

function getSourceFile(fileName: RegExp | string): CompileResult {
	if (typeof fileName === "string" && fileName.startsWith("./")) {
		if (_compiledResultMap.has(fileName)) {
			return _compiledResultMap.get(fileName)!;
		}

		const result = compileTypescript(fileName);
		_compiledResultMap.set(fileName, result);
		return result;
	}

	const sourceFiles = (() => {
		if (typeof fileName === "string") {
			return _compiledResult.program.getSourceFiles().filter(sf => sf.fileName.endsWith(fileName));
		} else {
			return _compiledResult.program.getSourceFiles().filter(sf => sf.fileName.match(fileName));
		}
	})();

	if (sourceFiles.length === 0) {
		console.log(_compiledResult.program.getSourceFiles().map(sf => sf.fileName));
		throw new Error(`Couldn't find source file match: ${fileName}`);
	} else if (sourceFiles.length > 1) {
		console.log(_compiledResult.program.getSourceFiles().map(sf => sf.fileName));
		throw new Error(`Found to many files with: ${fileName}: ${sourceFiles.map(sf => sf.fileName)}`);
	}

	return { ..._compiledResult, files: sourceFiles };
}

export function testResult(testName: string, fileName: RegExp | string, callback: (result: AnalyzeComponentsResult, t: ExecutionContext) => ImplementationResult) {
	test(testName, t => {
		const { files, program } = getSourceFile(fileName);

		const checker = program.getTypeChecker();
		const res = analyzeComponents(files[0], { checker });

		callback(res, t);
	});
}

export function testResultSnapshot(fileName: RegExp | string) {
	testResult(`Snapshot Test "${typeof fileName === "string" ? fileName : fileName.source}"`, fileName, (result, t) => {
		t.snapshot(stripTypescriptValues(result));
	});
}
