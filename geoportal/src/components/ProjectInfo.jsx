export default function ProjectInfo({ project, loading }) {
    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <span>Загрузка...</span>
            </div>
        );
    }
    
    if (!project) {
        return (
            <div className="project-info">
                <h1>Геопортал</h1>
                <p>Выберите объект на карте для просмотра информации</p>
            </div>
        );
    }
    
    return (
        <div className="project-info">
            <h1>{project.title}</h1>
            <p>{project.description}</p>
        </div>
    );
}
