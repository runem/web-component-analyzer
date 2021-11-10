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
/**
 * Relative path to icon
 */
export type Icon = string;
export type Html = GenericContributionsHost;
export type GenericContributions = GenericContributionOrProperty[] | GenericContributionOrProperty;
export type GenericContributionOrProperty = string | number | boolean | GenericContribution;
export type GenericContribution = TypedContribution;
export type TypedContribution = BaseContribution;
export type BaseContribution = GenericContributionsHost;
export type Css = GenericContributionsHost;
export type Js = GenericContributionsHost;

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
export interface GenericContributionsHost {
	[k: string]: GenericContributions;
}
