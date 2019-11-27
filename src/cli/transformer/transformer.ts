import { Program } from "typescript";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
import { WcaCliConfig } from "../wca-cli-arguments";

export type AnalyzeTransformer = (results: AnalyzerResult[], program: Program, config: WcaCliConfig) => string;
