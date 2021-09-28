import { mkdirSync } from "fs";

export function ensureDirSync(dir: string): void {
	try {
		mkdirSync(dir, { recursive: true });
	} catch (err) {
		if ((err as Error & { code: string }).code !== "EEXIST") throw err;
	}
}
