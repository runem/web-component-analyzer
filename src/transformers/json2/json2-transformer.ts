import * as path from "path";
import { Program } from "typescript";
import ts from 'typescript';

// import { Program, TypeChecker } from "typescript";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
// import { ComponentDefinition } from "../../analyze/types/component-definition";
// import { ComponentCssPart } from "../../analyze/types/features/component-css-part";
// import { ComponentCssProperty } from "../../analyze/types/features/component-css-property";
// import { ComponentEvent } from "../../analyze/types/features/component-event";
// import { ComponentMember } from "../../analyze/types/features/component-member";
// import { ComponentSlot } from "../../analyze/types/features/component-slot";
import { JsDoc } from "../../analyze/types/js-doc";
// import { arrayDefined } from "../../util/array-util";
import { getTypeHintFromType } from "../../util/get-type-hint-from-type";
import { filterVisibility } from "../../util/model-util";
// import { getFirst } from "../../util/set-util";
import { TransformerConfig } from "../transformer-config";
import { TransformerFunction } from "../transformer-function";
// import {
// 	HtmlData,
// 	HtmlDataAttribute,
// 	HtmlDataCssPart,
// 	HtmlDataCssProperty,
// 	HtmlDataEvent,
// 	HtmlDataProperty,
// 	HtmlDataSlot,
// 	HtmlDataTag
// } from "./custom-elements-json-data";

import {PackageDoc, ModuleDoc, CustomElementDoc, ClassMember, Parameter, AttributeDoc, EventDoc, CSSPropertyDoc, CSSPartDoc} from './schema.js';
import { toTypeString } from "ts-simple-type";

/**
 * Transforms results to json.
 * @param results
 * @param program
 * @param config
 */
export const json2Transformer: TransformerFunction = (results: AnalyzerResult[], program: Program, config: TransformerConfig): string => {
	const checker = program.getTypeChecker();
	const cwd = config?.cwd ?? process.cwd();

	const modules: Map<string, ModuleDoc> = new Map();

	// Get all modules
	for (const result of results) {
		const {sourceFile} = result;
		console.log('AA', `\n${sourceFile.fileName}\n${cwd}`);
		// console.log(result);

		// TODO: calculate actual JS output path
		const modulePath = path.basename(sourceFile.fileName);
		let module = modules.get(modulePath);
		if (module === undefined) {
			modules.set(modulePath, module = {
				path: modulePath,
			});
		}

		for (const def of result.componentDefinitions) {
			module.exports = module.exports ?? [];
			const declaration = def.declaration();

			let className: string | undefined;
			for (const node of declaration.declarationNodes) {
				if (ts.isClassDeclaration(node)) {
					className = node.name?.getText();
					break;
				}
			}

			let members: Array<ClassMember> | undefined;
			const visibleMembers = filterVisibility(config.visibility, declaration.members);
			if (visibleMembers.length > 0) {
				members = members ?? [];
				for (const member of visibleMembers) {
					const type = member.type?.();
					if (member.kind === 'property') {
						console.log('property', member.propName, member.default);
						members.push({
							kind: 'field',
							name: member.propName,
							description: getDescriptionFromJsDoc(member.jsDoc),
							default: member.default as any,
							privacy: member.visibility,
							type: type === undefined ? type : toTypeString(type, checker),
						});
					}
				}
			}

			const visibleMethods = filterVisibility(config.visibility, declaration.methods);
			if (visibleMethods.length > 0) {
				members = members ?? [];
				for (const method of visibleMethods) {
					const parameters: Array<Parameter> = [];
					const node = method.node;
					if (node !== undefined && ts.isMethodDeclaration(node)) {
						for (const param of node.parameters) {
							const name = param.name.getText();
							parameters.push({
								name: name,
								type: param.type && toTypeString(checker.getTypeAtLocation(param.type), checker),
								description: getParameterDescriptionFromJsDoc(name, method.jsDoc),
							});
						}
					}

					members.push({
						kind: 'method',
						name: method.name,
						description: getDescriptionFromJsDoc(method.jsDoc),
						privacy: method.visibility,
						parameters,
					});
				}
			}

			const attributes: Array<AttributeDoc> = 
					filterVisibility(config.visibility, declaration.members).map((d) => {
						// const type = d.type?.();
						return {
							name: d.attrName!,
							fieldName: d.propName,
							description: getDescriptionFromJsDoc(d.jsDoc),
							type: getTypeHintFromType(d.typeHint ?? d.type?.(), checker, config),
							default: d.default != null ? JSON.stringify(d.default) : undefined,
						};
					});
				
			const events: Array<EventDoc> = 
				filterVisibility(config.visibility, declaration.events).map(e => {
					return {
						name: e.name!,
						description: getDescriptionFromJsDoc(e.jsDoc),
						type: getTypeHintFromType(e.typeHint ?? e.type?.(), checker, config),
					};
				});
		
			// const slots = arrayDefined(declaration.slots.map(e => componentSlotToHtmlDataSlot(e, checker)));
		
			const cssProperties: Array<CSSPropertyDoc> = declaration.cssProperties.map(p => {
				return {
					name: p.name,
					description: getDescriptionFromJsDoc(p.jsDoc),
					type: getTypeHintFromType(p.typeHint, checker, config),
					default: String(p.default),
				};
			});
		
			const cssParts: Array<CSSPartDoc> = declaration.cssParts.map(p => {
				return {
					name: p.name,
					description: getDescriptionFromJsDoc(p.jsDoc),
				};
			});
				

			let el: CustomElementDoc = {
				kind: 'class',
				name: className,
				description: getDescriptionFromJsDoc(declaration.jsDoc),
				tagName: def.tagName,
				members,
				attributes: attributes.length === 0 ? undefined : attributes,
				events: events.length === 0 ? undefined : events,
				// slots: slots.length === 0 ? undefined : slots,
				cssProperties: cssProperties.length === 0 ? undefined : cssProperties,
				cssParts: cssParts.length === 0 ? undefined : cssParts,		
			};
			module.exports.push(el);
		}
	}

	const packageDoc: PackageDoc = {
		version: "experimental",
		modules: Array.from(modules.values()),
	};

	return JSON.stringify(packageDoc, null, 2);
};

function getDescriptionFromJsDoc(jsDoc: JsDoc | undefined): string | undefined {
	return jsDoc?.description;
}

function getParameterDescriptionFromJsDoc(name: string, jsDoc: JsDoc | undefined): string | undefined {
	if (jsDoc?.tags === undefined) {
		return undefined;
	}
	for (const tag of jsDoc.tags) {
		const parsed = tag.parsed();
		if (parsed.tag === 'param' && parsed.name === name) {
			return parsed.description;
		}
	}
}
