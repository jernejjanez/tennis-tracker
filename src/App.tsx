import { LoadingButton } from "@mui/lab";
import { Alert, Snackbar, SnackbarCloseReason, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { LocalizationProvider, MobileDatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import axios from "axios";
import dayjs, { Dayjs } from "dayjs";
import React, { useCallback, useState } from "react";

import "./App.css";

const App: React.FC = () => {
    const [date, setDate] = useState<Dayjs | null>(dayjs());
    const [sheet, setSheet] = useState("");
    const [hours, setHours] = useState("");
    const [players, setPlayers] = useState<string[]>(() => []);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSheets = useCallback((_: React.MouseEvent<HTMLElement>, newSheet: string | null) => {
        if (newSheet !== null) {
            setSheet(newSheet);
        }
    }, []);

    const handleHours = useCallback((_: React.MouseEvent<HTMLElement>, newHours: string | null) => {
        if (newHours !== null) {
            setHours(newHours);
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
            await axios.post(
                "https://script.google.com/macros/s/AKfycbzVMSuqO7j0ylFXAf_en_32Tw9hmF60RPH1KlQu5LJofBUYyzxWjbVYDLM9_6Mx2gSf/exec",
                {
                    sheet,
                    date: date?.format("DD.MM.YYYY"),
                    hours,
                    player1: players[0] ?? "",
                    player2: players[1] ?? "",
                    player3: players[2] ?? "",
                    player4: players[3] ?? "",
                },
                { headers: { "Content-Type": "text/plain;charset=utf-8" } },
            );
            setSuccessMessage("Successfully saved to sheet. Vamos!");
            setSnackbarOpen(true);
            setSubmitting(false);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(error.message);
            } else {
                console.log(error);
                setErrorMessage("Error submitting data. Check console log.");
            }
            setSnackbarOpen(true);
            setSubmitting(false);
        }
    }, [date, hours, players, sheet]);

    const handleSnackbarClose = useCallback((_: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
        if (reason === "clickaway") {
            return;
        }
        setSnackbarOpen(false);
    }, []);

    return (
        <div className="wrapper">
            <h1>TIVOLI/SVOBODA TRACKER</h1>
            Sheet:
            <ToggleButtonGroup exclusive fullWidth onChange={handleSheets} value={sheet}>
                <ToggleButton classes={{ selected: "selectedSheet" }} value="Dnevnik 2025 - Jerry 30">
                    Jerry's sheet
                </ToggleButton>
                <ToggleButton classes={{ selected: "selectedSheet" }} value="Dnevnik 2025 - Žurič 30">
                    Žurič's sheet
                </ToggleButton>
                <ToggleButton classes={{ selected: "selectedSheet" }} value="Dnevnik 2025 - Vavdi 30">
                    Vavdi's sheet
                </ToggleButton>
            </ToggleButtonGroup>
            Date:
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={"sl"}>
                <MobileDatePicker value={date} onChange={(newValue) => setDate(newValue)} />
            </LocalizationProvider>
            Hours:
            <ToggleButtonGroup exclusive fullWidth onChange={handleHours} value={hours}>
                <ToggleButton classes={{ selected: "selectedHours" }} value="1">
                    1
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
            <LoadingButton
                disabled={players.length === 0 || sheet === "" || hours === "" || date == null}
                loading={submitting}
                onClick={handleSubmit}
                variant="contained"
            >
                Submit
            </LoadingButton>
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
