import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllProjects } from "../api/project";
import type { Project } from "../types/project";
import "./ProjectsPage.css";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function loadProjects() {
            try {
                const response = await getAllProjects();
                console.log("Raw projects response:", response); // temporary — confirm shape, remove after
                setProjects(response.data);
            } catch (err) {
                setError("Could not load projects");
            } finally {
                setLoading(false);
            }
        }
        loadProjects();
    }, []);

    if (loading) return <div className="projects-page">Loading...</div>;
    if (error) return <div className="projects-page">{error}</div>;

    return (
        <div className="projects-page">
            <div className="projects-header">
                <h1>Your Projects</h1>
                <button className="new-project-button" onClick={() => { navigate('/projects/new') }}>+ New Project</button>
            </div>

            {projects.length === 0 ? (
                <p className="projects-empty">No projects yet — create your first one.</p>
            ) : (
                <div className="projects-grid">
                    {projects.map((project) => (
                        <button
                            key={project.project_id}
                            className="project-card"
                            onClick={() => navigate(`/projects/${project.project_id}/tasks`)}
                        >
                            <h2>{project.name}</h2>
                            <p>{project.description}</p>
                            <span className="project-task-count">
                                {project.tasks?.length ?? 0} task{project.tasks?.length === 1 ? "" : "s"}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}