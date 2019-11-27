import { SimpleType } from "ts-simple-type";
import { Node } from "typescript";

export interface LitElementPropertyConfig {
	type?: SimpleType | string;
	attribute?: string | boolean;
	node?: {
		type?: Node;
		attribute?: Node;
	};
	hasConverter?: boolean;
	default?: any;
	reflect?: boolean;
}
