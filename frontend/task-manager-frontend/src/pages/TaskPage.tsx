import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAllTasks } from "../api/task";
import type { TaskStatus, Task } from "../types/tasks";
import "./TaskPage.css";

const STATUS_GROUPS: { key: TaskStatus; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "in_progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "overdue", label: "Overdue" }
];

export default function TasksPage() {
    console.log('reading taskPage')
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    useEffect(() => {
        async function loadTasks() {
            if (!projectId) return;
            try {
                const response = await getAllTasks(Number(projectId));
                setTasks(response.data);
            } catch (err) {
                setError("Could not load tasks");
            } finally {
                setLoading(false);
            }
        }
        loadTasks();
    }, [projectId]);

    function toggleSection(status: string) {
        setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }));
    }

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="tasks-page">
            <div className="tasks-toolbar">
                <h2>Tasks</h2>
                <button
                    className="new-task-button"
                    onClick={() => navigate(`/projects/${projectId}/tasks/new`)}
                >
                    + New Task
                </button>
            </div>

            {tasks.length === 0 ? (
                <p className="tasks-empty">No tasks yet — create your first one.</p>
            ) : (
                STATUS_GROUPS.map((group) => {
                    const tasksInGroup = tasks.filter((t) => t.status === group.key);
                    const isCollapsed = collapsed[group.key];

                    return (
                        <div className="task-group" key={group.key}>
                            <button className="task-group-header" onClick={() => toggleSection(group.key)}>
                                <span className={`status-dot status-${group.key}`} />
                                <span className="task-group-title">{group.label}</span>
                                <span className="task-group-count">{tasksInGroup.length}</span>
                                <svg className={`chevron ${isCollapsed ? "collapsed" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                            {!isCollapsed && (
                                <ul className="task-list">
                                    {tasksInGroup.length === 0 ? (
                                        <li className="task-empty">No tasks here</li>
                                    ) : (
                                        tasksInGroup.map((task) => (
                                            <li key={task.task_id} className="task-item">
                                                <span className="task-title">{task.title}</span>
                                                {task.dueDate && (
                                                    <span className="task-due">
                                                        {new Date(task.dueDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </li>
                                        ))
                                    )}
                                </ul>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}