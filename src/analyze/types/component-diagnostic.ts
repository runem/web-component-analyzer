import { Node } from "typescript";

export type ComponentDiagnosticSeverity = "error" | "warning";

export interface ComponentDiagnostic {
	message: string;
	severity: ComponentDiagnosticSeverity;
	node: Node;
}
