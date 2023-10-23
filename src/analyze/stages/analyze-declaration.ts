import { Node, Type, TypeChecker } from "typescript";
import { AnalyzerVisitContext } from "../analyzer-visit-context";
import { AnalyzerDeclarationVisitContext, ComponentFeatureCollection } from "../flavors/analyzer-flavor";
import { ComponentDeclaration } from "../types/component-declaration";
import { getNodeName, getSymbol, resolveDeclarations } from "../util/ast-util";
import { getJsDoc } from "../util/js-doc-util";
import { discoverFeatures } from "./discover-features";
import { discoverInheritance } from "./discover-inheritance";
import { excludeNode } from "./flavor/exclude-node";
import { refineDeclaration } from "./flavor/refine-declaration";
import { mergeFeatures } from "./merge/merge-features";

/**
 * Discovers features on component declaration nodes
 * @param initialDeclarationNodes
 * @param baseContext
 * @param options
 */
export function analyzeComponentDeclaration(
	initialDeclarationNodes: Node[],
	baseContext: AnalyzerVisitContext,
	options: { visitedNodes?: Set<Node> } = {}
): ComponentDeclaration | undefined {
	const mainDeclarationNode = initialDeclarationNodes[0];
	if (mainDeclarationNode == null) {
		return undefined;
		//throw new Error("Couldn't find main declaration node");
	}

	// Check if there exists a cached declaration for this node.
	// If a cached declaration was found, test if it should be invalidated (by looking at inherited declarations)
	const cachedDeclaration = baseContext.cache.componentDeclarationCache.get(mainDeclarationNode);
	if (cachedDeclaration != null && !shouldInvalidateCachedDeclaration(cachedDeclaration, baseContext)) {
		return cachedDeclaration;
	}

	options.visitedNodes = options.visitedNodes || new Set();

	// Discover inheritance
	const { declarationKind, declarationNodes, heritageClauses } = discoverInheritance(initialDeclarationNodes, options.visitedNodes, baseContext);

	// Expand all heritage clauses with the component declaration
	for (const heritageClause of heritageClauses) {
		// Only resolve declarations we haven't yet seen and shouldn't be excluded
		const declarations = resolveDeclarations(heritageClause.identifier, baseContext).filter(
			n => !options.visitedNodes?.has(n) && !shouldExcludeNode(n, baseContext)
		);

		if (declarations.length > 0) {
			heritageClause.declaration = analyzeComponentDeclaration(declarations, baseContext, options);
		}
	}

	const checker = baseContext.checker;

	// Get symbol of main declaration node
	const symbol = getSymbol(mainDeclarationNode, baseContext);

	const sourceFile = mainDeclarationNode.getSourceFile();

	const baseDeclaration: ComponentDeclaration = {
		sourceFile,
		node: mainDeclarationNode,
		declarationNodes: new Set(declarationNodes),
		symbol,
		heritageClauses,
		kind: declarationKind || "class",
		events: [],
		cssParts: [],
		cssProperties: [],
		members: [],
		methods: [],
		slots: [],
		jsDoc: getJsDoc(mainDeclarationNode, baseContext.ts),
		ancestorDeclarationNodeToType: buildAncestorNodeToTypeMap(checker.getTypeAtLocation(mainDeclarationNode), checker)
	};

	// Add the "get declaration" hook to the context
	const context: AnalyzerDeclarationVisitContext = {
		...baseContext,
		declarationNode: mainDeclarationNode,
		sourceFile: mainDeclarationNode.getSourceFile(),
		getDeclaration: () => baseDeclaration
	};

	// Find features on all declaration nodes
	const featureCollections: ComponentFeatureCollection[] = [];

	for (const node of declarationNodes) {
		if (shouldExcludeNode(node, context)) {
			continue;
		}

		// Discover component features using flavors
		featureCollections.push(
			discoverFeatures(node, {
				...context,
				declarationNode: node,
				sourceFile: node.getSourceFile()
			})
		);
	}

	// Add all inherited features to the feature collections array
	for (const heritageClause of heritageClauses) {
		if (heritageClause.declaration != null) {
			featureCollections.push({
				...heritageClause.declaration,
				members: heritageClause.declaration.members
			});
		}
	}

	// If all nodes were excluded, return empty declaration
	if (featureCollections.length === 0) {
		return baseDeclaration;
	}

	// Merge all features into one single collection prioritizing features found in first
	const mergedFeatureCollection = mergeFeatures(featureCollections, context);

	// Refine the declaration and return the result
	const refinedDeclaration = refineDeclaration(
		{
			...baseDeclaration,
			cssParts: mergedFeatureCollection.cssParts,
			cssProperties: mergedFeatureCollection.cssProperties,
			events: mergedFeatureCollection.events,
			methods: mergedFeatureCollection.methods,
			members: mergedFeatureCollection.members,
			slots: mergedFeatureCollection.slots
		},
		context
	);

	Object.assign(baseDeclaration, refinedDeclaration);

	// Update the cache
	baseContext.cache.componentDeclarationCache.set(mainDeclarationNode, baseDeclaration);

	return baseDeclaration;
}

