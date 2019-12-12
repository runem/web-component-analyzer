import { AnalyzerCliConfig } from "./analyzer-cli-config";

export type CliCommand = (config: AnalyzerCliConfig) => Promise<void> | void;
