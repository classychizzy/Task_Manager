import { useState, type SubmitEvent } from "react";
import { useAuth } from "../context/authContext";
import { updateUser } from "../api/auth";
import { isAxiosError } from "axios";
import "./SettingsForm.css";

export default function ProfilePage() {
    const { user } = useAuth();
    const [firstName, setFirstName] = useState(user?.firstName ?? "");
    const [lastName, setLastName] = useState(user?.lastName ?? "");
    const [username, setUsername] = useState(user?.username ?? "");
    const [showEmail, setShowEmail] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);


    function maskEmail(email: string) {
        const [local, domain] = email.split("@");
        const visible = local.slice(0, 1);
        return `${visible}${"*".repeat(Math.max(local.length - 1, 3))}@${domain}`;
    }

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setLoading(true);
        try {
            await updateUser({ firstName, lastName, username });
            setSuccess(true);
        } catch (err) {
            if (isAxiosError(err) && err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError("Something went wrong");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="settings-page">
            <form className="settings-form" onSubmit={handleSubmit}>
                <h1>Profile</h1>

                <label htmlFor="firstName">First name</label>
                <input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} minLength={3} maxLength={50} />

                <label htmlFor="lastName">Last name</label>
                <input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} minLength={3} maxLength={50} />

                <label htmlFor="username">Username</label>
                <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={30} />

                <label htmlFor="email">Email</label>
                <div className="password-field">
                    <input
                        id="email"
                        type="text"
                        value={showEmail ? user?.email ?? "" : maskEmail(user?.email ?? "")}
                        readOnly
                        disabled
                    />
                    <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowEmail((prev) => !prev)}
                        aria-label={showEmail ? "Hide email" : "Show email"}
                    >
                        {/* reuse the same eye / eye-off SVGs from your password toggle */}


                        {showEmail ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                    </button>
                </div>
                {error && <p className="settings-error">{error}</p>}
                {success && <p className="settings-success">Profile updated successfully</p>}

                <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </form>
        </div>
    );
}