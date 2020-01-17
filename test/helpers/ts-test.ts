import test, { Implementation } from "ava";
import { dirname } from "path";
import * as tsModule from "typescript";

type TestFunction = (title: string, implementation: Implementation) => void;

type TsModuleKind = "3.5" | "3.6" | "3.7" | "3.8";

const TS_MODULES_ALL: TsModuleKind[] = ["3.5", "3.6", "3.7", "3.8"];

/**
 * Returns the name of the module to require for a specific ts module kind
 * @param kind
 */
function getTsModuleNameWithKind(kind: TsModuleKind | undefined): string {
	// Return the corresponding ts module
	switch (kind) {
		case "3.5":
		case "3.6":
		case "3.7":
		case "3.8":
			return `typescript-${kind}`;
		case undefined:
		case null:
			// Fall back to "default"
			return "typescript";
		default:
			throw new Error(`Unknown ts module "${kind}"`);
	}
}

/**
 * Returns a ts module based on a ts module kind
 * @param kind
 */
function getTsModuleWithKind(kind: TsModuleKind | undefined): typeof tsModule {
	return require(getTsModuleNameWithKind(kind));
}

function setCurrentTsModuleKind(kind: TsModuleKind | undefined) {
	if (kind == null) {
		delete process.env.TS_MODULE;
	} else {
		process.env.TS_MODULE = kind;
	}
}

/**
 * Returns the current ts module kind based on environment vars
 */
function getCurrentTsModuleKind(): TsModuleKind | undefined {
	const kind = process.env.TS_MODULE as TsModuleKind | undefined;

	// Validate the value
	if (kind != null && !TS_MODULES_ALL.includes(kind)) {
		throw new Error(`Unknown ts module "${kind}" ${kind != null} ${typeof kind}`);
	}

	return kind;
}

/**
 * Returns the current ts module based based on environment vars
 */
export function getCurrentTsModule(): typeof tsModule {
	return getTsModuleWithKind(getCurrentTsModuleKind());
}

/**
 * Returns the directory of the current ts module
 */
export function getCurrentTsModuleDirectory(): string {
	const moduleName = getTsModuleNameWithKind(getCurrentTsModuleKind());
	return dirname(require.resolve(moduleName));
}

/**
 * Sets up an ava test with specified ts module kind
 * @param testFunction
 * @param tsModuleKind
 * @param title
 * @param cb
 */
function setupTest(testFunction: TestFunction, tsModuleKind: TsModuleKind | undefined, title: string, cb: Implementation) {
	// Generate title based on the ts module
	const version = getTsModuleWithKind(tsModuleKind).version;
	const titleWithModule = `[ts${version}] ${title}`;

	// Setup up the ava test
	testFunction(titleWithModule, (...args: Parameters<Implementation>) => {
		// Set the ts module as environment variable before running the test
		setCurrentTsModuleKind(tsModuleKind);

		const res = cb(...args);

		// Reset the selected TS_MODULE
		setCurrentTsModuleKind(undefined);

		return res;
	});
}

/**
 * Sets up an ava test that runs multiple times with different ts modules
 * @param testFunction
 * @param title
 * @param cb
 */
function setupTests(testFunction: (title: string, implementation: Implementation) => void, title: string, cb: Implementation) {
	// Find the user specified TS_MODULE at setup time
	const moduleKinds: (TsModuleKind | undefined)[] = (() => {
		if (process.env.TS_MODULE != null && process.env.TS_MODULE === "all") {
			// Set TS_MODULE to "all" in order to run all modules locally
			return TS_MODULES_ALL;
		}

		// Default to only running the current ts module
		return [getCurrentTsModuleKind()];
	})();

	// Set up tests for each ts module
	for (const tsModuleKind of moduleKinds) {
		setupTest(testFunction, tsModuleKind, title, cb);
	}
}

/**
 * Wraps an ava test and runs it multiple times with different ts modules
 * @param testFunction
 */
export function wrapAvaTest(testFunction: TestFunction): TestFunction {
	return (title, implementation) => {
		return setupTests(testFunction, title, implementation);
	};
}

/**
 * Wrap the ava test module in these helper functions
 */
export const tsTest = Object.assign(wrapAvaTest(test), {
	only: wrapAvaTest(test.only),
	skip: wrapAvaTest(test.skip)
});
