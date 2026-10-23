import { afterEach, describe, expect, it, vi } from "vitest";

import { type Entry, saveEntry, undoEntry } from "./sheetsApi";
import { type Cell, createFakeSheet, fetchFrom, loadCodeGs } from "./test/appsScript";

const ENTRY: Entry = {
    sheetId: "702523749",
    date: "22.10.2026",
    location: "Svoboda balon",
    hours: "1.5",
    after16: true,
    players: ["Jerry", "Žurič"],
};

function googleReplies(body: string, status = 200) {
    vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(body, { status })),
    );
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("saveEntry", () => {
    it("offers undo when the script reports the row it saved to", async () => {
        googleReplies('{"ok":true,"row":57}');

        expect(await saveEntry(ENTRY)).toEqual({ status: "saved", saved: { entry: ENTRY, row: 57 } });
    });

    it("offers no undo when the script doesn't report a row", async () => {
        // The script before undo existed replies like this, and would save an undo request as a new entry.
        googleReplies('{"ok":true}');

        expect(await saveEntry(ENTRY)).toEqual({ status: "saved", saved: undefined });
    });

    it("passes on the script's reason when it rejects the entry", async () => {
        googleReplies('{"ok":false,"error":"Sheet with id 1 was not found."}');

        expect(await saveEntry(ENTRY)).toEqual({ status: "rejected", error: "Sheet with id 1 was not found." });
    });

    it.each([
        ["a Google error page", "<!DOCTYPE html><html><head><title>Error</title></head></html>", 200],
        ["a server error", "", 500],
    ])("can't confirm the save when Google answers with %s", async (_, body, status) => {
        googleReplies(body, status);

        expect(await saveEntry(ENTRY)).toEqual({ status: "unconfirmed" });
    });

    it("can't confirm the save when the request fails", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                throw new TypeError("Failed to fetch");
            }),
        );

        expect(await saveEntry(ENTRY)).toEqual({ status: "unconfirmed" });
    });
});

describe("saving and undoing through the Google script", () => {
    const HEADER: Cell[] = ["Date", "Player 1", "Player 2", "Player 3", "Player 4", "Location", "Hours", "After 16"];

    function connectToSheet() {
        const sheet = createFakeSheet(702523749, [HEADER]);
        vi.stubGlobal("fetch", fetchFrom(loadCodeGs([sheet])));
        return sheet;
    }

    it("saves the entry as one row of the sheet", async () => {
        const sheet = connectToSheet();

        expect(await saveEntry(ENTRY)).toMatchObject({ status: "saved", saved: { row: 2 } });
        expect(sheet.row(2).slice(0, 8)).toEqual([
            new Date(2026, 9, 22),
            "Jerry",
            "Žurič",
            "",
            "",
            "Svoboda balon",
            1.5,
            true,
        ]);
    });

    it("undo removes the entry that was saved", async () => {
        const sheet = connectToSheet();
        const result = await saveEntry(ENTRY);
        if (result.status !== "saved" || !result.saved) {
            throw new Error(`Expected an undoable save, got ${JSON.stringify(result)}`);
        }

        expect(await undoEntry(result.saved)).toEqual({ status: "removed" });
        expect(sheet.row(2)).toEqual(Array(10).fill(""));
    });

    it("undo passes on the script's reason when the row has changed", async () => {
        const sheet = connectToSheet();
        const result = await saveEntry(ENTRY);
        if (result.status !== "saved" || !result.saved) {
            throw new Error(`Expected an undoable save, got ${JSON.stringify(result)}`);
        }
        sheet.row(2)[5] = "Tivoli";

        expect(await undoEntry(result.saved)).toEqual({ status: "rejected", error: expect.any(String) });
        expect(sheet.row(2)[0]).toEqual(new Date(2026, 9, 22));
    });

    it("can't confirm the undo when the request fails", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                throw new TypeError("Failed to fetch");
            }),
        );

        expect(await undoEntry({ entry: ENTRY, row: 2 })).toEqual({ status: "unconfirmed" });
    });
});
