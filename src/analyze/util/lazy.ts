const NOTHING = Symbol();

export function lazy<T>(callback: () => T): () => T {
	let value: T | typeof NOTHING = NOTHING;

	return () => {
		if (value === NOTHING) {
			value = callback();
		}

		return value;
	};
}
