import { isAssignableToSimpleTypeKind } from "ts-simple-type";
import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";
import { getComponentProp } from "../../helpers/util";

tsTest("Polymer components are correctly picked up", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule(`
		class XCustom extends PolymerElement {
			static get properties() {
				return {
					user: String,
					isHappy: Boolean,
					count: {
						type: Number,
						readOnly: true,
						notify: true,
						value: 10
					}
				}
			}
		}

		customElements.define('x-custom', XCustom);
	 `);

	const { members } = result.componentDefinitions[0].declaration!;

	t.is(members.length, 3);

	const userProp = getComponentProp(members, "user");
	t.truthy(userProp);
	t.truthy(isAssignableToSimpleTypeKind(userProp!.type!(), "STRING", checker));
	t.is(userProp!.attrName, "user");

	const isHappyProp = getComponentProp(members, "isHappy");
	t.truthy(isHappyProp);
	t.truthy(isAssignableToSimpleTypeKind(isHappyProp!.type!(), "BOOLEAN", checker));
	t.is(isHappyProp!.attrName, "is-happy");

	const countProp = getComponentProp(members, "count");
	t.truthy(countProp);
	t.truthy(isAssignableToSimpleTypeKind(countProp!.type!(), "NUMBER", checker));
	t.is(countProp!.attrName, "count");
	t.is(countProp!.default, 10);
});
