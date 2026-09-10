// src/pages/Dashboard.tsx
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import './Dashboard.css'

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
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    function handleLogout() {
        logout();
        navigate("/login");
    }
    function toggleSection(status: string) {
        setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }));
    }

    const filteredTasks = placeholderTasks.filter((task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
    );


    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Task Manager</h1>

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
                <div className="dashboard-header-right">
                    <button className="icon-button" aria-label="Notifications">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    </button>
                    <span className="dashboard-welcome">
                        Welcome, {user?.firstname ?? user?.username}
                    </span>
                    <button className="logout-button" onClick={handleLogout}>
                        Log out
                    </button>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-toolbar">
                    <h2>Your tasks</h2>
                    <button className="new-task-button">+ New Task</button>
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
            </main>
        </div>
    );

}