/**
 * Generates a map from declaration nodes in the AST to the type they produce in
 * the base type tree of a given type.
 *
 * For example, this snippet contains three class declarations that produce more
 * than three types:
 *
 * ```
 * class A<T> { p: T; }
 * class B extends A<number> {}
 * class C extends A<boolean> {}
 * ```
 *
 * Classes `B` and `C` each extend `A`, but with different arguments for `A`'s
 * type parameter `T`. This results in the base types of `B` and `C` being
 * distinct specializations of `A` - one for each choice of type arguments -
 * which both have the same declaration `Node` in the AST (`class A<T> ...`).
 *
 * Calling this function with `B`'s `Type` produces a map with two entries:
 * `B`'s `Node` mapped to `B`'s `Type` and `A<T>`'s `Node` mapped to
 * `A<number>`'s `Type`. Calling this function with the `C`'s `Type` produces a
 * map with two entries: `C`'s `Node` mapped to `C`'s `Type` and `A<T>`'s `Node`
 * mapped to `A<boolean>`'s `Type`. Calling this function with `A<T>`'s
 * *unspecialized* type produces a map with one entry: `A<T>`'s `Node` mapped to
 * `A<T>`'s *unspecialized* `Type` (distinct from the types of `A<number>` and
 * `A<boolean>`). In each case, the resulting map contains an entry with
 * `A<T>`'s `Node` as a key but the type that it maps to is different.
 *
 * @param node
 * @param checker
 */
function buildAncestorNodeToTypeMap(rootType: Type, checker: TypeChecker): Map<Node, Type> {
	const m = new Map();
	const walkAncestorTypeTree = (t: Type) => {
		// If the type has any declarations, map them to that type.
		for (const declaration of t.getSymbol()?.getDeclarations() ?? []) {
			m.set(declaration, t);
		}

		// Recurse into base types if `t is InterfaceType`.
		if (t.isClassOrInterface()) {
			for (const baseType of checker.getBaseTypes(t)) {
				walkAncestorTypeTree(baseType);
			}
		}
	};
	walkAncestorTypeTree(rootType);
	return m;
}

/**
 * Returns if a node should be excluded from the analyzing
 * @param node
 * @param context
 */
function shouldExcludeNode(node: Node, context: AnalyzerVisitContext): boolean {
	// Uses flavors to determine if the node should be excluded
	if (excludeNode(node, context)) {
		return true;
	}

	// It's possible to exclude declaration names
	const name = getNodeName(node, context);

	if (name != null && context.config.excludedDeclarationNames?.includes(name)) {
		return true;
	}

	return false;
}

/**
 * Returns if the declaration should be invalidated by testing
 *    if any of the inherited declarations in the tree has been invalidated
 * @param componentDeclaration
 * @param context
 */
function shouldInvalidateCachedDeclaration(componentDeclaration: ComponentDeclaration, context: AnalyzerVisitContext): boolean {
	for (const heritageClause of componentDeclaration.heritageClauses) {
		if (heritageClause.declaration != null) {
			// This declaration shouldn't be invalidated if the existing "node.getSourceFile()" is equal to the "program.getSourceFile(...)" with the same file name,
			const node = heritageClause.declaration.node;
			const oldSourceFile = node.getSourceFile();
			const newSourceFile = context.program.getSourceFile(oldSourceFile.fileName);

			const foundInCache = (newSourceFile != null && newSourceFile === oldSourceFile) ?? false;

			// Return "true" that the declaration should invalidate if it wasn't found in the cache
			if (!foundInCache) {
				return true;
			}

			// Test the inherited declarations recursively
			if (shouldInvalidateCachedDeclaration(heritageClause.declaration, context)) {
				return true;
			}
		}
	}

	return false;
}
