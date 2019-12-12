import { ComponentFeatureBase } from "./component-feature";

export interface ComponentCssProperty extends ComponentFeatureBase {
	name: string;
	typeHint?: string;
	default?: unknown;
}
