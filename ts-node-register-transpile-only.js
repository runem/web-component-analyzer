// There is currently a problem using ts-node "8.10.2" when registering for ava "3.8.2" with typescript "3.9.5".
// Some imports will fail with: "merge_util_1 is not defined"
// Therefore I temporarily use this custom register module forcing typescript "3.8" to be used instead.
require("ts-node").register({
	transpileOnly: true,
	compiler: "typescript-3.8"
});
