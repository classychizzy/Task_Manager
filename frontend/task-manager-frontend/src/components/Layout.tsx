import { Outlet, useLocation, useNavigate } from "react-router-dom";
// import { useState } from "react";
import { useAuth } from "../context/authContext";
import SettingsDropdown from "./settingsDropdown";
import "../pages/Dashboard.css";


export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    // const [searchQuery, setSearchQuery] = useState("");
    const location = useLocation();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    function handleNavigateClick(path: string) {
        navigate(path);
    }


    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Task Manager</h1>



                {/* middle of the nav */}

                <div className="center-div">
                    {/* /projects */}

                    <button className={location.pathname.includes("/projects") ? "header-button active-button" : "header-button"} onClick={() => handleNavigateClick("/projects")}>Projects</button>
                    {/* /calendar */}
                    <button className={location.pathname.includes("/calendar") ? "header-button active-button" : "header-button"} onClick={() => handleNavigateClick("/calendar")}>Calendar</button>
                    {/* /settings, renders the dropdown menu declared in the components 
                               folder */}
                    <SettingsDropdown />
                    {/* <button className={location.pathname.includes("/settings") ? "header-button active-button" : "header-button"} onClick={() => handleNavigateClick("/settings")}>Settings</button> */}


                </div>



                {/* right side of the nav */}
                <div className="dashboard-header-right">
                    <button className="icon-button" aria-label="Notifications">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    </button>
                    <span className="dashboard-welcome">
                        Welcome, {user?.firstName ?? user?.username}
                    </span>
                    <button className="logout-button" onClick={handleLogout}>
                        Log out
                    </button>
                </div>
            </header>

            <main className="dashboard-main">
                <Outlet />
            </main>
        </div>
    );
}