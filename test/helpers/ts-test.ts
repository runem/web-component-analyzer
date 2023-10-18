import test, { Implementation } from "ava";
import { dirname } from "path";
import * as tsModule from "typescript";

type TestFunction = (title: string, implementation: Implementation) => void;

const TS_MODULES_ALL = ["current", "4.8", "4.9", "5.0", "5.1"] as const;

type TsModuleKind = (typeof TS_MODULES_ALL)[number];

const TS_MODULES_DEFAULT: readonly TsModuleKind[] = TS_MODULES_ALL;

/**
 * Returns the name of the module to require for a specific ts module kind
 * @param kind
 */
function getTsModuleNameWithKind(kind: TsModuleKind | undefined): string {
	// Return the corresponding ts module
	switch (kind) {
		default: {
			const never: never = kind;
			throw new Error(`Unknown ts module "${never}"`);
		}
		case "4.8":
		case "4.9":
		case "5.0":
		case "5.1":
			return `typescript-${kind}`;
		case "current":
		case undefined:
		case null:
			// Fall back to "default"
			return "typescript";
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
		throw new Error(`Unknown ts module "${kind}"`);
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
	const moduleKinds: readonly TsModuleKind[] = (() => {
		const currentTsModuleKind = getCurrentTsModuleKind();

		// Default to running all ts modules if TS_MODULE is not set
		return currentTsModuleKind != null ? [currentTsModuleKind] : TS_MODULES_DEFAULT;
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
