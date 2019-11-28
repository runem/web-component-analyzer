import { Node } from "typescript";
import { arrayFlat } from "../../util/array-util";
import { InheritanceTreeClause, InheritanceTreeNode } from "../types/inheritance-tree";

interface Position {
	line: number;
	start: number;
}

interface Context {
	rightPadding: number;
	minArrowSize: number;
	emitText: (text: string, pos: Position) => number;
}

function getNameFromInheritanceClause(inheritsClause: InheritanceTreeClause): string {
	switch (inheritsClause.kind) {
		case "class":
			return `{ ${inheritsClause.identifier.getText()} }`;
		case "interface":
			return `[ ${inheritsClause.identifier.getText()} ]`;
		case "mixin":
			return `( ${inheritsClause.identifier.getText()} )`;
	}
}

function flattenInheritsClauseChain(inheritsClause: InheritanceTreeClause): InheritanceTreeClause[] {
	const next = arrayFlat(inheritsClause.horizontalInherits?.map(flattenInheritsClauseChain) || []);
	return [inheritsClause, ...next];
}

function visitInheritanceTreeClause(inheritsClauses: InheritanceTreeClause[], { line, start }: Position, context: Context): number {
	const flattenedInheritsClauses = arrayFlat(inheritsClauses.map(inheritsClause => flattenInheritsClauseChain(inheritsClause))).filter(
		clause => clause.resolved?.[0]?.node?.kind !== 155
		//clause => clause.resolved?.some(({ node }) => node?.kind !== 155) != null
	);

	let i = 0;
	for (const flatInheritsClause of flattenedInheritsClauses) {
		let nextStart: number | undefined;

		if (flatInheritsClause.resolved != null) {
			nextStart = visitInheritanceTreeNode(flatInheritsClause.resolved, { line: line + 1, start }, context);
		}

		const name = getNameFromInheritanceClause(flatInheritsClause);

		const isLast = i >= flattenedInheritsClauses.length - 1;
		const preferredPadding = isLast ? context.rightPadding : context.minArrowSize;

		const size = Math.max(name.length + preferredPadding, (nextStart || 0) - start);
		const actualPadding = size - name.length;

		const text = `${name}${isLast ? " ".repeat(actualPadding) : ` <${"-".repeat(actualPadding - 3)} `}`;

		start = context.emitText(text, { line, start });
		i += 1;
	}

	return start;
}

function visitInheritanceTreeNode(treeNode: InheritanceTreeNode[], { line, start }: Position, context: Context): number {
	const inherits = arrayFlat(treeNode.map(n => n.inherits || [])).sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "interface" ? 1 : -1));
	return visitInheritanceTreeClause(inherits, { line, start }, context);
}

export function generateInheritanceTreeText(treeNode: InheritanceTreeNode): string {
	const name = `{ ${treeNode.identifier?.getText() || ""} }`;
	const startText = `${name} <-- `;

	const lines = new Map<number, string>();

	lines.set(0, startText);
	const pos = { line: 0, start: startText.length };

	visitInheritanceTreeNode([treeNode], pos, {
		rightPadding: 3,
		minArrowSize: 5,
		emitText: (text, { line, start }) => {
			const existingText = lines.get(line) || "";
			const padding = " ".repeat(start - existingText.length);
			lines.set(line, existingText + padding + text);
			return start + text.length;
		}
	});

	return Array.from(lines.entries())
		.sort(([lineA], [lineB]) => (lineA < lineB ? -1 : 1))
		.map(([, text]) => text)
		.join("\n");
}

export function visiti2InheritanceTreeClause(treeClause: InheritanceTreeClause, nodes: Set<Node>) {
	treeClause.resolved?.forEach(treeNode => visit2InheritanceTreeNode(treeNode, nodes));
	treeClause.horizontalInherits?.forEach(clause => visiti2InheritanceTreeClause(clause, nodes));
}

export function visit2InheritanceTreeNode(treeNode: InheritanceTreeNode, nodes: Set<Node>) {
	nodes.add(treeNode.node);
	treeNode.inherits?.forEach(clause => visiti2InheritanceTreeClause(clause, nodes));
}

export function getUniqueResolvedNodeForInheritanceTree(tree: InheritanceTreeNode): Set<Node> {
	const nodes = new Set<Node>();
	visit2InheritanceTreeNode(tree, nodes);
	return nodes;
}
