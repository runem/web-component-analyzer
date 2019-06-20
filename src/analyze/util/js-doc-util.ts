import { SimpleType, SimpleTypeKind, SimpleTypeStringLiteral } from "ts-simple-type";
import * as tsModule from "typescript";
import { Node } from "typescript";
import { JsDoc, JsDocTag } from "../types/js-doc";

export interface ParsedJsDocTag {
	type?: string;
	name?: string;
	comment?: string;
}

/**
 * Parses a jsdoc tag into type, name and comment
 * @param tag
 */
export function parseJsDocTagComment(tag: JsDocTag | string): ParsedJsDocTag {
	if (typeof tag !== "string" && tag.comment == null) return {};

	let text = typeof tag === "string" ? tag : tag.comment!;

	if (text.trim().startsWith("@")) {
		const trimResult = text.match(/\s?@.+\s(.+)/);
		if (trimResult != null) {
			text = trimResult[1];
		}
	}

	/**
	 * {MyType} MyName - MyComment
	 * {MyType} MyName
	 * {MyType} - MyComment
	 * MyName - MyComment
	 * {MyType}
	 * MyComment
	 */
	const regex = /^(\s*?\{(?<type>.*)\})?(((?<name1>.+)(\s\-\s)(?<comment1>.+))|(\s?\-\s)(?<comment2>.+)|(?<name2>.*?))$/;
	const result = text.trim().match(regex);
	if (result == null || result.groups == null) return {};

	const type = result.groups["type"];
	const name = result.groups["name1"] || result.groups["name2"];
	const comment = result.groups["comment1"] || result.groups["comment2"];

	return {
		type: (type && type.trim()) || undefined,
		name: (name && name.trim()) || undefined,
		comment: (comment && comment.trim()) || undefined
	};
}

/**
 * Returns jsdoc for a given node.
 * @param node
 * @param ts
 */
export function getJsDoc(node: Node, ts: typeof tsModule): JsDoc | undefined {
	const docs = ((node as any).jsDoc as any[]) || [];

	for (const doc of docs) {
		if (ts.isJSDoc(doc)) {
			return {
				comment: doc.comment == null ? undefined : String(doc.comment),
				tags:
					doc.tags == null
						? []
						: doc.tags.map(node => ({
								node,
								tag: String(node.tagName.escapedText),
								comment: node.comment == null ? undefined : String(node.comment)
						  }))
			};
		}
	}
}

/**
 * Converts a given string to a SimpleType
 * Defaults to ANY
 * See http://usejsdoc.org/tags-type.html
 * @param str
 */
export function parseJsDocTypeString(str: string): SimpleType {
	// Fail safe if "str" is somehow undefined
	if (str == null) {
		return { kind: SimpleTypeKind.ANY };
	}

	// Parse normal types
	switch (str.toLowerCase()) {
		case "undefined":
			return { kind: SimpleTypeKind.UNDEFINED };
		case "null":
			return { kind: SimpleTypeKind.NULL };
		case "string":
			return { kind: SimpleTypeKind.STRING };
		case "number":
			return { kind: SimpleTypeKind.NUMBER };
		case "boolean":
			return { kind: SimpleTypeKind.BOOLEAN };
		case "array":
			return { kind: SimpleTypeKind.ARRAY, type: { kind: SimpleTypeKind.ANY } };
		case "object":
			return { kind: SimpleTypeKind.OBJECT, members: [] };
		case "any":
		case "*":
			return { kind: SimpleTypeKind.ANY };
	}

	// Match
	//  {  string  }
	if (str.startsWith(" ") || str.endsWith(" ")) {
		return parseJsDocTypeString(str.trim());
	}

	// Match:
	//   {string|number}
	if (str.includes("|")) {
		return {
			kind: SimpleTypeKind.UNION,
			types: str.split("|").map(str => {
				const childType = parseJsDocTypeString(str);

				// Convert ANY types to string literals so that {on|off} is "on"|"off" and not ANY|ANY
				if (childType.kind === SimpleTypeKind.ANY) {
					return {
						kind: SimpleTypeKind.STRING_LITERAL,
						value: str
					} as SimpleTypeStringLiteral;
				}

				return childType;
			})
		};
	}

	// Match:
	//  {?number}       (nullable)
	//  {!number}       (not nullable)
	//  {...number}     (array of)
	const prefixMatch = str.match(/^(\?|!|(\.\.\.))(.+)$/);

	if (prefixMatch != null) {
		const modifier = prefixMatch[1];
		const type = parseJsDocTypeString(prefixMatch[3]);
		switch (modifier) {
			case "?":
				return {
					kind: SimpleTypeKind.UNION,
					types: [
						{
							kind: SimpleTypeKind.NULL
						},
						type
					]
				};
			case "!":
				return type;
			case "...":
				return {
					kind: SimpleTypeKind.ARRAY,
					type
				};
		}
	}

	// Match:
	//  {(......)}
	const parenMatch = str.match(/^\((.+)\)$/);
	if (parenMatch != null) {
		return parseJsDocTypeString(parenMatch[1]);
	}

	// Match
	//   {"red"}
	const stringLiteralMatch = str.match(/^["'](.+)["']$/);
	if (stringLiteralMatch != null) {
		return {
			kind: SimpleTypeKind.STRING_LITERAL,
			value: stringLiteralMatch[1]
		};
	}

	// Match
	//   {[number]}
	const arrayMatch = str.match(/^\[(.+)\]$/);
	if (arrayMatch != null) {
		return {
			kind: SimpleTypeKind.ARRAY,
			type: parseJsDocTypeString(arrayMatch[1])
		};
	}

	return { kind: SimpleTypeKind.ANY };
}

/**
 * Finds a @type jsdoc tag in the jsdoc and returns the corresponding simple type
 * @param jsDoc
 */
export function getJsDocType(jsDoc: JsDoc): SimpleType | undefined {
	if (jsDoc.tags != null) {
		const typeTag = jsDoc.tags.find(t => t.tag === "type");

		if (typeTag != null) {
			// We get the text of the node because typescript strips the type jsdoc tag under certain circumstances
			const parsedJsDoc = parseJsDocTagComment(typeTag.node.getText());

			if (parsedJsDoc.type != null) {
				return parseJsDocTypeString(parsedJsDoc.type);
			}
		}
	}
}
