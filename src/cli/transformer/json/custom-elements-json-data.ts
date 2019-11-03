export interface HtmlDataValue {
	name: string;
	description?: string;
}

export interface HtmlDataValueSet {
	name: string;
	values: HtmlDataValue[];
}

export interface HtmlDataMember {
	name: string;
	description?: string;
	values?: HtmlDataValue[];
	valueSet?: string;

	// Suggested fields:
	jsDoc?: string;
	type?: any;
}

export interface HtmlDataAttribute extends HtmlDataMember {}

export interface HtmlDataProperty extends HtmlDataMember {}

export interface HtmlDataSlot extends HtmlDataMember {}

export interface HtmlDataEvent extends HtmlDataMember {}

export interface HtmlDataCssProperty extends HtmlDataMember {}

export interface HtmlDataCssPart extends HtmlDataMember {}

export interface HtmlDataTag {
	name: string;
	description?: string;
	jsDoc?: string;
	attributes?: HtmlDataAttribute[];

	// Suggested fields:
	properties?: HtmlDataProperty[];
	slots?: HtmlDataSlot[];
	events?: HtmlDataEvent[];
	cssProperties?: HtmlDataCssProperty[];
	cssParts?: HtmlDataCssPart[];
}

export interface HtmlDataV2 {
	version: 2;
	tags?: HtmlDataTag[];
	valueSets?: HtmlDataValueSet[];

	// Suggested fields:
	global?: {
		attributes?: HtmlDataMember[];
		properties?: HtmlDataMember[];
		slots?: HtmlDataMember[];
		events?: HtmlDataMember[];
	};
}

export type HtmlData = HtmlDataV2;
