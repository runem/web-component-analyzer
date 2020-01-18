import { TransformerConfig } from "../transformer-config";

/**
 * Returns a markdown header with a specific level taking global start title level into account.
 * @param title
 * @param level
 * @param config
 */
export function markdownHeader(title: string, level: number, config: TransformerConfig): string {
	level = level - 1 + (config.markdown?.headerLevel || config.markdown?.titleLevel || 1);
	return `${"#".repeat(level)} ${title}`;
}

/**
 * Returns a markdown table representation of the rows.
 * Strips unused columns.
 * @param rows
 * @param removeEmptyColumns
 */
export function markdownTable(rows: string[][], { removeEmptyColumns } = { removeEmptyColumns: true }): string {
	// Constants for pretty printing the markdown tables
	const MIN_CELL_WIDTH = 3;
	const MAX_CELL_WIDTH = 50;
	const CELL_PADDING = 1;

	// Count the number of columns
	let columnCount = Math.max(...rows.map(r => r.length));

	if (removeEmptyColumns) {
		// Create a boolean array where each entry tells if a column is used or not (excluding the header)
		const emptyColumns = Array(columnCount)
			.fill(false)
			.map((b, i) => i !== 0 && rows.slice(1).find(r => r[i] != null && r[i].length > 0) == null);

		// Remove unused columns if necessary
		if (emptyColumns.includes(true)) {
			// Filter out the unused columns in each row
			rows = rows.map(row => row.filter((column, i) => !emptyColumns[i]));

			// Adjust the column count
			columnCount = Math.max(...rows.map(r => r.length));
		}
	}

	// Escape all cells in the markdown output
	rows = rows.map(r => r.map(markdownEscapeTableCell));

	// Create a boolean array where each entry corresponds to the preferred column width.
	// This is done by taking the largest width of all cells in each column.
	const columnWidths = Array(columnCount)
		.fill(0)
		.map((c, i) => Math.min(MAX_CELL_WIDTH, Math.max(MIN_CELL_WIDTH, ...rows.map(r => (r[i] || "").length)) + CELL_PADDING * 2));

	// Build up the table
	return `
|${rows[0].map((r, i) => fillWidth(r, columnWidths[i], CELL_PADDING)).join("|")}|
|${columnWidths.map(c => "-".repeat(c)).join("|")}|
${rows
	.slice(1)
	.map(r => `|${r.map((r, i) => fillWidth(r, columnWidths[i], CELL_PADDING)).join("|")}|`)
	.join("\n")}
`;
}

/**
 * Escape a text so it can be used in a markdown table
 * @param text
 */
export function markdownEscapeTableCell(text: string): string {
	return text.replace(/\n/g, "<br />").replace(/\|/g, "\\|");
}

/**
 * Highlights some text
 * @param text
 */
export function markdownHighlight(text: string | undefined): string {
	if (text == null || text.length === 0) return "";
	return `\`${text}\``;
}

/**
 * Creates padding around some text with a target width.
 * @param text
 * @param width
 * @param paddingStart
 */
export function fillWidth(text: string, width: number, paddingStart: number): string {
	return " ".repeat(paddingStart) + text + " ".repeat(Math.max(1, width - text.length - paddingStart));
}
