import test from "ava";
import { SimpleType } from "ts-simple-type";
import { parseSimpleJsDocTypeExpression } from "../../../src/analyze/util/js-doc-util";

test("Parse required and union", t => {
	const type = parseSimpleJsDocTypeExpression("!Array|undefined");

	t.deepEqual(type, {
		kind: "UNION",
		types: [{ kind: "ARRAY", type: { kind: "ANY" } }, { kind: "UNDEFINED" }]
	} as SimpleType);
});
