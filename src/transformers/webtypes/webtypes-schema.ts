// converted from JSON schema with https://transform.tools/json-schema-to-typescript
// just renamed JSONSchemaForWebTypesPreviewOfVersion20OfTheStandard to WebtypesSchema

/**
 * Language in which JavaScript objects types are specified.
 */
export type JsTypesSyntax = "typescript";
/**
 * Markup language in which descriptions are formatted
 */
export type DescriptionMarkup = "html" | "markdown" | "none";
/**
 * A RegEx pattern to match whole content. Syntax should work with at least ECMA, Java and Python implementations.
 */
export type Pattern =
	| string
	| {
			regex?: string;
			"case-sensitive"?: boolean;
			[k: string]: unknown;
	  };
export type NameConverter = "as-is" | "PascalCase" | "camelCase" | "lowercase" | "UPPERCASE" | "kebab-case" | "snake_case";
export type NameConverters = NameConverter[];

export type Priority = "lowest" | "low" | "normal" | "high" | "highest";
/**
 * Relative path to icon
 */
export type Icon = string;
export type GenericContributions = GenericContributionOrProperty[] | GenericContributionOrProperty;
export type GenericContributionOrProperty = string | number | boolean | object | GenericContribution | Source;
export type GenericContribution = TypedContribution;

export interface TypedContribution extends BaseContribution {
	type?: Type | Type[];
}

export interface WebtypesSchema {
	$schema?: string;
	/**
	 * Framework, for which the components are provided by the library
	 */
	framework?: string;
	/**
	 * Name of the library
	 */
	name: string;
	/**
	 * Version of the library, for which web-types are provided
	 */
	version: string;
	"js-types-syntax"?: JsTypesSyntax;
	"description-markup"?: DescriptionMarkup;
	"framework-config"?: FrameworkConfig;
	"default-icon"?: Icon;
	contributions?: {
		html?: Html;
		css?: Css;
		js?: Js;
	};
}
export interface FrameworkConfig {
	/**
	 * Specify rules for enabling web framework support.
	 */
	"enable-when"?: {
		/**
		 * Node.js package names, which enable framework support within the folder containing the package.json.
		 */
		"node-packages"?: string[];
		/**
		 * RegExps to match script URLs, which enable framework support within a particular HTML.
		 */
		"script-url-patterns"?: Pattern[];
		/**
		 * Extensions of files, which should have the framework support enabled
		 */
		"file-extensions"?: string[];
		/**
		 * RegExp patterns to match file names, which should have the framework support enabled
		 */
		"file-name-patterns"?: Pattern[];
		/**
		 * Global JavaScript libraries names enabled within the IDE, which enable framework support in the whole project
		 */
		"ide-libraries"?: string[];
	};
	/**
	 * Specify rules for disabling web framework support. These rules take precedence over enable-when rules.
	 */
	"disable-when"?: {
		/**
		 * Extensions of files, which should have the framework support disabled
		 */
		"file-extensions"?: string[];
		/**
		 * RegExp patterns to match file names, which should have the framework support disabled
		 */
		"file-name-patterns"?: Pattern[];
	};
	"canonical-names"?: {
		[k: string]: NameConverter;
	};
	"name-variants"?: {
		[k: string]: NameConverters;
	};
}

export interface SourceFile {
	file: string;
	offset: number;
}

export interface SourceModule {
	module: string;
	symbol: string;
}

export type Source = SourceFile | SourceModule;

export type Html = HtmlContributionHost;

export interface HtmlElement extends BaseContribution, HtmlContributionHost {}

export interface BaseContribution {
	name?: string;
	description?: string;
	// "description-sections"?: ;
	"doc-url"?: string;
	icon?: Icon;
	source?: Source;
	deprecated?: boolean;
	experimental?: boolean;
	priority?: Priority;
	proximity?: number;
	virtual?: boolean;
	abstract?: boolean;
	extension?: boolean;
	extends?: Reference;
	// pattern?: NamePatternRoot;
	html?: Html;
	css?: Css;
	js?: Js;
	// "exclusive-contributions"?: ;
}

export interface HtmlContributionHost {
	elements?: HtmlElement[];
	attributes?: HtmlAttribute[];
}

export interface HtmlAttribute extends BaseContribution, HtmlContributionHost {
	value?: HtmlAttributeValue;
	default?: string;
	required?: boolean;
}

export interface HtmlAttributeValue {
	type?: Type | Type[];
	required?: boolean;
	default?: string;
	kind?: HtmlAttributeType;
}

export interface TypeReference {
	module?: string;
	name: string;
}

export type Type = string | TypeReference;

export type HtmlAttributeType = "no-value" | "plain" | "expression";

export type Reference = string | ReferenceWithProps;

export interface ReferenceWithProps {
	path: string;
	includeVirtual?: boolean;
	includeAbstract?: boolean;
	filter?: string;
}

export type Js = JsContributionsHost;

export interface JsContributionsHost {
	events?: GenericJsContribution[];
	properties?: GenericJsContribution[];
}

export interface GenericJsContribution extends GenericContribution, JsContributionsHost {
	value?: HtmlAttributeValue;
	default?: string;
	required?: boolean;
}

export type Css = CssContributionsHost;

export interface CssContributionsHost {
	properties?: CssProperty[];
	"pseudo-elements"?: CssPseudoElement[];
	"pseudo-classes"?: CssPseudoClass[];
	functions?: CssGenericItem[];
	classes?: CssGenericItem[];
}

export interface CssProperty extends BaseContribution, CssContributionsHost {
	values?: string[];
}

export interface CssPseudoElement extends BaseContribution, CssContributionsHost {
	arguments?: boolean;
}

export interface CssPseudoClass extends BaseContribution, CssContributionsHost {
	arguments?: boolean;
}

export interface CssGenericItem extends BaseContribution, CssContributionsHost {}
