import test from "ava";
import * as ts from "typescript";
import { analyzeText } from "../../src/analyze/analyze-text";
import { findChildren } from "../../src/analyze/util/ast-util";
import { resolveNodeValue } from "../../src/analyze/util/resolve-node-value";

test("resolveNodeValue util returns correct values", t => {
	const {
		analyzedSourceFiles: [sourceFile],
		program
	} = analyzeText(` 
const a = [1,2,3, -1, -2, -3];
const b = -1;
const c = +1;
const d = "hello";
const e = true;
const f = {foo: "foo", bar: true};
const g = a;
	`);

	const expectedResults: Record<string, unknown> = {
		a: [1, 2, 3, -1, -2, -3],
		b: -1,
		c: 1,
		d: "hello",
		e: true,
		f: { foo: "foo", bar: true },
		g: [1, 2, 3, -1, -2, -3]
	};
	const checker = program.getTypeChecker();

	findChildren(sourceFile, ts.isVariableDeclaration, ({ initializer, name }) => {
		const actualValue = resolveNodeValue(initializer, { checker, ts })?.value;
		const expectedResult = expectedResults[name.getText()];
		t.deepEqual(actualValue, expectedResult, `Resolved value for '${name.getText()}' is invalid`);
	});
});

test("resolveNodeValue resolves type literals", t => {
	const {
		analyzedSourceFiles: [sourceFile],
		program
	} = analyzeText(`
type StringLiteral = "popsicles";
type AliasedLiteral = StringLiteral;
	`);

	const checker = program.getTypeChecker();

	findChildren(sourceFile, ts.isTypeAliasDeclaration, ({ name, type }) => {
		const actualValue = resolveNodeValue(type, { checker, ts })?.value;
		t.is(actualValue, "popsicles", `Resolved value for '${name.getText()}' is invalid`);
	});
});
