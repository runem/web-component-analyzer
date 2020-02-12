import { SimpleType, SimpleTypeKind, SimpleTypeStringLiteral } from "ts-simple-type";
import * as tsModule from "typescript";
import { JSDoc, JSDocParameterTag, JSDocTypeTag, Node } from "typescript";
import { arrayDefined } from "../../util/array-util";
import { JsDoc, JsDocTag, JsDocTagParsed } from "../types/js-doc";
import { getLeadingCommentForNode } from "./ast-util";
import { lazy } from "./lazy";

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
 */
export function getJsDoc(node: Node, ts: typeof tsModule): JsDoc | undefined;
export function getJsDoc(node: Node, tagNames: string[], ts: typeof tsModule): JsDoc | undefined;
export function getJsDoc(node: Node, tagNamesOrTs: string[] | typeof tsModule, ts?: typeof tsModule): JsDoc | undefined {
	// Overloaded case
	let tagNames: string[] | null = null;
	if (ts == null) {
		ts = tagNamesOrTs as typeof tsModule;
	} else {
		tagNames = tagNamesOrTs as string[];
	}

	const jsDocNode = getJSDocNode(node, ts);

	// If we couldn't find jsdoc, find and parse the jsdoc string ourselves
	if (jsDocNode == null) {
		const leadingComment = getLeadingCommentForNode(node, ts);

		if (leadingComment != null) {
			return parseJsDocString(leadingComment);
		}

		return undefined;
	}

	// Parse all jsdoc tags
	// Typescript removes some information after parsing jsdoc tags, so unfortunately we will have to parse.
	return {
		description: jsDocNode.comment == null ? undefined : String(jsDocNode.comment),
		node: jsDocNode,
		tags:
			jsDocNode.tags == null
				? []
				: arrayDefined(
						jsDocNode.tags.map(node => {
							const tag = String(node.tagName.escapedText);

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
								: `@${tag}${typeExpressionPart != null ? ` ${typeExpressionPart} ` : ""}${namePart != null ? ` ${namePart} ` : ""} ${node.comment ||
										""}`;

							return {
								node,
								tag,
								comment: node.comment?.replace(/^\s*-\s*/, "").trim(),
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
 */
export function parseSimpleJsDocTypeExpression(str: string): SimpleType {
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
		return parseSimpleJsDocTypeExpression(str.trim());
	}

	// Match:
	//   {string|number}
	if (str.includes("|")) {
		return {
			kind: SimpleTypeKind.UNION,
			types: str.split("|").map(str => {
				const childType = parseSimpleJsDocTypeExpression(str);

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
		const type = parseSimpleJsDocTypeExpression(prefixMatch[3]);
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
		return parseSimpleJsDocTypeExpression(parenMatch[1]);
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
	const arrayMatch = str.match(/^\[(.+)]$/);
	if (arrayMatch != null) {
		return {
			kind: SimpleTypeKind.ARRAY,
			type: parseSimpleJsDocTypeExpression(arrayMatch[1])
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
		const typeJsDocTag = jsDoc.tags.find(t => t.tag === "type");

		if (typeJsDocTag != null) {
			// We get the text of the node because typescript strips the type jsdoc tag under certain circumstances
			const parsedJsDoc = parseJsDocTagString(typeJsDocTag.node?.getText() || "");

			if (parsedJsDoc.type != null) {
				return parseSimpleJsDocTypeExpression(parsedJsDoc.type);
			}
		}
	}
}

const JSDOC_TAGS_WITH_REQUIRED_NAME: string[] = ["param", "fires", "@element", "@customElement"];

/**
 * Parses "@tag {type} name description"
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

	// Match type
	// Example: "   {MyType}"
	const typeResult = str.match(/^(\s*{([\s\S]*)})/);
	if (typeResult != null) {
		// Move string to the end of the match
		// Example: "  {MyType}|"
		moveStr(typeResult[1]);
		jsDocTag.type = typeResult[2];
	}

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
			jsDocTag.default = parts[1];
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
		description,
		tags
	};
}
