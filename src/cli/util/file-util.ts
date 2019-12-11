import { mkdirSync } from "fs";

export function ensureDirSync(dir: string) {
	try {
		return mkdirSync(dir, { recursive: true });
	} catch (err) {
		if (err.code !== "EEXIST") throw err;
	}
}
