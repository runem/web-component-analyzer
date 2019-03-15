import { testResult } from "../helpers/source-file-test";

testResult("Custom Element: Attributes", "custom-element/custom-element.ts", (result, t) => {
	t.is(result.componentDefinitions.length, 1);

	const definition = result.componentDefinitions[0];
	t.is(definition.declaration.members.length, 3);
});
