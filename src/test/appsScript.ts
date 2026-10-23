import { vi } from "vitest";

import codeGs from "../Code.gs?raw";

export type Cell = string | number | boolean | Date;

export type FakeSheet = ReturnType<typeof createFakeSheet>;

// Sheets turns typed-in text into numbers and dates, so Code.gs doesn't read back
// the strings it wrote for the date and hours. Mirror that for the formats the app sends.
function storedAs(value: Cell): Cell {
    if (typeof value !== "string") {
        return value;
    }
    if (/^\d+(\.\d+)?$/.test(value)) {
        return Number(value);
    }
    const date = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
    return date ? new Date(Number(date[3]), Number(date[2]) - 1, Number(date[1])) : value;
}

/** In-memory stand-in for a Google Sheet with the methods Code.gs calls. */
export function createFakeSheet(sheetId: number, rows: Cell[][], { maxRows = 20, columns = 10 } = {}) {
    const cells: Cell[][] = Array.from({ length: maxRows }, (_, r) =>
        Array.from({ length: columns }, (_, c) => rows[r]?.[c] ?? ""),
    );

    const getRange = (row: number, column: number, numRows: number, numColumns: number) => {
        const fits =
            [row, column, numRows, numColumns].every(Number.isInteger) &&
            row >= 1 &&
            column >= 1 &&
            row + numRows - 1 <= maxRows &&
            column + numColumns - 1 <= columns;
        if (!fits) {
            throw new Error("Exception: The coordinates of the range are outside the dimensions of the sheet.");
        }
        const forEachCell = (visit: (r: number, c: number) => void) => {
            for (let r = 0; r < numRows; r++) {
                for (let c = 0; c < numColumns; c++) {
                    visit(row - 1 + r, column - 1 + c);
                }
            }
        };

        return {
            getValues: () =>
                cells.slice(row - 1, row - 1 + numRows).map((r) => r.slice(column - 1, column - 1 + numColumns)),
            setValues: (values: Cell[][]) => {
                if (values.length !== numRows || values.some((r) => r.length !== numColumns)) {
                    throw new Error("Exception: The number of rows or columns in the data does not match the range.");
                }
                forEachCell((r, c) => (cells[r][c] = storedAs(values[r - row + 1][c - column + 1])));
            },
            clearContent: () => forEachCell((r, c) => (cells[r][c] = "")),
        };
    };

    return {
        getSheetId: () => sheetId,
        getMaxRows: () => maxRows,
        getRange,
        /** The cells of a 1-based row, for tests to read and edit. */
        row: (row: number) => cells[row - 1],
    };
}

/** Runs Code.gs against fake sheets. Returns its web app: request body text in, response text out. */
export function loadCodeGs(sheets: FakeSheet[]) {
    const SpreadsheetApp = { getActiveSpreadsheet: () => ({ getSheets: () => sheets }) };
    const ContentService = {
        MimeType: { JSON: "JSON" },
        createTextOutput: (content: string) => {
            const output = { getContent: () => content, setMimeType: () => output };
            return output;
        },
    };
    const script = new Function("SpreadsheetApp", "ContentService", `${codeGs}\nreturn doPost;`);
    const doPost = script(SpreadsheetApp, ContentService) as (e: { postData: { contents: string } }) => {
        getContent: () => string;
    };

    return (body: string) => doPost({ postData: { contents: body } }).getContent();
}

/**
 * Stands in for the browser calling the deployed script. Like the real thing, only a
 * text/plain POST gets through (other content types need a CORS preflight that Apps Script
 * can't answer), and a no-cors request gets a reply the app can't read.
 */
export function fetchFrom(handle: (body: string) => string) {
    return vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        const contentType = new Headers(init?.headers).get("Content-Type") ?? "";
        if (init?.method !== "POST" || !contentType.startsWith("text/plain")) {
            throw new TypeError("Failed to fetch");
        }
        if (init.mode === "no-cors") {
            return Response.error();
        }
        return new Response(handle(String(init.body)), { headers: { "Content-Type": "application/json" } });
    });
}
