/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

/**
 * The top-level interface of a custom elements manifest file.
 *
 * Because custom elements are JavaScript classes, describing a custom element
 * may require describing arbitrary JavaScript concepts like modules, classes,
 * functions, etc. So custom elements manifests are capable of documenting
 * the elements in a package, as well as those JavaScript concepts.
 *
 * The modules described in a package should be the public entrypoints that
 * other packages may import from. Multiple modules may export the same object
 * via re-exports, but in most cases a package should document the single
 * canonical export that should be used.
 */
export interface Package {
	/**
	 * The version of the schema used in this file.
	 */
	schemaVersion: string;

	/**
	 * The Markdown to use for the main readme of this package.
	 *
	 * This can be used to override the readme used by Github or npm if that
	 * file contains information irrelevant to custom element catalogs and
	 * documentation viewers.
	 */
	readme?: string;

	/**
	 * An array of the modules this package contains.
	 */
	modules: Array<Module>;
}

// This type may expand in the future to include JSON, CSS, or HTML
// modules.
export type Module = JavaScriptModule;

export interface JavaScriptModule {
	kind: "javascript-module";

	path: string;

	/**
	 * A markdown summary suitable for display in a listing.
	 */
	summary?: string;

	/**
	 * A markdown description of the module.
	 */
	description?: string;

	/**
	 * The declarations of a module.
	 *
	 * For documentation purposes, all declarations that are reachable from
	 * exports should be described here. Ie, functions and objects that may be
	 * properties of exported objects, or passed as arguments to functions.
	 */
	declarations: Array<Declaration>;

	/**
	 * The exports of a module. This includes JavaScript exports and
	 * custom element definitions.
	 */
	exports?: Array<Export>;
}

export type Export = JavaScriptExport | CustomElementExport;

export interface JavaScriptExport {
	kind: "js";

	/**
	 * The name of the exported symbol.
	 *
	 * JavaScript has a number of ways to export objects which determine the
	 * correct name to use.
	 *
	 * - Default exports must use the name "default".
	 * - Named exports use the name that is exported. If the export is renamed
	 *   with the "as" clause, use the exported name.
	 * - Aggregating exports (`* from`) should use the name `*`
	 */
	name: string;

	/**
	 * A reference to the exported declaration.
	 *
	 * In the case of aggregating exports, the reference's `module` field must be
	 * defined and the `name` field must be `"*"`.
	 */
	declaration: Reference;
}

/**
 * A global custom element defintion, ie the result of a
 * `customElements.define()` call.
 *
 * This is represented as an export because a definition makes the element
 * available outside of the module it's defined it.
 */
export interface CustomElementExport {
	kind: "custom-element-definition";

	/**
	 * The tag name of the custom element.
	 */
	name: string;

	/**
	 * A reference to the class or other declaration that implements the
	 * custom element.
	 */
	declaration: Reference;
}

export type Declaration = ClassDeclaration | FunctionDeclaration | MixinDeclaration | VariableDeclaration | CustomElement;

/**
 * A reference to an export of a module.
 *
 * All references are required to be publically accessible, so the canonical
 * representation of a reference is the export it's available from.
 *
 * Referrences to global symbols like `Array`, `HTMLElement`, or `Event`
 *
 */
export interface Reference {
	name: string;
	package?: string;
	module?: string;
}

/**
 * Description of a custom element class.
 *
 * Custom elements are JavaScript classes, so this extends from
 * `ClassDeclaration` and adds custom-element-specific features like
 * attributes, events, and slots.
 *
 * Note that `tagName` in this interface is optional. Tag names are not
 * neccessarily part of a custom element class, but belong to the definition
 * (often called the "registration") or the `customElements.define()` call.
 *
 * Because classes and tag anmes can only be registered once, there's a
 * one-to-one relationship between classes and tag names. For ease of use,
 * we allow the tag name here.
 *
 * Some packages define and register custom elements in separate modules. In
 * these cases one `Module` should contain the `CustomElement` without a
 * tagName, and another `Module` should contain the
 * `CustomElement`.
 */
export interface CustomElement extends ClassDeclaration {
	/**
	 * An optional tag name that should be specified if this is a
	 * self-registering element.
	 *
	 * Self-registering elements must also include a CustomElementExport
	 * in the module's exports.
	 */
	tagName?: string;

	/**
	 * The attributes that this element is known to understand.
	 */
	attributes?: Attribute[];

	/**
	 * The events that this element fires.
	 */
	events?: Event[];

	/**
	 * The shadow dom content slots that this element accepts.
	 */
	slots?: Slot[];

	parts?: CssPart[];

	cssProperties?: CssCustomProperty[];

	demos?: Demo[];
}

export interface Attribute {
	name: string;

