import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import useStore from './store';
import App from './App';
import 'leaflet/dist/leaflet.css';
import './styles/index.css';

// Shared design tokens
const baseToken = {
    borderRadius: 4,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    colorPrimary: '#4a90a4',
};

function Root() {
    const darkTheme = useStore((s) => s.darkTheme);

    const themeConfig = {
        algorithm: darkTheme ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
            ...baseToken,
            ...(darkTheme ? {
                colorBgContainer: '#1e1e2d',
                colorBgElevated: '#262637',
                colorBgLayout: '#141420',
                colorBorder: '#3a3a4d',
            } : {
                colorBgContainer: '#ffffff',
                colorBgElevated: '#fafafa',
                colorBgLayout: '#f0f2f5',
                colorBorder: '#d9d9d9',
            }),
        },
        components: {
            Layout: {
                headerBg: darkTheme ? '#0d0d14' : '#ffffff',
                siderBg: darkTheme ? '#1e1e2d' : '#ffffff',
                bodyBg: darkTheme ? '#141420' : '#f0f2f5',
                headerHeight: 52,
            },
            Table: {
                headerBg: darkTheme ? '#262637' : '#fafafa',
            },
        },
    };

    return (
        <ConfigProvider theme={themeConfig} locale={ruRU}>
            <AntApp>
                <App />
            </AntApp>
        </ConfigProvider>
    );
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Root />
    </StrictMode>
);
