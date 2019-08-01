export interface HtmlDataAttrValue {
	name: string;
	description?: string;
}

export interface HtmlDataValueSet {
	name: string;
	values: HtmlDataAttrValue[];
}

export interface HtmlDataMember {
	name: string;
	description?: string;
	values?: HtmlDataAttrValue[];
	valueSet?: string;
	type?: any;
	jsDoc?: string;
	default?: string;
}

export interface HtmlDataAttribute extends HtmlDataMember {}

export interface HtmlDataProperty extends HtmlDataMember {}

export interface HtmlDataSlot extends HtmlDataMember {}

export interface HtmlDataEvent extends HtmlDataMember {}

export interface HtmlDataTag {
	name: string;
	description?: string;
	jsDoc?: string;
	attributes?: HtmlDataAttribute[];
	properties?: HtmlDataProperty[];
	slots?: HtmlDataSlot[];
	events?: HtmlDataEvent[];
}

export interface HtmlDataV2 {
	version: 2;
	tags?: HtmlDataTag[];
	global?: {
		attributes?: HtmlDataMember[];
		properties?: HtmlDataMember[];
		slots?: HtmlDataMember[];
		events?: HtmlDataMember[];
	};
	valueSets?: HtmlDataValueSet[];
}

export type HtmlData = HtmlDataV2;
