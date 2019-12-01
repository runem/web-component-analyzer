import { SimpleType, SimpleTypeKind, toTypeString } from "ts-simple-type";
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

function isSimpleType(value: any): value is SimpleType {
	return value instanceof Object && "kind" in value && Object.values(SimpleTypeKind).includes(value.kind);
}

export function stripTypescriptValues(input: any, checker: TypeChecker): any {
	if (input == null) {
		return input;
	} else if (typeof input === "function") {
		return stripTypescriptValues(input(), checker);
	} else if (isTypescriptSourceFile(input)) {
		return `{SOURCEFILE:${input.fileName.match(".*/(.+)")?.[1]}}`;
	} else if (isTypescriptNode(input)) {
		let title = "escapedText" in input ? (input as any).escapedText : undefined;
		return `{NODE:${input.getSourceFile?.()?.fileName.match(".*/(.+)")?.[1]}${title != null ? `:${title}` : ""}:${input.pos}}`;
	} else if (isTypescriptType(input)) {
		if (checker == null) {
			return "{TYPE}";
		}
		return `{TYPE:${checker.typeToString(input)}}`;
	} else if (isSimpleType(input)) {
		return `{SIMPLE_TYPE:${toTypeString(input)}}`;
	} else if (Array.isArray(input)) {
		return input.map(i => stripTypescriptValues(i, checker));
	} else if (input instanceof Object) {
		const obj = { ...input };
		for (let [key, value] of Object.entries(input)) {
			obj[key] = stripTypescriptValues(value, checker);
		}
		return obj;
	}

	return input;
}
