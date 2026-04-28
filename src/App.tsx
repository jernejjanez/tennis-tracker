import { Alert, Button, Snackbar, SnackbarCloseReason, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { LocalizationProvider, MobileDatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import React, { useCallback, useState } from "react";

import "./App.css";

const SHEETS_API_URL =
    "https://script.google.com/macros/s/AKfycbzVMSuqO7j0ylFXAf_en_32Tw9hmF60RPH1KlQu5LJofBUYyzxWjbVYDLM9_6Mx2gSf/exec";

const SHEET_IDS = {
    jerry: "702523749",
    zuric: "1206913435",
    vavdi: "2089938286",
} as const;

const App: React.FC = () => {
    const [date, setDate] = useState<Dayjs | null>(dayjs());
    const [sheetId, setSheetId] = useState("");
    const [location, setLocation] = useState("");
    const [hours, setHours] = useState("");
    const [players, setPlayers] = useState<string[]>(() => []);
    const [after16, setAfter16] = useState<boolean | null>(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);

    const reloadIframe = useCallback(() => setIframeKey((k) => k + 1), []);

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

    const handleLocation = useCallback((_: React.MouseEvent<HTMLElement>, newLocation: string | null) => {
        if (newLocation !== null) {
            setLocation(newLocation);
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
        setSuccessMessage("");
        setErrorMessage("");
        setSubmitting(true);
        setSnackbarOpen(false);
        try {
            await fetch(SHEETS_API_URL, {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify({
                    sheetId,
                    date: date?.format("DD.MM.YYYY"),
                    location,
                    hours,
                    after16,
                    player1: players[0] ?? "",
                    player2: players[1] ?? "",
                    player3: players[2] ?? "",
                    player4: players[3] ?? "",
                }),
            });
            setSuccessMessage("Successfully saved to sheet. Vamos!");
            setSnackbarOpen(true);
            setSubmitting(false);
            reloadIframe();
        } catch (error) {
            console.log(error);
            setErrorMessage("Error submitting data. Check console log.");
            setSnackbarOpen(true);
            setSubmitting(false);
        }
    }, [after16, date, hours, location, players, reloadIframe, sheetId]);

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
            <ToggleButtonGroup exclusive fullWidth onChange={handleLocation} value={location}>
                <ToggleButton classes={{ selected: "selectedLocation" }} value="Tivoli">
                    Tivoli
                </ToggleButton>
                <ToggleButton classes={{ selected: "selectedLocation" }} value="Svoboda">
                    Svoboda
                </ToggleButton>
                <ToggleButton classes={{ selected: "selectedLocation" }} value="Savc">
                    Savc
                </ToggleButton>
                <ToggleButton classes={{ selected: "selectedLocation" }} value="Padel Tivoli">
                    Padel Tivoli
                </ToggleButton>
            </ToggleButtonGroup>
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
                    date == null
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
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                open={snackbarOpen && (successMessage != "" || errorMessage != "")}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={successMessage != "" ? "success" : "error"}
                    sx={{ width: "100%" }}
                    variant="filled"
                >
                    {successMessage != "" ? successMessage : errorMessage}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default App;
