export default function Header({ darkTheme, setDarkTheme }) {
    return (
        <header className="header">
            <div className="logo">Геопортал</div>
            <span className="logo-subtitle">Западная Сибирь — ледниковые системы</span>
            <div className="header-actions">
                <button 
                    className="theme-toggle" 
                    onClick={() => setDarkTheme(!darkTheme)}
                    title="Переключить тему"
                >
                    {darkTheme ? '☀️' : '🌙'}
                </button>
                <a href="/admin/" className="header-btn">
                    ⚙ Админка
                </a>
            </div>
        </header>
    );
}
