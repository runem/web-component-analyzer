import { ComponentFeatureBase } from "./component-feature";

export interface ComponentSlot extends ComponentFeatureBase {
	name?: string;
	permittedTagNames?: string[];
}
