// TODO (43081j): use a common type instead of this for all transformers
export interface TransformerContext {
	config: TransformerConfig;
	checker: TypeChecker;
	program: Program;
	ts: typeof tsModule;
}
