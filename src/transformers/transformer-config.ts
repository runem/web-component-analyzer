import { VisibilityKind } from "../analyze/types/visibility-kind";
import { GenericContributions } from "./webtypes/webtypes-schema";

export interface TransformerConfig {
	cwd?: string;
	visibility?: VisibilityKind;
	markdown?: {
		titleLevel?: number; // deprecated
		headerLevel?: number;
	};
	inlineTypes?: boolean;
	webTypes?: WebTypesTransformerConfig;
}

export interface WebTypesTransformerConfig {
	name: string;
	version: string;
	"default-icon"?: string;
	"js-types-syntax"?: "typescript";
	framework?: string;
	"framework-config"?: WebTypesFrameworkConfig;
	"description-markup"?: "html" | "markdown" | "none";
	pathAsAbsolute?: boolean;
}

export interface WebTypesFrameworkConfig {
	[k: string]: GenericContributions;
}
