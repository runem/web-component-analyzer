import { SourceFile } from "typescript";
import { ComponentDefinition } from "./features/component-definition";
import { ComponentMember } from "./features/component-member";
import { ComponentEvent } from "./features/component-event";

/**
 * The result returned after components have been analyzed.
 */
export interface AnalyzerResult {
	sourceFile: SourceFile;
	componentDefinitions: ComponentDefinition[];
	globalEvents: ComponentEvent[];
	globalMembers: ComponentMember[];
}
