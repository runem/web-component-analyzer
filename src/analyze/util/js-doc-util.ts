import { SimpleType, SimpleTypeStringLiteral } from "ts-simple-type";
import * as tsModule from "typescript";
import { JSDoc, JSDocParameterTag, JSDocTypeTag, Node, Program } from "typescript";
import { arrayDefined } from "../../util/array-util";
import { JsDoc, JsDocTag, JsDocTagParsed } from "../types/js-doc";
import { getLeadingCommentForNode } from "./ast-util";
import { lazy } from "./lazy";
import { getLibTypeWithName } from "./type-util";

/**
 * Returns typescript jsdoc node for a given node
 * @param node
 * @param ts
 */
function getJSDocNode(node: Node, ts: typeof tsModule): JSDoc | undefined {
	const parent = ts.getJSDocTags(node)?.[0]?.parent;
	if (parent != null && ts.isJSDoc(parent)) {
		return parent;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return ((node as any).jsDoc as Node[])?.find((n): n is JSDoc => ts.isJSDoc(n));
}

/**
 * Returns jsdoc for a given node.
 * @param node
 * @param ts
 * @param tagNames
 */
export function getJsDoc(node: Node, ts: typeof tsModule, tagNames?: string[]): JsDoc | undefined {
	const jsDocNode = getJSDocNode(node, ts);

	// If we couldn't find jsdoc, find and parse the jsdoc string ourselves
	if (jsDocNode == null) {
		const leadingComment = getLeadingCommentForNode(node, ts);

		if (leadingComment != null) {
			const jsDoc = parseJsDocString(leadingComment);

			// Return this jsdoc if we don't have to filter by tag name
			if (jsDoc == null || tagNames == null || tagNames.length === 0) {
				return jsDoc;
			}

			return {
				...jsDoc,
				tags: jsDoc.tags?.filter(t => tagNames.includes(t.tag))
			};
		}

		return undefined;
	}

	// Parse all jsdoc tags
	// Typescript removes some information after parsing jsdoc tags, so unfortunately we will have to parse.
	return {
		description: jsDocNode.comment == null ? undefined : unescapeJSDoc(String(jsDocNode.comment)),
		node: jsDocNode,
		tags:
			jsDocNode.tags == null
				? []
				: arrayDefined(
						jsDocNode.tags.map(node => {
							const tag = String(node.tagName.escapedText);

							// Filter by tag name
							if (tagNames != null && tagNames.length > 0 && !tagNames.includes(tag.toLowerCase())) {
								return undefined;
							}

							// If Typescript generated a "type expression" or "name", comment will not include those.
							// We can't just use what typescript parsed because it doesn't include things like optional jsdoc: name notation [...]
							// Therefore we need to manually get the text and remove newlines/*
							const typeExpressionPart = "typeExpression" in node ? (node as JSDocTypeTag).typeExpression?.getText() : undefined;
							const namePart = "name" in node ? (node as JSDocParameterTag).name?.getText() : undefined;

							const fullComment = typeExpressionPart?.startsWith("@")
								? // To make matters worse, if Typescript can't parse a certain jsdoc, it will include the rest of the jsdocs tag from there in "typeExpressionPart"
								  // Therefore we check if there are multiple jsdoc tags in the string to only take the first one
								  // This will discard the following jsdocs, but at least we don't crash :-)
								  typeExpressionPart.split(/\n\s*\*\s?@/)[0] || ""
								: `@${tag}${typeExpressionPart != null ? ` ${typeExpressionPart} ` : ""}${namePart != null ? ` ${namePart} ` : ""} ${
										node.comment || ""
								  }`;

							const comment = typeof node.comment === "string" ? node.comment.replace(/^\s*-\s*/, "").trim() : "";

							return {
								node,
								tag,
								comment,
								parsed: lazy(() => parseJsDocTagString(fullComment))
							};
						})
				  )
	};
}

/**
 * Converts a given string to a SimpleType
 * Defaults to ANY
 * See http://usejsdoc.org/tags-type.html
 * @param str
 * @param context
 */
export function parseSimpleJsDocTypeExpression(str: string, context: { program: Program; ts: typeof tsModule }): SimpleType {
	// Fail safe if "str" is somehow undefined
	if (str == null) {
		return { kind: "ANY" };
	}

	// Parse normal types
	switch (str.toLowerCase()) {
		case "undefined":
			return { kind: "UNDEFINED" };
		case "null":
			return { kind: "NULL" };
		case "string":
			return { kind: "STRING" };
		case "number":
			return { kind: "NUMBER" };
		case "boolean":
			return { kind: "BOOLEAN" };
		case "array":
			return { kind: "ARRAY", type: { kind: "ANY" } };
		case "object":
			return { kind: "OBJECT", members: [] };
		case "any":
		case "*":
			return { kind: "ANY" };
	}

	// Match
	//  {  string  }
	if (str.startsWith(" ") || str.endsWith(" ")) {
		return parseSimpleJsDocTypeExpression(str.trim(), context);
	}

	// Match:
	//   {string|number}
	if (str.includes("|")) {
		return {
			kind: "UNION",
			types: str.split("|").map(str => {
				const childType = parseSimpleJsDocTypeExpression(str, context);

				// Convert ANY types to string literals so that {on|off} is "on"|"off" and not ANY|ANY
				if (childType.kind === "ANY") {
					return {
						kind: "STRING_LITERAL",
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
		const type = parseSimpleJsDocTypeExpression(prefixMatch[3], context);
		switch (modifier) {
			case "?":
				return {
					kind: "UNION",
					types: [
						{
							kind: "NULL"
						},
						type
					]
				};
			case "!":
				return type;
			case "...":
				return {
					kind: "ARRAY",
					type
				};
		}
	}

	// Match:
	//  {(......)}
	const parenMatch = str.match(/^\((.+)\)$/);
	if (parenMatch != null) {
		return parseSimpleJsDocTypeExpression(parenMatch[1], context);
	}

	// Match
	//   {"red"}
	const stringLiteralMatch = str.match(/^["'](.+)["']$/);
	if (stringLiteralMatch != null) {
		return {
			kind: "STRING_LITERAL",
			value: stringLiteralMatch[1]
		};
	}

	// Match
	//   {[number]}
	const arrayMatch = str.match(/^\[(.+)]$/);
	if (arrayMatch != null) {
		return {
			kind: "ARRAY",
			type: parseSimpleJsDocTypeExpression(arrayMatch[1], context)
		};
	}

	// Match
	//   CustomEvent<string>
	//   MyInterface<string, number>
	//   MyInterface<{foo: string, bar: string}, number>
	const genericArgsMatch = str.match(/^(.*)<(.*)>$/);
	if (genericArgsMatch != null) {
		// Here we split generic arguments by "," and
		//   afterwards remerge parts that were incorrectly split
		// For example: "{foo: string, bar: string}, number" would result in
		//   ["{foo: string", "bar: string}", "number"]
		// The correct way to improve "parseSimpleJsDocTypeExpression" is to build a custom lexer/parser.
		const typeArgStrings: string[] = [];
		for (const part of genericArgsMatch[2].split(/\s*,\s*/)) {
			if (part.match(/[}:]/) != null && typeArgStrings.length > 0) {
				typeArgStrings[typeArgStrings.length - 1] += `, ${part}`;
			} else {
				typeArgStrings.push(part);
			}
		}

		return {
			kind: "GENERIC_ARGUMENTS",
			target: parseSimpleJsDocTypeExpression(genericArgsMatch[1], context),
			typeArguments: typeArgStrings.map(typeArg => parseSimpleJsDocTypeExpression(typeArg, context))
		};
	}

	// If nothing else, try to find the type in Typescript global lib or else return "any"
	return getLibTypeWithName(str, context) || { kind: "ANY" };
}

/**
 * Finds a @type jsdoc tag in the jsdoc and returns the corresponding simple type
 * @param jsDoc
 * @param context
 */
export function getJsDocType(jsDoc: JsDoc, context: { program: Program; ts: typeof tsModule }): SimpleType | undefined {
	if (jsDoc.tags != null) {
		const typeJsDocTag = jsDoc.tags.find(t => t.tag === "type");

		if (typeJsDocTag != null) {
			// We get the text of the node because typescript strips the type jsdoc tag under certain circumstances
			const parsedJsDoc = parseJsDocTagString(typeJsDocTag.node?.getText() || "");

			if (parsedJsDoc.type != null) {
				return parseSimpleJsDocTypeExpression(parsedJsDoc.type, context);
			}
		}
	}
}

const JSDOC_TAGS_WITH_REQUIRED_NAME: string[] = ["param", "fires", "@element", "@customElement"];

/**
 * Takes a string that represents a value in jsdoc and transforms it to a javascript value
 * @param value
 */
function parseJsDocValue(value: string | undefined): unknown {
	if (value == null) {
		return value;
	}

	// Parse quoted strings
	const quotedMatch = value.match(/^["'`](.*)["'`]$/);
	if (quotedMatch != null) {
		return quotedMatch[1];
	}

	// Parse keywords
	switch (value) {
		case "false":
			return false;
		case "true":
			return true;
		case "undefined":
			return undefined;
		case "null":
			return null;
	}

	// Parse number
	if (!isNaN(Number(value))) {
		return Number(value);
	}

	return value;
}

/**
 * Parses "@tag {type} name description" or "@tag name {type} description"
 * @param str
 */
function parseJsDocTagString(str: string): JsDocTagParsed {
	const jsDocTag: JsDocTagParsed = {
		tag: ""
	};

	if (str[0] !== "@") {
		return jsDocTag;
	}

	const moveStr = (byLength: string | number) => {
		str = str.substring(typeof byLength === "number" ? byLength : byLength.length);
	};

	const unqouteStr = (quotedStr: string) => {
		return quotedStr.replace(/^['"](.+)["']$/, (_, match) => match);
	};

	const matchTag = () => {
		// Match tag
		// Example: "  @mytag"
		const tagResult = str.match(/^(\s*@(\S+))/);
		if (tagResult == null) {
			return jsDocTag;
		} else {
			// Move string to the end of the match
			// Example: "  @mytag|"
			moveStr(tagResult[1]);
			jsDocTag.tag = tagResult[2];
		}
	};

	const matchType = () => {
		// Match type
		// Example: "   {MyType}"
		const typeResult = str.match(/^(\s*{([\s\S]*)})/);
		if (typeResult != null) {
			// Move string to the end of the match
			// Example: "  {MyType}|"
			moveStr(typeResult[1]);
			jsDocTag.type = typeResult[2];
		}
	};

	const matchName = () => {
		// Match optional name
		// Example: "  [myname=mydefault]"
		const defaultNameResult = str.match(/^(\s*\[([\s\S]+)\])/);
		if (defaultNameResult != null) {
			// Move string to the end of the match
			// Example: "  [myname=mydefault]|"
			moveStr(defaultNameResult[1]);

			// Using [...] means that this doc is optional
			jsDocTag.optional = true;

			// Split the inner content between [...] into parts
			// Example:  "myname=mydefault" => "myname", "mydefault"
			const parts = defaultNameResult[2].split("=");
			if (parts.length === 2) {
				// Both name and default were given
				jsDocTag.name = unqouteStr(parts[0]);
				jsDocTag.default = parseJsDocValue(parts[1]);
			} else if (parts.length !== 0) {
				// No default was given
				jsDocTag.name = unqouteStr(parts[0]);
			}
		} else {
			// else, match required name
			// Example: "   myname"

			// A name is needed some jsdoc tags making it possible to include omit "-"
			// Therefore we don't look for "-" or line end if the name is required - in that case we only need to eat the first word to find the name.
			const regex = JSDOC_TAGS_WITH_REQUIRED_NAME.includes(jsDocTag.tag) ? /^(\s*(\S+))/ : /^(\s*(\S+))((\s*-[\s\S]+)|\s*)($|[\r\n])/;
			const nameResult = str.match(regex);
			if (nameResult != null) {
				// Move string to end of match
				// Example: "   myname|"
				moveStr(nameResult[1]);
				jsDocTag.name = unqouteStr(nameResult[2].trim());
			}
		}
	};

	const matchComment = () => {
		// Match comment
		if (str.length > 0) {
			// The rest of the string is parsed as comment. Remove "-" if needed.
			jsDocTag.description = str.replace(/^\s*-\s*/, "").trim() || undefined;
		}

		// Expand the name based on namespace and classname
		if (jsDocTag.name != null) {
			/**
			 * The name could look like this, so we need to parse and the remove the class name and namespace from the name
			 *   InputSwitch#[CustomEvent]input-switch-check-changed
			 *   InputSwitch#input-switch-check-changed
			 */
			const match = jsDocTag.name.match(/(.*)#(\[.*\])?(.*)/);
			if (match != null) {
				jsDocTag.className = match[1];
				jsDocTag.namespace = match[2];
				jsDocTag.name = match[3];
			}
		}
	};

	matchTag();
	matchType();
	matchName();

	// Type can come both before and after "name"
	if (jsDocTag.type == null) {
		matchType();
	}

	matchComment();

	return jsDocTag;
}

/**
 * Parses an entire jsdoc string
 * @param doc
 */
function parseJsDocString(doc: string): JsDoc | undefined {
	// Prepare lines
	const lines = doc.split("\n").map(line => line.trim());
	let description = "";
	let readDescription = true;
	let currentTag = "";
	const tags: JsDocTag[] = [];

	/**
	 * Parsing will add to "currentTag" and commit it when necessary
	 */
	const commitCurrentTag = () => {
		if (currentTag.length > 0) {
			const tagToCommit = currentTag;

			const tagMatch = tagToCommit.match(/^@(\S+)\s*/);

			if (tagMatch != null) {
				tags.push({
					parsed: lazy(() => parseJsDocTagString(tagToCommit)),
					node: undefined,
					tag: tagMatch[1],
					comment: tagToCommit.substr(tagMatch[0].length)
				});
			}
			currentTag = "";
		}
	};

	// Parse all lines one by one
	for (const line of lines) {
		// Don't parse the last line ("*/")
		if (line.match(/\*\//)) {
			continue;
		}

		// Match a line like: "* @mytag description"
		const tagCommentMatch = line.match(/(^\s*\*\s*)@\s*/);
		if (tagCommentMatch != null) {
			// Commit current tag (if any has been read). Now "currentTag" will reset.
			commitCurrentTag();
			// Add everything on the line from "@"
			currentTag += line.substr(tagCommentMatch[1].length);
			// We hit a jsdoc tag, so don't read description anymore
			readDescription = false;
		} else if (!readDescription) {
			// If we are not reading the description, we are currently reading a multiline tag
			const commentMatch = line.match(/^\s*\*\s*/);
			if (commentMatch != null) {
				currentTag += "\n" + line.substr(commentMatch[0].length);
			}
		} else {
			// Read everything after "*" into the description if we are currently reading the description

			// If we are on the first line, add everything after "/*"
			const startLineMatch = line.match(/^\s*\/\*\*/);
			if (startLineMatch != null) {
				description += line.substr(startLineMatch[0].length);
			}

			// Add everything after "*" into the current description
			const commentMatch = line.match(/^\s*\*\s*/);
			if (commentMatch != null) {
				if (description.length > 0) {
					description += "\n";
				}
				description += line.substr(commentMatch[0].length);
			}
		}
	}

	// Commit a tag if we were currently parsing one
	commitCurrentTag();

	if (description.length === 0 && tags.length === 0) {
		return undefined;
	}

	return {
		description: unescapeJSDoc(description),
		tags
	};
}

/**
 * Certain characters as "@" can be escaped in order to prevent Typescript from
 * parsing it as a jsdoc tag. This function unescapes these characters.
 * @param str
 */
function unescapeJSDoc(str: string): string {
	return str.replace(/\\@/, "@");
}
