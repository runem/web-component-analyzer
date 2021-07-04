import * as tsModule from "typescript";
import { TransformerConfig } from "./transformer-config";

export interface TransformerContext {
	config: TransformerConfig;
	checker: tsModule.TypeChecker;
	program: tsModule.Program;
	ts: typeof tsModule;
}
