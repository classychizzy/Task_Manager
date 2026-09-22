import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../api/project";
import { isAxiosError } from "axios";
import "./CreateProjectpage.css";

export default function CreateProjectPage() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await createProject({ name, description });
            navigate("/projects");
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
        <div className="create-project-page">
            <form className="create-project-form" onSubmit={handleSubmit}>
                <h1>New Project</h1>
                <p className="create-project-subtitle">
                    Give your project a name and description
                </p>

                <label htmlFor="name">Project name</label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={5}
                    maxLength={100}
                    placeholder="e.g. Website Redesign"
                />

                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    minLength={10}
                    rows={4}
                    placeholder="What is this project about?"
                />

                {error && <p className="create-project-error">{error}</p>}

                <div className="create-project-actions">
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={() => navigate("/projects")}
                    >
                        Cancel
                    </button>
                    <button type="submit" className="submit-button" disabled={loading}>
                        {loading ? "Creating..." : "Create Project"}
                    </button>
                </div>
            </form>
        </div>
    );
}