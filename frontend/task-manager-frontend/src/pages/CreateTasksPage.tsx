import { useState, type SubmitEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createTask } from "../api/task";
import { type TaskStatus } from "../types/tasks";
import { isAxiosError } from "axios";
import "./CreateTasksPage.css"

export default function CreateTaskPage() {
    console.log('reading create tasks')
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [status, setStatus] = useState<TaskStatus>("pending");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    console.log("status" + status)

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await createTask(Number(projectId), { title, description, dueDate, status });
            navigate(`/projects/${projectId}/tasks`);
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
        <div className="create-task-page">
            <form className="create-task-form" onSubmit={handleSubmit}>
                <h1>New Task</h1>
                <p className="create-task-subtitle">Add a task to this project</p>

                <label htmlFor="title">Title</label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    minLength={5}
                    maxLength={100}
                    placeholder="e.g. Fix login bug"
                />

                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    minLength={15}
                    rows={4}
                    placeholder="What does this task involve?"
                />

                <label htmlFor="dueDate">Due date</label>
                <input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                />

                <label htmlFor="status">Status</label>
                <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                >
                    <option value={"pending"}>Pending</option>
                    <option value={"in_progress"}>In Progress</option>
                    <option value={"completed"}>Completed</option>
                    <option value={"overdue"}>Overdue</option>
                </select>

                {error && <p className="create-task-error">{error}</p>}

                <div className="create-task-actions">
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={() => navigate(`/projects/${projectId}/tasks`)}
                    >
                        Cancel
                    </button>
                    <button type="submit" className="submit-button" disabled={loading}>
                        {loading ? "Creating..." : "Create Task"}
                    </button>
                </div>
            </form>
        </div>
    );
}