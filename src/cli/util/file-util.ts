import { mkdirSync } from "fs";

export function ensureDirSync(dir: string): void {
	try {
		mkdirSync(dir, { recursive: true });
	} catch (err) {
		if (err.code !== "EEXIST") throw err;
	}
}
