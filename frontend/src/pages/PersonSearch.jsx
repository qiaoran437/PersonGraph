import React, { useState } from 'react';
import { Card, Input, Button, Table, message, Space, Tag, Empty } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const PersonSearch = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      message.warning('请输入人物名称');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/persons/${searchKeyword}/relations`);
      if (response.data.success) {
        setRelations(response.data.data);
        setSelectedPerson(searchKeyword);
        if (response.data.data.length === 0) {
          message.info('未找到相关关系');
        }
      }
    } catch (error) {
      message.error('查询失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '人物1',
      dataIndex: 'person1',
      key: 'person1',
      render: (text) => (
        <Tag color={text === selectedPerson ? 'red' : 'blue'}>{text}</Tag>
      )
    },
    {
      title: '关系类型',
      key: 'relation',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color="green">{record.big_relation}</Tag>
          <Tag>{record.small_relation}</Tag>
        </Space>
      )
    },
    {
      title: '人物2',
      dataIndex: 'person2',
      key: 'person2',
      render: (text) => (
        <Tag color={text === selectedPerson ? 'red' : 'blue'}>{text}</Tag>
      )
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="人物关系查询">
        <Space style={{ marginBottom: 24 }}>
          <Input
            placeholder="请输入人物名称"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 300 }}
            prefix={<UserOutlined />}
          />
          <Button 
            type="primary" 
            icon={<SearchOutlined />} 
            onClick={handleSearch}
            loading={loading}
          >
            查询
          </Button>
        </Space>

        {selectedPerson && (
          <div style={{ marginBottom: 16 }}>
            <Tag color="red" style={{ fontSize: 16, padding: '8px 16px' }}>
              <UserOutlined /> {selectedPerson} 的关系网络 (共 {relations.length} 条)
            </Tag>
          </div>
        )}

        {relations.length > 0 ? (
          <Table
            columns={columns}
            dataSource={relations}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        ) : (
          !loading && selectedPerson && (
            <Empty description="暂无关系数据" />
          )
        )}
      </Card>
    </div>
  );
};

export default PersonSearch;
