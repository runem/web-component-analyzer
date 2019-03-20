import { AnalyzeCliCommand } from "./cli-command/analyze/analyze-cli-command";
import { CliCommand, CommandError } from "./cli-command/cli-command";
import { DiagnoseCliCommand } from "./cli-command/diagnose/diagnose-cli-command";
import { parseCliArguments } from "./parse-cli-arguments";
import { WcaCliConfig } from "./wca-cli-arguments";

/**
 * The main function of the cli.
 */
export async function cli() {
	// Available commands
	const commands: CliCommand[] = [new AnalyzeCliCommand(), new DiagnoseCliCommand()];

	// Parse arguments
	const args = parseCliArguments(process.argv.slice(2));

	if ("debug" in args && args.debug) {
		console.dir(args);
	}

	// Find the chosen command
	const commandId = args._[0];
	let command = commands.find(c => c.id === commandId);

	// Print "version"
	if ("version" in args) {
		console.log("<@VERSION@>");
		process.exit();
	}

	// Print "invalid command"
	if (command == null) {
		if (commandId != null) {
			console.log(`Invalid command '${commandId}'\n`);
		}

		await printGlobalHelp();
	}

	// Print "help"
	else if ("help" in args && command.printHelp != null) {
		await command.printHelp();
	}

	// Execute the command
	else {
		try {
			// Run the command
			const exitCode = await command.run(args as WcaCliConfig, ...args._.slice(1));
			process.exit(exitCode || 0);
		} catch (error) {
			if (error instanceof CommandError) {
				console.log("Error: ", error.message, "\n");
				return process.exit(1);
			} else {
				console.log(`Fatal error: `, error.message);
				throw error;
			}
		}
	}
}

/**
 * Prints the global help text.
 */
function printGlobalHelp() {
	console.log(`Usage:
  \$ wca <command> [<input-glob>] [options]

Available Commands:
  analyze\tAnalyses components and emits results in a specified format.
  diagnose\tAnalyses components and emits diagnostics to the console.
  
For more info, run any command with the \`--help\` flag
  $ wca analyze --help
  $ wca diagnose --help
  
Examples:
  $ wca analyze
  $ wca analyze src --format markdown
  $ wca analyze "src/**/*.{js,ts}" --outDir output
  $ wca analyze my-element.js --outFile output.json
  
  $ wca diagnose
  $ wca diagnose src
  $ wca diagnose "./src/**/*.{js,ts}"
  $ wca diagnose my-element.js
`);
}
