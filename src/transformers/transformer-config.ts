import { VisibilityKind } from "../analyze/types/visibility-kind";

export interface TransformerConfig {
	visibility: VisibilityKind;
	markdown?: {
		titleLevel?: number; // deprecated
		headerLevel?: number;
	};
}
