import test from "ava";
import { SimpleType } from "ts-simple-type";
import { parseSimpleJsDocTypeExpression } from "../../../src/analyze/util/js-doc-util";
import { getCurrentTsModule } from "../../helpers/ts-test";

test("Parse required and union", t => {
	const ts = getCurrentTsModule();
	const program = ts.createProgram([], {});
	const type = parseSimpleJsDocTypeExpression("!Array|undefined", { ts, program });

	t.deepEqual(type, {
		kind: "UNION",
		types: [{ kind: "ARRAY", type: { kind: "ANY" } }, { kind: "UNDEFINED" }]
	} as SimpleType);
});
