import { AnalyzerCliConfig } from "../analyzer-cli-config";

export class CommandError extends Error {}

export interface CliCommand {
	id: string;

	printHelp?(): Promise<void> | void;
	run(config: AnalyzerCliConfig, ...args: string[]): Promise<number | void> | number | void;
}
