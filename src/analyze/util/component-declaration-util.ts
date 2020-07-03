import { ComponentDeclaration, ComponentHeritageClause } from "../types/component-declaration";

/**
 * Returns the superclass heritage clause
 * @param declaration
 */
export function getSuperclassHeritageClause(declaration: ComponentDeclaration): ComponentHeritageClause | undefined {
	return (
		declaration.heritageClauses.find(clause => clause.kind === "extends" && clause.declaration?.kind === "class") ||
		declaration.heritageClauses.find(clause => clause.kind === "extends" && clause.declaration == null)
	);
}

/**
 * Returns mixin heritage clauses for the declaration
 * @param declaration
 */
export function getMixinHeritageClauses(declaration: ComponentDeclaration): ComponentHeritageClause[] {
	return declaration.heritageClauses.filter(clause => clause.kind === "mixin" || clause.declaration?.kind === "mixin");
}

/**
 * Returns all extends heritage clauses for the declaration
 * @param declaration
 */
export function getExtendsHeritageClauses(declaration: ComponentDeclaration): ComponentHeritageClause[] {
	return declaration.heritageClauses.filter(clause => clause.kind === "extends");
}

/**
 * Returns mixin heritage clauses for the declaration and all inherited declarations
 * @param declaration
 */
export function getMixinHeritageClausesInChain(declaration: ComponentDeclaration): ComponentHeritageClause[] {
	const clauses: ComponentHeritageClause[] = [];
	visitAllHeritageClauses(declaration, clause => {
		if (clause.kind === "mixin") {
			clauses.push(clause);
		}
	});
	return clauses;
}

/**
 * Returns extends heritage clauses for the declaration and all inherited declarations
 * @param declaration
 */
export function getExtendsHeritageClausesInChain(declaration: ComponentDeclaration): ComponentHeritageClause[] {
	const clauses: ComponentHeritageClause[] = [];
	visitAllHeritageClauses(declaration, clause => {
		if (clause.kind === "extends") {
			clauses.push(clause);
		}
	});
	return clauses;
}

/**
 * A helper function that makes it possible to visit all heritage clauses in the inheritance chain.
 * @param declaration
 * @param emit
 */
export function visitAllHeritageClauses(declaration: ComponentDeclaration, emit: (clause: ComponentHeritageClause) => void): void {
	for (const clause of declaration.heritageClauses) {
		emit(clause);
		if (clause.declaration != null) {
			visitAllHeritageClauses(clause.declaration, emit);
		}
	}
}
