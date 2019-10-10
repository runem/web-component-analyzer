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
	example?: string[];
	deprecated?: string | boolean;
	type?: any;
}

export interface HtmlDataAttribute extends HtmlDataMember {}

export interface HtmlDataProperty extends HtmlDataMember {
	// Suggested fields:
	attribute?: string;
	reflect?: "both" | "to-attribute" | "to-property";
	default?: any;
}

export interface HtmlDataSlot extends HtmlDataMember {}

export interface HtmlDataEvent extends HtmlDataMember {}

export interface HtmlDataTag {
	name: string;
	description?: string;
	attributes?: HtmlDataAttribute[];

	// Suggested fields:
	path?: string;
	example?: string[];
	deprecated?: string | boolean;
	properties?: HtmlDataProperty[];
	slots?: HtmlDataSlot[];
	events?: HtmlDataEvent[];
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
