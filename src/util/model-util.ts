import { VisibilityKind } from "../analyze/types/visibility-kind";

const VISIBILITY_NUMBER_MAP: Record<VisibilityKind, number> = {
	private: 1,
	protected: 2,
	public: 3
};

export function filterVisibility<T extends { visibility?: VisibilityKind }>(visibility: VisibilityKind, array: T[]): T[] {
	const target = VISIBILITY_NUMBER_MAP[visibility];
	return array.filter(item => VISIBILITY_NUMBER_MAP[item.visibility || "public"] >= target);
}
