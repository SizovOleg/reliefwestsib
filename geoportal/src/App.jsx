import { useEffect } from 'react';
import { Layout, Button, Typography, Space, theme } from 'antd';
import { 
    MenuFoldOutlined, 
    MenuUnfoldOutlined, 
    SunOutlined, 
    MoonOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import useStore from './store';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import AttrTable from './components/AttrTable';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function App() {
    const { token } = theme.useToken();
    
    const darkTheme = useStore((s) => s.darkTheme);
    const toggleTheme = useStore((s) => s.toggleTheme);
    const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
    const setSidebarCollapsed = useStore((s) => s.setSidebarCollapsed);
    const loadInitialData = useStore((s) => s.loadInitialData);
    
    // Load data on mount
    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);
    
    return (
        <Layout style={{ height: '100vh' }}>
            {/* Header */}
            <Header style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '0 20px',
                borderBottom: `1px solid ${token.colorBorder}`,
            }}>
                <Text strong style={{ fontSize: 18, color: token.colorPrimary }}>
                    Геопортал
                </Text>
                <Text type="secondary" style={{ marginLeft: 12, fontSize: 13 }}>
                    Западная Сибирь — ледниковые системы
                </Text>
                
                <Space style={{ marginLeft: 'auto' }}>
                    <Button
                        type="text"
                        icon={darkTheme ? <SunOutlined /> : <MoonOutlined />}
                        onClick={toggleTheme}
                    />
                    <Button
                        type="default"
                        icon={<SettingOutlined />}
                        href="/admin/"
                        size="small"
                    >
                        Админка
                    </Button>
                </Space>
            </Header>
            
            <Layout hasSider>
                {/* Sidebar */}
                <Sider
                    width={380}
                    collapsedWidth={0}
                    collapsed={sidebarCollapsed}
                    trigger={null}
                    style={{
                        borderRight: sidebarCollapsed ? 'none' : `1px solid ${token.colorBorder}`,
                        overflow: 'hidden',
                    }}
                >
                    <Sidebar />
                </Sider>
                
                {/* Toggle button */}
                <Button
                    type="text"
                    icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    style={{
                        position: 'absolute',
                        left: sidebarCollapsed ? 0 : 380,
                        top: 60,
                        zIndex: 1000,
                        background: token.colorBgContainer,
                        border: `1px solid ${token.colorBorder}`,
                        borderLeft: 'none',
                        borderRadius: '0 6px 6px 0',
                        height: 36,
                        transition: 'left 0.2s',
                    }}
                />
                
                {/* Map */}
                <Content style={{ position: 'relative' }}>
                    <MapView />
                </Content>
            </Layout>
            
            {/* Attribute table drawer */}
            <AttrTable />
        </Layout>
    );
}
