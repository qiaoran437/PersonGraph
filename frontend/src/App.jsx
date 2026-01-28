import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { 
  DatabaseOutlined, 
  BarChartOutlined, 
  SearchOutlined,
  TeamOutlined 
} from '@ant-design/icons';
import RelationManageNew from './pages/RelationManageNew';
import PersonSearchNew from './pages/PersonSearchNew';
import PersonManage from './pages/PersonManage';
import './App.css';

const { Header, Content, Footer } = Layout;

function App() {
  const menuItems = [
    {
      key: '/',
      icon: <TeamOutlined />,
      label: <Link to="/">关系网络</Link>,
    },
    {
      key: '/search',
      icon: <SearchOutlined />,
      label: <Link to="/search">人物详情</Link>,
    },
    {
      key: '/manage',
      icon: <DatabaseOutlined />,
      label: <Link to="/manage">人物管理</Link>,
    },
  ];

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center', background: '#001529' }}>
          <div style={{ 
            color: 'white', 
            fontSize: '20px', 
            fontWeight: 'bold',
            marginRight: '50px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <TeamOutlined style={{ marginRight: '10px', fontSize: '24px' }} />
            人物关系图谱系统
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['/']}
            items={menuItems}
            style={{ flex: 1, minWidth: 0 }}
          />
        </Header>
        
        <Content style={{ padding: '0 50px', marginTop: '20px' }}>
          <div style={{ background: '#fff', minHeight: 'calc(100vh - 134px)' }}>
            <Routes>
              <Route path="/" element={<RelationManageNew />} />
              <Route path="/search" element={<PersonSearchNew />} />
              <Route path="/manage" element={<PersonManage />} />
            </Routes>
          </div>
        </Content>
        
        <Footer style={{ textAlign: 'center' }}>
          人物关系图谱系统 ©2026 - 基于 PersonGraphDataSet
        </Footer>
      </Layout>
    </Router>
  );
}

export default App;
