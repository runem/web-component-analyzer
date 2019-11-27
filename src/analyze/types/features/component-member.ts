import { SimpleType } from "ts-simple-type";
import { Node, Type } from "typescript";
import { JsDoc } from "../js-doc";
import { LitElementPropertyConfig } from "./lit-element-property-config";
import { VisibilityKind } from "../visibility-kind";

export type ComponentMemberKind = "property" | "attribute";

export type ComponentMemberReflectKind = "to-attribute" | "to-property" | "both";

export interface ComponentMemberBase {
	kind: ComponentMemberKind;
	node: Node;
	jsDoc: JsDoc | undefined;
	typeHint?: string;
	type: undefined | (() => Type | SimpleType);

	meta?: LitElementPropertyConfig;

	visibility?: VisibilityKind;
	reflect?: ComponentMemberReflectKind;
	required?: boolean;
	deprecated?: boolean | string;
	default?: any;
}

export interface ComponentMemberProperty extends ComponentMemberBase {
	kind: "property";
	propName: string;
	attrName?: string;
}

export interface ComponentMemberAttribute extends ComponentMemberBase {
	kind: "attribute";
	attrName: string;
	propName?: undefined;
}

export type ComponentMember = ComponentMemberProperty | ComponentMemberAttribute;
