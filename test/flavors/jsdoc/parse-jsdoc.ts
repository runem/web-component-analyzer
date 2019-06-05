import test from "ava";
import { ParsedJsDocTag, parseJsDocTagComment } from "../../../src/analyze/util/js-doc-util";

const parsedJsDocTag: ParsedJsDocTag = { type: "String", name: "Name", comment: "A comment" };

// Generate checks that check all combinations of: "{Type} Name - Comment"
for (let checkType = 0; checkType <= 1; checkType++) {
	for (let checkName = 0; checkName <= 1; checkName++) {
		for (let checkComment = 0; checkComment <= 1; checkComment++) {
			test(`Parses ${checkType ? "type, " : ""}${checkName ? "name, " : ""}${checkComment ? "comment" : ""}`, t => {
				const expectedType = checkType ? parsedJsDocTag.type : undefined;
				const expectedName = checkName ? parsedJsDocTag.name : undefined;
				const expectedComment = checkComment ? parsedJsDocTag.comment : undefined;

				// Generate a combination of: "{Type} Name - Comment"
				const jsdocComment = `${expectedType ? `{${expectedType}} ` : ""}${expectedName ? expectedName : ""}${expectedComment ? ` - ${expectedComment}` : ""}`;
				const { type, name, comment } = parseJsDocTagComment(jsdocComment);

				t.log("JsDoc Comment: ", jsdocComment);

				t.is(type, expectedType);
				t.is(name, expectedName);
				t.is(comment, expectedComment);
			});
		}
	}
}
