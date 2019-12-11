import { Node } from "typescript";
import { arrayFlat } from "../../util/array-util";
import { InheritanceTreeClause, InheritanceTreeNode } from "../types/inheritance-tree";

interface Position {
	line: number;
	start: number;
}

interface EmitTextContext {
	rightPadding: number;
	minArrowSize: number;
	emitText: (text: string, pos: Position) => number;
}

/**
 * Returns the text representation of an inheritance clause
 * @param inheritsClause
 */
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

/**
 * Returns all inheritance tree clauses by flattening horizontal inherits recursively
 * @param inheritsClause
 */
function flattenInheritsClauseChain(inheritsClause: InheritanceTreeClause): InheritanceTreeClause[] {
	const next = arrayFlat(inheritsClause.horizontalInherits?.map(flattenInheritsClauseChain) || []);
	return [inheritsClause, ...next];
}

/**
 * Visits inheritance tree clause and emits texts
 * @param inheritsClauses
 * @param line
 * @param start
 * @param context
 */
function visitInheritanceTreeClauseEmitText(inheritsClauses: InheritanceTreeClause[], { line, start }: Position, context: EmitTextContext): number {
	const flattenedInheritsClauses = arrayFlat(inheritsClauses.map(inheritsClause => flattenInheritsClauseChain(inheritsClause))).filter(clause =>
		clause.resolved?.some(n => n.node?.kind !== 155)
	);

	let i = 0;
	for (const flatInheritsClause of flattenedInheritsClauses) {
		let nextStart: number | undefined;

		const name = getNameFromInheritanceClause(flatInheritsClause);

		console.log("NAME", { name, kind: flatInheritsClause.kind, idd: flatInheritsClause.resolved?.[0]?.node.kind });

		if (name !== "{ HTMLElement }") {
			// Emit text for the resolved extends node recursively on next line
			if (flatInheritsClause.resolved != null) {
				// This function returns the maximum width of the line
				nextStart = visitInheritanceTreeNodeEmitText(
					flatInheritsClause.resolved,
					{
						line: line + 1,
						start
					},
					context
				);
			}
		}

		// Calculate padding
		const isLast = i >= flattenedInheritsClauses.length - 1;
		const preferredPadding = isLast ? context.rightPadding : context.minArrowSize;
		const size = Math.max(name.length + preferredPadding, (nextStart || 0) - start);
		const actualPadding = size - name.length;

		// Prepares the text
		const text = `${name}${isLast ? " ".repeat(actualPadding) : ` <${"-".repeat(actualPadding - 3)} `}`;

		// Emit the text and grab next start
		start = context.emitText(text, { line, start });

		i += 1;
	}

	return start;
}

/**
 * Visits an inheritance tree node recusively.
 * Emits text while traversing.
 * @param treeNode
 * @param line
 * @param start
 * @param context
 */
function visitInheritanceTreeNodeEmitText(treeNode: InheritanceTreeNode[], { line, start }: Position, context: EmitTextContext): number {
	const inherits = arrayFlat(treeNode.map(n => n.inherits || [])).sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "interface" ? 1 : -1));
	return visitInheritanceTreeClauseEmitText(inherits, { line, start }, context);
}

/**
 * Generates a textual representation of an inheritance tree.
 * @param treeNode
 */
export function generateInheritanceTreeText(treeNode: InheritanceTreeNode): string {
	// Add the start node to the text
	const name = `{ ${treeNode.identifier?.getText() || ""} }`;
	const startText = `${name} <-- `;

	const lines = new Map<number, string>();

	lines.set(0, startText);
	const pos = { line: 0, start: startText.length };

	// Visit the inheritance tree recursively
	visitInheritanceTreeNodeEmitText([treeNode], pos, {
		rightPadding: 3,
		minArrowSize: 5,
		emitText: (text, { line, start }) => {
			const existingText = lines.get(line) || "";
			const padding = " ".repeat(start - existingText.length);
			lines.set(line, existingText + padding + text);
			return start + text.length;
		}
	});

	// Join all lines
	return Array.from(lines.entries())
		.sort(([lineA], [lineB]) => (lineA < lineB ? -1 : 1))
		.map(([, text]) => text)
		.join("\n");
}

interface VisitInheritanceTreeContext {
	emitTreeNode?: (treeNode: InheritanceTreeNode) => void;
	emitTreeClause?: (treeNode: InheritanceTreeClause) => void;
}

/**
 * Visits inheritance tree clause
 * @param treeClause
 * @param context
 */
function visitInheritanceTreeClause(treeClause: InheritanceTreeClause, context: VisitInheritanceTreeContext) {
	context.emitTreeClause?.(treeClause);
	treeClause.resolved?.forEach(treeNode => visitInheritanceTreeNode(treeNode, context));
	treeClause.horizontalInherits?.forEach(clause => visitInheritanceTreeClause(clause, context));
}

/**
 * Visits inheritance tree node
 * @param treeNode
 * @param context
 */
function visitInheritanceTreeNode(treeNode: InheritanceTreeNode, context: VisitInheritanceTreeContext) {
	context.emitTreeNode?.(treeNode);
	treeNode.inherits?.forEach(clause => visitInheritanceTreeClause(clause, context));
}

/**
 * Gets all unique resolved nodes in an inheritance tree
 * @param tree
 */
export function getUniqueResolvedNodeForInheritanceTree(tree: InheritanceTreeNode): Set<Node> {
	const nodes = new Set<Node>();
	visitInheritanceTreeNode(tree, {
		emitTreeNode: treeNode => nodes.add(treeNode.node)
	});
	return nodes;
}

/**
 * Gets all mixins in an inheritance tree
 * @param tree
 */
export function getMixinsForInheritanceTree(tree: InheritanceTreeNode): Set<string> {
	const mixins = new Set<string>();
	visitInheritanceTreeNode(tree, {
		emitTreeClause: treeClause => {
			if (treeClause.kind === "mixin") {
				mixins.add(treeClause.identifier.text);
			}
		}
	});
	return mixins;
}

/**
 * Gets all extend nodes in an inheritance tree
 * @param tree
 */
export function getExtendsForInheritanceTree(tree: InheritanceTreeNode): Set<string> {
	const ext = new Set<string>();
	visitInheritanceTreeNode(tree, {
		emitTreeClause: treeClause => {
			if (treeClause.kind === "class" || treeClause.kind === "interface") {
				ext.add(treeClause.identifier.text);
			}
		}
	});
	return ext;
}
