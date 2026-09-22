import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { deleteAccount } from "../api/auth";
import "./SettingsForm.css";

export default function DeleteAccountPage() {
    const [confirmText, setConfirmText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();

    async function handleDelete() {
        setError(null);
        setLoading(true);
        try {
            await deleteAccount();
            logout();
            navigate("/login");
        } catch (err) {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    return (
        <div className="settings-page">
            <div className="settings-form">
                <h1>Delete Account</h1>
                <p className="settings-warning">
                    This action is permanent and cannot be undone. All your projects, tasks, and comments will be lost.
                </p>

                <label htmlFor="confirmText">Type DELETE to confirm</label>
                <input
                    id="confirmText"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                />

                {error && <p className="settings-error">{error}</p>}

                <button
                    className="danger-button"
                    disabled={confirmText !== "DELETE" || loading}
                    onClick={handleDelete}
                >
                    {loading ? "Deleting..." : "Delete My Account"}
                </button>
            </div>
        </div>
    );
}