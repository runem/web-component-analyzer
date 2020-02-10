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
	type?: unknown;
	attribute?: string;
	deprecated?: boolean;
	deprecatedMessage?: string;
}

export interface HtmlDataAttribute extends HtmlDataMember {
	// Suggested fields:
	default?: string;
}

export interface HtmlDataProperty extends HtmlDataMember {
	// Suggested fields:
	default?: string;
}

export interface HtmlDataSlot extends HtmlDataMember {}

export interface HtmlDataEvent extends HtmlDataMember {}

export interface HtmlDataCssProperty extends HtmlDataMember {
	// Suggested fields:
	default?: string;
}

export interface HtmlDataCssPart extends HtmlDataMember {}

export interface HtmlDataTag {
	name: string;
	description?: string;
	attributes?: HtmlDataAttribute[];
	path?: string;

	// Suggested fields:
	properties?: HtmlDataProperty[];
	slots?: HtmlDataSlot[];
	events?: HtmlDataEvent[];
	cssProperties?: HtmlDataCssProperty[];
	cssParts?: HtmlDataCssPart[];
	deprecated?: boolean;
	deprecatedMessage?: string;
}

export interface HtmlDataV2 {
	version: string;
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
