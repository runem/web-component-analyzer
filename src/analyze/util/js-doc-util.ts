import { SimpleType, SimpleTypeKind, SimpleTypeStringLiteral } from "ts-simple-type";
import * as tsModule from "typescript";
import { JSDoc, Node } from "typescript";
import { JsDoc, JsDocTag, JsDocTagParsed } from "../types/js-doc";
import { getLeadingCommentForNode } from "./ast-util";
import { lazy } from "./lazy";

function getJSDocNode(node: Node, ts: typeof tsModule): JSDoc | undefined {
	const parent = ts.getJSDocTags(node)?.[0]?.parent;
	if (parent != null && ts.isJSDoc(parent)) {
		return parent;
	}

	return ((node as any).jsDoc as Node[])?.find((n): n is JSDoc => ts.isJSDoc(n));
}

/**
 * Returns jsdoc for a given node.
 * @param node
 * @param tagNames
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

	if (jsDocNode == null) {
		const leadingComment = getLeadingCommentForNode(node, ts);

		if (leadingComment != null) {
			return parseJsDocString(leadingComment);
		}

		return undefined;
	}

	return {
		description: jsDocNode.comment == null ? undefined : String(jsDocNode.comment),
		node: jsDocNode,
		tags:
			jsDocNode.tags == null
				? []
				: jsDocNode.tags
						.map(node => {
							const tag = String(node.tagName.escapedText);

							if (tagNames != null && tagNames.length > 0 && !tagNames.includes(tag.toLowerCase())) {
								return undefined;
							}

							return {
								node,
								tag,
								comment: node.comment,
								// Parse the jsdoc tag comment. Typescript strips descriptions on @type, so in that case, use "node.getText()"
								parsed: lazy(() => parseJsDocTagString(tag === "type" ? node.getText() : `@${tag} ${node.comment || ""}`))
							};
						})
						.filter((tag): tag is NonNullable<typeof tag> => tag != null)
	};
}

/**
 * Converts a given string to a SimpleType
 * Defaults to ANY
 * See http://usejsdoc.org/tags-type.html
 * @param str
 */
export function parseJsDocTypeExpression(str: string): SimpleType {
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
		return parseJsDocTypeExpression(str.trim());
	}

	// Match:
	//   {string|number}
	if (str.includes("|")) {
		return {
			kind: SimpleTypeKind.UNION,
			types: str.split("|").map(str => {
				const childType = parseJsDocTypeExpression(str);

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
		const type = parseJsDocTypeExpression(prefixMatch[3]);
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
		return parseJsDocTypeExpression(parenMatch[1]);
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
			type: parseJsDocTypeExpression(arrayMatch[1])
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
				return parseJsDocTypeExpression(parsedJsDoc.type);
			}
		}
	}
}

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
	const tagResult = str.match(/^(\s*@([\S-]+))/);
	if (tagResult == null) {
		return jsDocTag;
	} else {
		moveStr(tagResult[1]);
		jsDocTag.tag = tagResult[2];
	}

	// Match type
	const typeResult = str.match(/^(\s*\{([\s\S]*)\})/);
	if (typeResult != null) {
		moveStr(typeResult[1]);
		jsDocTag.type = typeResult[2];
	}

	// Match optional name
	const defaultNameResult = str.match(/^(\s*\[([\s\S]+)\])/);
	if (defaultNameResult != null) {
		moveStr(defaultNameResult[1]);
		const parts = defaultNameResult[2].split("=");
		if (parts.length === 2) {
			jsDocTag.name = unqouteStr(parts[0]);
			jsDocTag.default = parts[1];
			jsDocTag.optional = true;
		} else if (parts.length !== 0) {
			jsDocTag.name = unqouteStr(parts[0]);
		}
	} else {
		// Match required name
		const nameResult = str.match(/^(\s*(\S+))((\s*-[\s\S]+)|\s*)($|[\r\n])/);
		if (nameResult != null) {
			moveStr(nameResult[1]);
			jsDocTag.name = unqouteStr(nameResult[2].trim());
		}
	}

	// Match comment
	if (str.length > 0) {
		jsDocTag.description = str.replace(/^\s*-\s*/, "").trim();
	}

	return jsDocTag;
}

function parseJsDocString(doc: string): JsDoc | undefined {
	const lines = doc.split("\n").map(line => line.trim());
	let description = "";
	let readDescription = true;
	let currentTag = "";
	const tags: JsDocTag[] = [];

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

	for (const line of lines) {
		if (line.match(/\*\//)) {
			continue;
		}

		const tagCommentMatch = line.match(/(^\s*\*\s*)@\s*/);
		if (tagCommentMatch != null) {
			commitCurrentTag();
			currentTag += line.substr(tagCommentMatch[1].length);
			readDescription = false;
		} else if (!readDescription) {
			const commentMatch = line.match(/^\s*\*\s*/);
			if (commentMatch != null) {
				currentTag += "\n" + line.substr(commentMatch[0].length);
			}
		} else {
			const startLineMatch = line.match(/^\s*\/\*\*/);
			if (startLineMatch != null) {
				description += line.substr(startLineMatch[0].length);
			}

			const commentMatch = line.match(/^\s*\*\s*/);
			if (commentMatch != null) {
				if (description.length > 0) {
					description += "\n";
				}
				description += line.substr(commentMatch[0].length);
			}
		}
	}

	commitCurrentTag();

	if (description.length === 0 && tags.length === 0) {
		return undefined;
	}

	return {
		description,
		tags
	};
}
