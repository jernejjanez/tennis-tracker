import { describe, expect, it } from "vitest";

import { type Cell, createFakeSheet, loadCodeGs } from "./test/appsScript";

const SHEET_ID = 702523749;
const HEADER: Cell[] = ["Date", "Player 1", "Player 2", "Player 3", "Player 4", "Location", "Hours", "After 16"];
const EARLIER_ENTRY: Cell[] = [new Date(2026, 9, 21), "Jerry", "Vavdi", "", "", "Tivoli", 1, false, "=G2*12", ""];
// Rows below the data can already hold formulas in the columns after the entry.
const FORMULA_ONLY_ROW: Cell[] = ["", "", "", "", "", "", "", "", "=G3*12", ""];

const ENTRY = {
    sheetId: String(SHEET_ID),
    date: "22.10.2026",
    location: "Svoboda balon",
    hours: "1.5",
    after16: true,
    player1: "Jerry",
    player2: "Žurič",
    player3: "",
    player4: "",
};
const ENTRY_AS_STORED: Cell[] = [new Date(2026, 9, 22), "Jerry", "Žurič", "", "", "Svoboda balon", 1.5, true];

function setUp() {
    const sheet = createFakeSheet(SHEET_ID, [HEADER, EARLIER_ENTRY, FORMULA_ONLY_ROW]);
    const handle = loadCodeGs([sheet]);
    const send = (body: object) => JSON.parse(handle(JSON.stringify(body)));
    return { sheet, send };
}

describe("Code.gs", () => {
    it("saves the entry in the first empty row and reports that row", () => {
        const { sheet, send } = setUp();

        expect(send(ENTRY)).toEqual({ ok: true, row: 3 });
        expect(sheet.row(3)).toEqual([...ENTRY_AS_STORED, "=G3*12", ""]);
    });

    it("undo clears the saved entry and leaves the rest of the sheet alone", () => {
        const { sheet, send } = setUp();
        const { row } = send(ENTRY);

        expect(send({ ...ENTRY, action: "undo", row })).toEqual({ ok: true });
        expect(sheet.row(row)).toEqual(FORMULA_ONLY_ROW);
        expect(sheet.row(2)).toEqual(EARLIER_ENTRY);
    });

    it.each([
        ["location", 5, "Tivoli"],
        ["first player", 1, "Vavdi"],
        ["after 16:00", 7, false],
    ])("undo keeps the row when its %s was changed in the sheet", (_, column, edited) => {
        const { sheet, send } = setUp();
        const { row } = send(ENTRY);
        sheet.row(row)[column] = edited;
        const changedRow = [...sheet.row(row)];

        expect(send({ ...ENTRY, action: "undo", row })).toEqual({ ok: false, error: expect.any(String) });
        expect(sheet.row(row)).toEqual(changedRow);
    });

    it("refuses a second undo of the same entry", () => {
        const { sheet, send } = setUp();
        const { row } = send(ENTRY);
        send({ ...ENTRY, action: "undo", row });
        send({ ...ENTRY, location: "Savc" }); // the corrected entry takes the freed row

        expect(send({ ...ENTRY, action: "undo", row })).toEqual({ ok: false, error: expect.any(String) });
        expect(sheet.row(row)[5]).toBe("Savc");
    });
});
