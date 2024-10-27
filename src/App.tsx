import React, { useCallback, useState } from "react";
import "./App.css";
import axios from "axios";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { LocalizationProvider, MobileDatePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LoadingButton } from "@mui/lab";

const App: React.FC = () => {
    const [date, setDate] = useState<Dayjs | null>(dayjs());
    const [hours, setHours] = useState("2");
    const [players, setPlayers] = useState<string[]>(() => ["Jerry", "Žurič", "Vavdi"]);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleHours = useCallback((_: React.MouseEvent<HTMLElement>, newHours: string | null) => {
        if (newHours !== null) {
            setHours(newHours);
        }
    }, []);

    const handlePlayers = useCallback((_: React.MouseEvent<HTMLElement>, newPlayers: string[]) => {
        if (newPlayers.length) {
            setPlayers(newPlayers);
        }
    }, []);

    const handleSubmit = useCallback(async () => {
        setSuccessMessage("");
        setErrorMessage("");
        setSubmitting(true);
        try {
            const response = await axios.post(
                "https://script.google.com/macros/s/AKfycbzVMSuqO7j0ylFXAf_en_32Tw9hmF60RPH1KlQu5LJofBUYyzxWjbVYDLM9_6Mx2gSf/exec",
                {
                    date: date?.format("DD.MM.YYYY"),
                    hours,
                    player1: players[0] ?? "",
                    player2: players[1] ?? "",
                    player3: players[2] ?? "",
                    player4: players[3] ?? "",
                },
                { headers: { "Content-Type": "text/plain;charset=utf-8" } },
            );
            setSuccessMessage(response.data);
            setSubmitting(false);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(error.message);
            } else {
                console.log(error);
                setErrorMessage("Error submitting data. Check console log.");
            }
            setSubmitting(false);
        }
    }, [date, hours, players]);

    return (
        <div className="wrapper">
            <h1>TIVOLI/SVOBODA TRACKER</h1>
            DATE:
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <MobileDatePicker value={date} onChange={(newValue) => setDate(newValue)} />
            </LocalizationProvider>
            HOURS:
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
            PLAYERS:
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
            <LoadingButton onClick={handleSubmit} loading={submitting} variant="contained">
                SUBMIT
            </LoadingButton>
            {successMessage != "" && <div className="successMessage">{successMessage}</div>}
            {errorMessage != "" && <div className="errorMessage">{errorMessage}</div>}
        </div>
    );
};

export default App;
