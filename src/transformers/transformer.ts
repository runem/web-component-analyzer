import { Program } from "typescript";
import { AnalyzerResult } from "../analyze/types/analyzer-result";
import { TransformerConfig } from "./transformer-config";

export type AnalyzeTransformer = (results: AnalyzerResult[], program: Program, config: TransformerConfig) => string;