	/**
	 * A markdown summary suitable for display in a listing.
	 */
	summary?: string;

	/**
	 * A markdown description.
	 */
	description?: string;

	inheritedFrom?: Reference;

	/**
	 * The type that the attribute will be serialized/deserialized as.
	 */
	type?: Type;

	/**
	 * The default value of the attribute, if any.
	 *
	 * As attributes are always strings, this is the actual value, not a human
	 * readable description.
	 */
	defaultValue?: string;

	/**
	 * The name of the field this attribute is associated with, if any.
	 */
	fieldName?: string;
}

export interface Event {
	name: string;

	/**
	 * A markdown summary suitable for display in a listing.
	 */
	summary?: string;

	/**
	 * A markdown description.
	 */
	description?: string;

	/**
	 * The type of the event object that's fired.
	 */
	type: Type;

	inheritedFrom?: Reference;
}

export interface Slot {
	/**
	 * The slot name, or the empty string for an unnamed slot.
	 */
	name: string;

	/**
	 * A markdown summary suitable for display in a listing.
	 */
	summary?: string;

	/**
	 * A markdown description.
	 */
	description?: string;
}

/**
 * The description of a CSS Part
 */
export interface CssPart {
	name: string;

	/**
	 * A markdown summary suitable for display in a listing.
	 */
	summary?: string;

	/**
	 * A markdown description.
	 */
	description?: string;
}

export interface CssCustomProperty {
	/**
	 * The name of the property, including leading `--`.
	 */
	name: string;

	defaultValue?: string;

	/**
	 * A markdown summary suitable for display in a listing.
	 */
	summary?: string;

	/**
	 * A markdown description.
	 */
	description?: string;
}

export interface Type {
	/**
	 * The full string representation of the type, in whatever type syntax is
	 * used, such as JSDoc, Closure, or TypeScript.
	 */
	type: string;

	/**
	 * An array of references to the types in the type string.
	 *
	 * These references have optional indices into the type string so that tools
	 * can understand the references in the type string independently of the type
	 * system and syntax. For example, a documentation viewer could display the
	 * type `Array<FooElement | BarElement>` with cross-references to `FooElement`
	 * and `BarElement` without understanding arrays, generics, or union types.
	 */
	references?: TypeReference[];
}

/**
 * A reference that is associated with a type string and optionally a range
 * within the string.
 *
 * Start and end must both be present or not present. If they're present, they
 * are indices into the associated type string. If they are missing, the entire
 * type string is the symbol referenced and the name should match the type
 * string.
 */
export interface TypeReference extends Reference {
	start?: number;
	end?: number;
}

/**
 * The common interface of classes and mixins.
 */
export interface ClassLike {
	name: string;

	/**
	 * A markdown summary suitable for display in a listing.
	 */
	summary?: string;

	/**
	 * A markdown description of the class.
	 */
	description?: string;
	superclass?: Reference;
	mixins?: Array<Reference>;
	members?: Array<ClassMember>;
}

export interface ClassDeclaration extends ClassLike {
	kind: "class";
}

export type ClassMember = ClassField | ClassMethod;

/**
 * The common interface of variables, class fields, and function
 * parameters.
 */
export interface PropertyLike {
	name: string;

	/**
	 * A markdown summary suitable for display in a listing.
	 */
	summary?: string;

	/**
	 * A markdown description of the field.
	 */
	description?: string;

	type?: Type;

	default?: string;
}

export interface ClassField extends PropertyLike {
	kind: "field";
	static?: boolean;
	privacy?: Privacy;
	inheritedFrom?: Reference;
}

export interface ClassMethod extends FunctionLike {
	kind: "method";
	static?: boolean;
	privacy?: Privacy;
	inheritedFrom?: Reference;
}

/**
 *
 */
export interface MixinDeclaration extends ClassLike, FunctionLike {
	kind: "mixin";
}

export interface VariableDeclaration extends PropertyLike {
	kind: "variable";
}

export interface FunctionDeclaration extends FunctionLike {
	kind: "function";
}

export interface Parameter extends PropertyLike {
	/**
	 * Whether the parameter is optional. Undefined implies non-optional.
	 */
	optional?: boolean;
}

export interface FunctionLike {
	name: string;

	/**
	 * A markdown summary suitable for display in a listing.
	 */
	summary?: string;

	/**
	 * A markdown description.
	 */
	description?: string;

	parameters?: Parameter[];

	return?: {
		type?: Type;
		description?: string;
	};
}

export type Privacy = "public" | "private" | "protected";

export interface Demo {
	/**
	 * A markdown description of the demo.
	 */
	description?: string;

	/**
	 * Relative URL of the demo if it's published with the package. Absolute URL
	 * if it's hosted.
	 */
	url: string;
}
