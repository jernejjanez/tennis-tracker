const SHEETS_API_URL =
    "https://script.google.com/macros/s/AKfycbzVMSuqO7j0ylFXAf_en_32Tw9hmF60RPH1KlQu5LJofBUYyzxWjbVYDLM9_6Mx2gSf/exec";

export interface Entry {
    sheetId: string;
    date: string;
    location: string;
    hours: string;
    after16: boolean;
    players: string[];
}

/** An entry the script saved and told us the row of, so it can be undone. */
export interface SavedEntry {
    entry: Entry;
    row: number;
}

export type SaveResult =
    | { status: "saved"; saved?: SavedEntry }
    | { status: "rejected"; error: string }
    | { status: "unconfirmed" };

export type UndoResult = { status: "removed" } | { status: "rejected"; error: string } | { status: "unconfirmed" };

type ScriptReply = { ok: true; row?: number } | { ok: false; error: string };

// Resolves to null when the script's reply can't be read, so it's unknown whether the change was made.
async function post(body: object): Promise<ScriptReply | null> {
    try {
        const response = await fetch(SHEETS_API_URL, {
            method: "POST",
            // text/plain keeps this a simple request; Apps Script can't answer a CORS preflight.
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify(body),
        });
        const reply = response.ok ? await response.json() : null;
        return typeof reply?.ok === "boolean" ? reply : null;
    } catch {
        return null;
    }
}

function toRequest({ players, ...entry }: Entry) {
    return {
        ...entry,
        player1: players[0] ?? "",
        player2: players[1] ?? "",
        player3: players[2] ?? "",
        player4: players[3] ?? "",
    };
}

export async function saveEntry(entry: Entry): Promise<SaveResult> {
    const reply = await post(toRequest(entry));
    if (reply === null) {
        return { status: "unconfirmed" };
    }
    if (!reply.ok) {
        return { status: "rejected", error: reply.error };
    }
    return { status: "saved", saved: typeof reply.row === "number" ? { entry, row: reply.row } : undefined };
}

export async function undoEntry({ entry, row }: SavedEntry): Promise<UndoResult> {
    const reply = await post({ ...toRequest(entry), action: "undo", row });
    if (reply === null) {
        return { status: "unconfirmed" };
    }
    return reply.ok ? { status: "removed" } : { status: "rejected", error: reply.error };
}
