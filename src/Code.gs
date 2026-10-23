// Sheets turns the date and hours into a date and a number, so undo only compares the
// columns it reads back exactly as written: the players, the location and after 16:00.
const UNDO_CHECKED_COLUMNS = [1, 2, 3, 4, 5, 7];

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const sheetId = Number(data.sheetId);

        if (!Number.isInteger(sheetId)) {
            return createJsonResponse({ ok: false, error: "Missing or invalid sheetId." });
        }

        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = spreadsheet.getSheets().find((currentSheet) => currentSheet.getSheetId() === sheetId);

        if (!sheet) {
            return createJsonResponse({ ok: false, error: `Sheet with id ${sheetId} was not found.` });
        }

        const entry = toRowValues(data);

        if (data.action === "undo") {
            return createJsonResponse(undoEntry(sheet, data.row, entry));
        }

        const firstEmptyRow = getFirstEmptyRowInFirstColumn(sheet);

        sheet.getRange(firstEmptyRow, 1, 1, entry.length).setValues([entry]);

        return createJsonResponse({ ok: true, row: firstEmptyRow });
    } catch (error) {
        return createJsonResponse({ ok: false, error: String(error) });
    }
}

function undoEntry(sheet, row, entry) {
    const range = sheet.getRange(row, 1, 1, entry.length);
    const current = range.getValues()[0];

    if (!UNDO_CHECKED_COLUMNS.every((column) => current[column] === entry[column])) {
        return { ok: false, error: `Row ${row} has changed since this entry was saved, so it was not removed.` };
    }

    // Clear only the entry's cells: deleting the row would shift the rows below it.
    range.clearContent();

    return { ok: true };
}

function toRowValues(data) {
    return [
        data.date || "",
        data.player1 || "",
        data.player2 || "",
        data.player3 || "",
        data.player4 || "",
        data.location || "",
        data.hours || "",
        data.after16 === true,
    ];
}

function createJsonResponse(payload) {
    return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function getFirstEmptyRowInFirstColumn(sheet) {
    const maxRows = sheet.getMaxRows();
    const values = sheet.getRange(1, 1, maxRows, 1).getValues();
    const firstEmptyIndex = values.findIndex((row) => row[0] === "");

    return firstEmptyIndex === -1 ? maxRows + 1 : firstEmptyIndex + 1;
}
