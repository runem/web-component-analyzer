import { ComponentMemberVisibilityKind } from "../types/component-member";

const VISIBILITY_TO_NUMBER: Record<ComponentMemberVisibilityKind, number> = {
	private: 1,
	protected: 2,
	public: 3
};

/**
 * Returns if visibilityA is greater than, less than or equals to visibilityB
 * @param visibilityA
 * @param visibilityB
 */
export function compareVisibility(visibilityA: ComponentMemberVisibilityKind, visibilityB: ComponentMemberVisibilityKind): number {
	const a = VISIBILITY_TO_NUMBER[visibilityA];
	const b = VISIBILITY_TO_NUMBER[visibilityB];
	return a === b ? 0 : a > b ? 1 : -1;
}
