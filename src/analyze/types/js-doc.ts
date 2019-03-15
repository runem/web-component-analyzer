export interface JsDocTag {
	tag: string;
	comment?: string;
}

export interface JsDoc {
	comment?: string;
	tags?: JsDocTag[];
}
