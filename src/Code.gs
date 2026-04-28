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

        const firstEmptyRow = getFirstEmptyRowInFirstColumn(sheet);

        sheet
            .getRange(firstEmptyRow, 1, 1, 8)
            .setValues([
                [
                    data.date || "",
                    data.player1 || "",
                    data.player2 || "",
                    data.player3 || "",
                    data.player4 || "",
                    data.location || "",
                    data.hours || "",
                    data.after16 === true,
                ],
            ]);

        return createJsonResponse({ ok: true });
    } catch (error) {
        return createJsonResponse({ ok: false, error: String(error) });
    }
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
