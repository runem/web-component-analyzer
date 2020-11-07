import { SimpleType, typeToString } from "ts-simple-type";
import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";

tsTest("Correctly discovers dispatched events and corresponding event types", t => {
	const {
		results: [result],
		program
	} = analyzeTextWithCurrentTsModule({
		includeLib: true,
		fileName: "test.d.ts",
		text: `
		class MyElement extends HTMLElement {
			myMethod() {
				this.dispatchEvent(new CustomEvent("my-event"));
				this.dispatchEvent(new CustomEvent("my-event-2",  {detail: "foobar"}));
				this.dispatchEvent(new CustomEvent<number>("my-event-3"));
				this.dispatchEvent(new MouseEvent("my-event-4"));
				this.dispatchEvent(new Event("my-event-5"));
			}
		}
		customElements.define("my-element", MyElement);
	 `
	});

	const { events } = result.componentDefinitions[0].declaration!;

	const assertEvent = (name: string, typeName: string) => {
		const event = events.find(e => e.name === name);
		if (event == null) {
			t.fail(`Couldn't find event with name: ${name}`);
			return;
		}

		t.is(typeToString(event.type!() as SimpleType, program.getTypeChecker()), typeName);
	};

	t.is(events.length, 5);

	assertEvent("my-event", "CustomEvent<unknown>");
	assertEvent("my-event-2", "CustomEvent<string>");
	assertEvent("my-event-3", "CustomEvent<number>");
	assertEvent("my-event-4", "MouseEvent");
	assertEvent("my-event-5", "Event");
});
