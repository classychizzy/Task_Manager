import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./SettingsDropdown.css";

export default function SettingsDropdown() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            //prevents the dropwdown from being triggered outside the trigger button
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function go(path: string) {
        setOpen(false);
        navigate(path);
    }

    return (
        <div className="settings-dropdown" ref={ref}>
            {/* if current path contains /settings, highlight the button */}
            <button
                className={location.pathname.includes("/settings") ? "header-button active-button" : "header-button"}
                onClick={() => setOpen((prev) => !prev)}
            >
                Settings
            </button>
            {open && (
                <div className="settings-menu">
                    <button className={location.pathname.includes("/settings/profile") ? "header-button active-button" : "header-button"} onClick={() => go("/settings/profile")}>Profile</button>
                    <button className={location.pathname.includes("/settings/change-password") ? "header-button active-button" : "header-button"} onClick={() => go("/settings/change-password")}>Change Password</button>
                    <button className={location.pathname.includes("/settings/delete-account") ? "header-button active-button" : "header-button"} onClick={() => go("/settings/delete-account")}>Delete Account</button>
                </div>
            )}
        </div>
    );
}