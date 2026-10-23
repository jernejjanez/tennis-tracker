import {
    Alert,
    AlertColor,
    Button,
    IconButton,
    Snackbar,
    SnackbarCloseReason,
    SvgIcon,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import { LocalizationProvider, MobileDatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import React, { useCallback, useState } from "react";

import "./App.css";
import { SavedEntry, saveEntry, undoEntry } from "./sheetsApi";

const SHEET_IDS = {
    jerry: "702523749",
    zuric: "1206913435",
    vavdi: "2089938286",
} as const;

const LOCATIONS = ["Tivoli", "Svoboda", "Svoboda balon", "Savc", "Padel Tivoli"];

interface Notice {
    severity: AlertColor;
    text: string;
}

const App: React.FC = () => {
    const [date, setDate] = useState<Dayjs | null>(dayjs());
    const [sheetId, setSheetId] = useState("");
    const [location, setLocation] = useState("");
    const [hours, setHours] = useState("");
    const [players, setPlayers] = useState<string[]>(() => []);
    const [after16, setAfter16] = useState<boolean | null>(null);
    const [notice, setNotice] = useState<Notice>({ severity: "success", text: "" });
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [lastSaved, setLastSaved] = useState<SavedEntry | null>(null);
    const [undoing, setUndoing] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);

    const reloadIframe = useCallback(() => setIframeKey((k) => k + 1), []);

    const showNotice = useCallback((severity: AlertColor, text: string) => {
        setNotice({ severity, text });
        setSnackbarOpen(true);
    }, []);

    const handleSheets = useCallback((_: React.MouseEvent<HTMLElement>, newSheetId: string | null) => {
        if (newSheetId !== null) {
            setSheetId(newSheetId);
        }
    }, []);

    const handleHours = useCallback((_: React.MouseEvent<HTMLElement>, newHours: string | null) => {
        if (newHours !== null) {
            setHours(newHours);
        }
    }, []);

    const handleAfter16 = useCallback((_: React.MouseEvent<HTMLElement>, newAfter16: string | null) => {
        if (newAfter16 !== null) {
            setAfter16(newAfter16 === "after16");
        }
    }, []);

    const handlePlayers = useCallback(
        (_: React.MouseEvent<HTMLElement>, newPlayers: string[]) => setPlayers(newPlayers),
        [],
    );

    const handleSubmit = useCallback(async () => {
        setSubmitting(true);
        setSnackbarOpen(false);
        setLastSaved(null);
        const result = await saveEntry({
            sheetId,
            date: date?.format("DD.MM.YYYY") ?? "",
            location,
            hours,
            after16: after16 === true,
            players,
        });
        setSubmitting(false);
        if (result.status === "saved") {
            setLastSaved(result.saved ?? null);
            showNotice(
                "success",
                result.saved
                    ? `Saved to row ${result.saved.row}. Vamos!`
                    : "Saved. Vamos! (Undo needs the updated Google script.)",
            );
            reloadIframe();
        } else if (result.status === "rejected") {
            showNotice("error", `Not saved: ${result.error}`);
        } else {
            showNotice("warning", "Couldn't confirm the save. Check the sheet before submitting again.");
        }
    }, [after16, date, hours, location, players, reloadIframe, sheetId, showNotice]);

    const handleUndo = useCallback(async () => {
        if (lastSaved === null) {
            return;
        }
        setUndoing(true);
        const result = await undoEntry(lastSaved);
        setUndoing(false);
        setLastSaved(null);
        if (result.status === "removed") {
            showNotice("info", "Entry removed. Fix the options and submit again.");
            reloadIframe();
        } else if (result.status === "rejected") {
            showNotice("error", `Not removed: ${result.error}`);
        } else {
            showNotice("warning", "Couldn't confirm the undo. Check the sheet.");
        }
    }, [lastSaved, reloadIframe, showNotice]);

    const handleSnackbarClose = useCallback((_: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
        if (reason === "clickaway") {
            return;
        }
        setSnackbarOpen(false);
    }, []);

    return (
        <div className="wrapper">
            <h1>TENNIS TRACKER</h1>
            Sheet:
            <ToggleButtonGroup exclusive fullWidth onChange={handleSheets} value={sheetId}>
                <ToggleButton classes={{ selected: "selectedSheet" }} value={SHEET_IDS.jerry}>
                    Jerry's sheet
                </ToggleButton>
                <ToggleButton classes={{ selected: "selectedSheet" }} value={SHEET_IDS.zuric}>
                    Žurič's sheet
                </ToggleButton>
                <ToggleButton classes={{ selected: "selectedSheet" }} value={SHEET_IDS.vavdi}>
                    Vavdi's sheet
                </ToggleButton>
            </ToggleButtonGroup>
            Location:
            <div className="locationGrid">
                {LOCATIONS.map((name) => (
                    <ToggleButton
                        classes={{ selected: "selectedLocation" }}
                        key={name}
                        onChange={() => setLocation(name)}
                        selected={location === name}
                        value={name}
                    >
                        {name}
                    </ToggleButton>
                ))}
            </div>
            Date:
            <div className="dateRow">
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={"sl"}>
                    <MobileDatePicker className="datePicker" value={date} onChange={(newValue) => setDate(newValue)} />
                </LocalizationProvider>
                <ToggleButtonGroup
                    className="timeOfDayToggle"
                    exclusive
                    fullWidth
                    onChange={handleAfter16}
                    value={after16 === null ? "" : after16 ? "after16" : "before16"}
                >
                    <ToggleButton classes={{ selected: "selectedTimeOfDay" }} value="before16">
                        Before 16:00
                    </ToggleButton>
                    <ToggleButton classes={{ selected: "selectedTimeOfDay" }} value="after16">
                        After 16:00
                    </ToggleButton>
                </ToggleButtonGroup>
            </div>
            Hours:
            <ToggleButtonGroup exclusive fullWidth onChange={handleHours} value={hours}>
                <ToggleButton classes={{ selected: "selectedHours" }} value="0.5">
                    0.5
                </ToggleButton>
                <ToggleButton classes={{ selected: "selectedHours" }} value="1">
                    1
                </ToggleButton>
                <ToggleButton classes={{ selected: "selectedHours" }} value="1.5">
                    1.5
                </ToggleButton>
                <ToggleButton classes={{ selected: "selectedHours" }} value="2">
                    2
                </ToggleButton>
                <ToggleButton classes={{ selected: "selectedHours" }} value="3">
                    3
                </ToggleButton>
            </ToggleButtonGroup>
            Players:
            <ToggleButtonGroup fullWidth onChange={handlePlayers} value={players}>
                <ToggleButton classes={{ selected: "selectedPlayers" }} value="Jerry">
                    Jerry
                </ToggleButton>
                <ToggleButton classes={{ selected: "selectedPlayers" }} value="Žurič">
                    Žurič
                </ToggleButton>
                <ToggleButton classes={{ selected: "selectedPlayers" }} value="Vavdi">
                    Vavdi
                </ToggleButton>
            </ToggleButtonGroup>
            <Button
                disabled={
                    players.length === 0 ||
                    sheetId === "" ||
                    location === "" ||
                    hours === "" ||
                    after16 === null ||
                    date == null ||
                    undoing
                }
                loading={submitting}
                onClick={handleSubmit}
                variant="contained"
            >
                Submit
            </Button>
            {sheetId === SHEET_IDS.jerry && (
                <iframe
                    key={iframeKey}
                    style={{ height: 500 }}
                    src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQRJ03tnOni_k69NUa3bKab0hKEeW2Jrxq569yImaV9FyDckadlxkzWJVQstvkYCB5TlfZBuN_OYwb9/pubhtml?gid=702523749&amp;single=true&amp;widget=true&amp;headers=false"
                ></iframe>
            )}
            {sheetId === SHEET_IDS.zuric && (
                <iframe
                    key={iframeKey}
                    style={{ height: 500 }}
                    src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQRJ03tnOni_k69NUa3bKab0hKEeW2Jrxq569yImaV9FyDckadlxkzWJVQstvkYCB5TlfZBuN_OYwb9/pubhtml?gid=1206913435&amp;single=true&amp;widget=true&amp;headers=false"
                ></iframe>
            )}
            {sheetId === SHEET_IDS.vavdi && (
                <iframe
                    key={iframeKey}
                    style={{ height: 500 }}
                    src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQRJ03tnOni_k69NUa3bKab0hKEeW2Jrxq569yImaV9FyDckadlxkzWJVQstvkYCB5TlfZBuN_OYwb9/pubhtml?gid=2089938286&amp;single=true&amp;widget=true&amp;headers=false"
                ></iframe>
            )}
            <Snackbar
                autoHideDuration={lastSaved === null ? 6000 : null}
                onClose={handleSnackbarClose}
                open={snackbarOpen}
            >
                <Alert
                    action={
                        // Without an action, Alert shows its own close button.
                        lastSaved === null ? undefined : (
                            <>
                                <Button color="inherit" loading={undoing} onClick={handleUndo} size="small">
                                    Undo
                                </Button>
                                <IconButton
                                    aria-label="Close"
                                    color="inherit"
                                    onClick={handleSnackbarClose}
                                    size="small"
                                >
                                    <SvgIcon fontSize="small">
                                        <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                    </SvgIcon>
                                </IconButton>
                            </>
                        )
                    }
                    onClose={handleSnackbarClose}
                    severity={notice.severity}
                    sx={{ width: "100%" }}
                    variant="filled"
                >
                    {notice.text}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default App;
