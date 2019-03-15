import { WcaCliConfig } from "../wca-cli-arguments";

export class CommandError extends Error {}

export interface CliCommand {
	id: string;

	printHelp?(): Promise<void> | void;
	run(config: WcaCliConfig, ...args: string[]): Promise<number | void> | number | void;
}
