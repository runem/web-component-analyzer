import { Program } from "typescript";
import { AnalyzeComponentsResult } from "../../../../analyze/analyze-components";
import { WcaCliConfig } from "../../../wca-cli-arguments";

export type AnalyzeTransformer = (results: AnalyzeComponentsResult[], program: Program, config: WcaCliConfig) => string;
