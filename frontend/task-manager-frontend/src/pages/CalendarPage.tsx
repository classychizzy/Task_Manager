import { useEffect, useState } from "react";
import { getAllProjects } from "../api/project";
import { getAllTasks } from "../api/task";
import type { Task } from "../types/tasks";
import "./CalendarPage.css";

interface TaskWithProject extends Task {
    projectName: string;
    projectId: number;
}

function groupByDate(tasks: TaskWithProject[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);

    const groups: { overdue: TaskWithProject[]; today: TaskWithProject[]; thisWeek: TaskWithProject[]; later: TaskWithProject[]; noDueDate: TaskWithProject[] } = {
        overdue: [],
        today: [],
        thisWeek: [],
        later: [],
        noDueDate: [],
    };

    for (const task of tasks) {
        if (!task.dueDate) {
            groups.noDueDate.push(task);
            continue;
        }
        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);

        if (due < today && task.status !== "completed") {
            groups.overdue.push(task);
        } else if (due.getTime() === today.getTime()) {
            groups.today.push(task);
        } else if (due > today && due <= weekFromNow) {
            groups.thisWeek.push(task);
        } else {
            groups.later.push(task);
        }
    }

    // Sort each group by due date ascending
    const sortByDate = (a: TaskWithProject, b: TaskWithProject) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();

    groups.overdue.sort(sortByDate);
    groups.thisWeek.sort(sortByDate);
    groups.later.sort(sortByDate);

    return groups;
}

export default function CalendarPage() {
    const [tasks, setTasks] = useState<TaskWithProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadAllTasks() {
            try {
                const projectsResponse = await getAllProjects();
                const projects = projectsResponse.data;

                const allTasks: TaskWithProject[] = [];
                for (const project of projects) {
                    const tasksResponse = await getAllTasks(project.project_id);
                    const tagged = tasksResponse.data.map((task) => ({
                        ...task,
                        projectName: project.name,
                        projectId: project.project_id,
                    }));
                    allTasks.push(...tagged);
                }

                setTasks(allTasks);
            } catch (err) {
                setError("Could not load calendar");
            } finally {
                setLoading(false);
            }
        }
        loadAllTasks();
    }, []);

    if (loading) return <p className="calendar-loading">Loading...</p>;
    if (error) return <p className="calendar-error">{error}</p>;

    const groups = groupByDate(tasks);

    const sections = [
        { key: "overdue", label: "Overdue", tasks: groups.overdue },
        { key: "today", label: "Today", tasks: groups.today },
        { key: "thisWeek", label: "This Week", tasks: groups.thisWeek },
        { key: "later", label: "Later", tasks: groups.later },
        { key: "noDueDate", label: "No Due Date", tasks: groups.noDueDate },
    ];

    return (
        <div className="calendar-page">
            <h1>Calendar</h1>

            {tasks.length === 0 ? (
                <p className="calendar-empty">No tasks with due dates yet.</p>
            ) : (
                sections.map((section) =>
                    section.tasks.length === 0 ? null : (
                        <div className="calendar-section" key={section.key}>
                            <h2 className={`calendar-section-title ${section.key === "overdue" ? "overdue-title" : ""}`}>
                                {section.label}
                            </h2>
                            <ul className="calendar-task-list">
                                {section.tasks.map((task) => (
                                    <li key={task.task_id} className="calendar-task-item">
                                        <span className={`status-dot status-${task.status}`} />
                                        <span className="calendar-task-title">{task.title}</span>
                                        <span className="calendar-task-project">{task.projectName}</span>
                                        {task.dueDate && (
                                            <span className="calendar-task-date">
                                                {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                )
            )}
        </div>
    );
}