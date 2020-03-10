import { VisibilityKind } from "../analyze/types/visibility-kind";

const VISIBILITY_NUMBER_MAP: Record<VisibilityKind, number> = {
	private: 1,
	protected: 2,
	public: 3
};

/**
 * Removes all items from an array with visibilities that are less visible than "visibility".
 * @param visibility
 * @param array
 */
export function filterVisibility<T extends { visibility?: VisibilityKind }>(visibility: VisibilityKind = "public", array: T[]): T[] {
	const target = VISIBILITY_NUMBER_MAP[visibility];
	return array.filter(item => VISIBILITY_NUMBER_MAP[item.visibility || "public"] >= target);
}
