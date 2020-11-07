/* eslint-disable @typescript-eslint/no-explicit-any */
import { isSimpleType, typeToString } from "ts-simple-type";
import { Node, SourceFile, Type, TypeChecker } from "typescript";

function isTypescriptNode(value: any): value is Node {
	return value instanceof Object && "kind" in value && "flags" in value;
}

function isTypescriptSourceFile(value: any): value is SourceFile {
	return value instanceof Object && "kind" in value && "fileName" in value;
}

function isTypescriptType(value: any): value is Type {
	return value instanceof Object && "flags" in value && "checker" in value;
}

/**
 * Returns a representation of the input that can be JSON stringified
 */
export function stripTypescriptValues(input: unknown, checker: TypeChecker, seenValues = new Set<any>()): unknown {
	if (seenValues.has(input)) {
		return "[Circular]";
	}

	seenValues = new Set(seenValues);
	seenValues.add(input);

	if (input == null) {
		return input;
	} else if (typeof input === "function") {
		return stripTypescriptValues(input(), checker, seenValues);
	} else if (isTypescriptSourceFile(input)) {
		return `{SOURCEFILE:${input.fileName.match(".*/(.+)")?.[1]}}`;
	} else if (isTypescriptNode(input)) {
		const title = "escapedText" in input ? (input as any).escapedText : undefined;
		return `{NODE:${input.getSourceFile?.()?.fileName.match(".*/(.+)")?.[1]}${title != null ? `:${title}` : ""}:${input.pos}}`;
	} else if (isTypescriptType(input)) {
		if (checker == null) {
			return "{TYPE}";
		}
		return `{TYPE:${checker.typeToString(input)}}`;
	} else if (isSimpleType(input)) {
		return `{SIMPLE_TYPE:${typeToString(input)}}`;
	} else if (Array.isArray(input)) {
		return input.map(i => stripTypescriptValues(i, checker, seenValues));
	} else if (input instanceof Set) {
		return stripTypescriptValues(Array.from(input), checker, seenValues);
	} else if (input instanceof Map) {
		return stripTypescriptValues(Array.from(input), checker, seenValues);
	} else if (input instanceof Object) {
		const obj: any = {};
		for (const [key, value] of Object.entries(input)) {
			const strippedValue = stripTypescriptValues(value, checker, seenValues);
			if (strippedValue !== undefined && (!Array.isArray(strippedValue) || strippedValue.length > 0)) {
				obj[key] = strippedValue;
			}
		}
		return obj;
	}

	return input;
}
