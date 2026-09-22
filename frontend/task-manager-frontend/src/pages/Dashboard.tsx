// src/pages/Dashboard.tsx
// import { useAuth } from "../context/authContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import './Dashboard.css'
// Dashboard.tsx
// import SettingsDropdown from "../components/settingsDropdown";



// Placeholder data — replace once you have a real tasks endpoint
const placeholderTasks = [
    { id: 1, title: "Set up backend auth", status: "done" },
    { id: 2, title: "Build login page", status: "done" },
    { id: 3, title: "Build dashboard", status: "progress" },
    { id: 4, title: "Connect tasks API", status: "todo" },
];

const STATUS_GROUPS = [
    { key: "todo", label: "To Do" },
    { key: "progress", label: "In Progress" },
    { key: "done", label: "Done" },
];


export default function Dashboard() {
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    function toggleSection(status: string) {
        setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }));
    }

    const filteredTasks = placeholderTasks.filter((task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    function handleNavigateClick(path: string) {
        navigate(path);
    }






    return (

        <>
            {/* layout defines the main container, header, and footer so we only need to define the main content here 
            The reason we do this is to avoid repeating the same code in every page */}

            <div className="dashboard-toolbar">
                <h2>Your tasks</h2>
                <div className="dashboard-search">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="7" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className={location.pathname.includes("/tasks/new") ? "new-task-button active-button" : "new-task-button"}
                    onClick={() => handleNavigateClick("/projects/:projectId/tasks/new")}
                >+ New Task</button>
            </div>
            {STATUS_GROUPS.map((group) => {
                const tasksInGroup = filteredTasks.filter((t) => t.status === group.key);
                const isCollapsed = collapsed[group.key];

                return (
                    <div className="task-group" key={group.key}>
                        <button
                            className="task-group-header"
                            onClick={() => toggleSection(group.key)}
                        >
                            <span className={`status-dot status-${group.key}`} />
                            <span className="task-group-title">{group.label}</span>
                            <span className="task-group-count">{tasksInGroup.length}</span>
                            <svg
                                className={`chevron ${isCollapsed ? "collapsed" : ""}`}
                                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>

                        {!isCollapsed && (
                            <ul className="task-list">
                                {tasksInGroup.length === 0 ? (
                                    <li className="task-empty">No tasks here</li>
                                ) : (
                                    tasksInGroup.map((task) => (
                                        <li key={task.id} className="task-item">
                                            <span className="task-title">{task.title}</span>
                                        </li>
                                    ))
                                )}
                            </ul>
                        )}
                    </div>
                );
            })}

        </>
    );

}
