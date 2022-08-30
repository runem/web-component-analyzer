import { tsTest } from "../../helpers/ts-test";
import { findAttributeOfName, findHtmlElementOfName, findPropertyOfName, runAndParseWebtypesBuild } from "../../helpers/webtypes-test-utils";
import { WebTypesTransformerConfig } from "../../../src/transformers";
import { SourceModule } from "../../../src/transformers/webtypes/webtypes-schema";

tsTest("Transformer: Webtypes: File header test", t => {
	const config: WebTypesTransformerConfig = {
		name: "PkgTest",
		version: "1.2.3-test",
		"default-icon": "path/foo.png",
		"framework-config": {
			"enable-when": {
				"node-packages": ["lit", "lit-html"]
			}
		},
		framework: "test-fw",
		"description-markup": "html"
	};
	const res = runAndParseWebtypesBuild(
		`
	@customElement('my-element')
	class MyElement extends HTMLElement {}
 	`,
		config
	);

	t.is(res.name, config.name);
	t.is(res.version, config.version);
	t.is(res.framework, config.framework);
	t.is(res["default-icon"], config["default-icon"]);
	t.is(res["description-markup"], config["description-markup"]);
	t.deepEqual(res["framework-config"], config["framework-config"]);
	t.is(res.contributions?.html?.elements?.length, 1);
});

tsTest("Transformer: Webtypes: Basic content test", t => {
	const res = runAndParseWebtypesBuild([
		`
	@customElement('my-element')
	class MyElement extends HTMLElement { 
		@property({type: String, attribute: "my-prop"}) myProp: string;
		@property({type: String, attribute: "my-prop2"}) myProp2: string;
 	}
 	`,
		`
	@customElement('my-element2')
	class MyElement2 extends HTMLElement { 
		@property({type: String, attribute: "my-prop"}) myProp: string;
 	}
 	`
	]);

	t.is(res.contributions?.html?.elements?.length, 2);

	const myElement = findHtmlElementOfName(res, "my-element");
	t.truthy(myElement);
	t.is((myElement?.source as SourceModule)?.symbol, "MyElement");
	// Test element contains expected attributes
	t.is(myElement?.attributes?.length, 2);
	t.truthy(findAttributeOfName(myElement, "my-prop"));
	t.truthy(findAttributeOfName(myElement, "my-prop2"));
	// Test element contains expected properties
	t.is(myElement?.js?.properties?.length, 2);
	t.truthy(findPropertyOfName(myElement, "myProp"));
	t.truthy(findPropertyOfName(myElement, "myProp2"));

	const myElement2 = findHtmlElementOfName(res, "my-element2");
	t.truthy(myElement2);
	t.is((myElement2?.source as SourceModule)?.symbol, "MyElement2");
	t.is(myElement2?.attributes?.length, 1);
	t.truthy(findAttributeOfName(myElement2, "my-prop"));
	t.is(myElement2?.js?.properties?.length, 1);
	t.truthy(findPropertyOfName(myElement2, "myProp"));
});
