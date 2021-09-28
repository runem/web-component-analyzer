const ERROR_NAME = "CLIError";

/**
 * Make an error of kind "CLIError"
 * Use this function instead of subclassing Error because of problems after transpilation.
 * @param message
 */
export function makeCliError(message: string): Error {
	const error = new Error(message);
	error.name = ERROR_NAME;
	return error;
}

/**
 * Returns if an error is of kind "CLIError"
 * @param error
 */
export function isCliError(error: unknown): error is Error {
	return error instanceof Error && error.name === ERROR_NAME;
}
