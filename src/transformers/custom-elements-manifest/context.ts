import * as tsModule from "typescript";
import { TransformerConfig } from "../transformer-config";

// TODO (43081j): use a common type instead of this for all transformers
export interface TransformerContext {
	config: TransformerConfig;
	checker: tsModule.TypeChecker;
	program: tsModule.Program;
	ts: typeof tsModule;
}
