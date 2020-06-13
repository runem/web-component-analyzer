import { AnalyzerCliConfig } from "../analyzer-cli-config";

/**
 * Logs to the console with a specific level.
 * This function takes the config into account
 * @param text
 * @param config
 * @param level
 */
export function log(text: unknown | (() => string), config: AnalyzerCliConfig, level: "normal" | "verbose" = "normal"): void {
	// Never log if silent
	if (config.silent) {
		return;
	}

	// Never log verbose if verbose is not on
	if (level === "verbose" && !config.verbose) {
		return;
	}

	// "unpack" function
	if (typeof text === "function") {
		text = text();
	}

	// eslint-disable-next-line no-console
	if (typeof text === "object") {
		// eslint-disable-next-line no-console
		console.dir(text, { depth: 10 });
	} else {
		// eslint-disable-next-line no-console
		console.log(text);
	}
}

/**
 * Logs only if verbose is set to true in the config
 * @param text
 * @param config
 */
export function logVerbose(text: () => unknown, config: AnalyzerCliConfig): void {
	log(text, config, "verbose");
}
