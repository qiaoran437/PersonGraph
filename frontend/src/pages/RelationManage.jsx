import React, { useState, useEffect, useRef } from 'react';
import { 
  Button, Input, message, Space, Select, 
  Card, Row, Col, Statistic, Tag, Drawer, Descriptions, List, Spin
} from 'antd';
import { 
  SearchOutlined,
  UserOutlined, TeamOutlined, LinkOutlined, CloseOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

const { Option } = Select;

const API_BASE_URL = 'http://localhost:5000/api';

const RelationManage = () => {
  const [allRelations, setAllRelations] = useState([]);
  const [displayRelations, setDisplayRelations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedBigRelation, setSelectedBigRelation] = useState('');
  const [statistics, setStatistics] = useState({});
  const [relationTypes, setRelationTypes] = useState({
    big_relations: [],
    small_relations: []
  });
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personStats, setPersonStats] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const networkRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchAllRelations();
    fetchStatistics();
    fetchRelationTypes();
  }, []);

  useEffect(() => {
    if (displayRelations.length > 0 && containerRef.current) {
      renderGraph();
    }
  }, [displayRelations]);

  const fetchAllRelations = async () => {
    setLoading(true);
    try {
      // 获取前1000条数据用于图谱展示
      const response = await axios.get(`${API_BASE_URL}/relations`, {
        params: {
          page: 1,
          pageSize: 1000,
          search: '',
          bigRelation: ''
        }
      });
      
      if (response.data.success) {
        setAllRelations(response.data.data);
        setDisplayRelations(response.data.data);
      }
    } catch (error) {
      message.error('获取数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/statistics/overview`);
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('获取统计数据失败', error);
    }
  };

  const fetchRelationTypes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/relations-types`);
      if (response.data.success) {
        setRelationTypes(response.data.data);
      }
    } catch (error) {
      console.error('获取关系类型失败', error);
    }
  };

  const handleTableChange = (newPagination) => {
    fetchRelations(
      newPagination.current, 
      newPagination.pageSize, 
      searchText, 
      selectedBigRelation
    );
  };

  const handleSearch = () => {
    fetchRelations(1, pagination.pageSize, searchText, selectedBigRelation);
  };

  const handleBigRelationFilter = (value) => {
    setSelectedBigRelation(value);
    fetchRelations(1, pagination.pageSize, searchText, value);
  };

  const handleAdd = () => {
    setEditingRelation(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRelation(record);
    form.setFieldsValue({
      person1: record.person1,
      small_relation: record.small_relation,
      big_relation: record.big_relation,
      person2: record.person2
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/relations/${id}`);
      if (response.data.success) {
        message.success('删除成功');
        fetchRelations(pagination.current, pagination.pageSize, searchText, selectedBigRelation);
        fetchStatistics();
      }
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingRelation) {
        const response = await axios.put(`${API_BASE_URL}/relations/${editingRelation.id}`, values);
        if (response.data.success) {
          message.success('更新成功');
          setModalVisible(false);
          fetchRelations(pagination.current, pagination.pageSize, searchText, selectedBigRelation);
        }
      } else {
        const response = await axios.post(`${API_BASE_URL}/relations`, values);
        if (response.data.success) {
          message.success('创建成功');
          setModalVisible(false);
          fetchRelations(pagination.current, pagination.pageSize, searchText, selectedBigRelation);
          fetchStatistics();
        }
      }
    } catch (error) {
      if (error.response) {
        message.error(error.response.data.message || '操作失败');
      } else if (error.errorFields) {
        message.error('请填写完整信息');
      } else {
        message.error('操作失败');
      }
      console.error(error);
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
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '小类关系',
      dataIndex: 'small_relation',
      key: 'small_relation',
      width: 120,
    },
    {
      title: '大类关系',
      dataIndex: 'big_relation',
      key: 'big_relation',
      width: 120,
      render: (text) => <Tag color="green">{text}</Tag>
    },
    {
      title: '人物2',
      dataIndex: 'person2',
      key: 'person2',
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条关系吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="关系总数"
              value={statistics.total_relations || 0}
              prefix={<LinkOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="人物总数"
              value={statistics.total_persons || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="大类关系数"
              value={statistics.total_big_relations || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="小类关系数"
              value={statistics.total_small_relations || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="人物关系管理" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
          >
            新增关系
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索人物或关系"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="筛选大类关系"
            style={{ width: 200 }}
            allowClear
            value={selectedBigRelation || undefined}
            onChange={handleBigRelationFilter}
          >
            {relationTypes.big_relations.map(rel => (
              <Option key={rel} value={rel}>{rel}</Option>
            ))}
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={relations}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editingRelation ? '编辑关系' : '新增关系'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="person1"
            label="人物1"
            rules={[{ required: true, message: '请输入人物1' }]}
          >
            <Input placeholder="请输入人物1名称" />
          </Form.Item>

          <Form.Item
            name="big_relation"
            label="大类关系"
            rules={[{ required: true, message: '请选择大类关系' }]}
          >
            <Select 
              placeholder="请选择大类关系"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {relationTypes.big_relations.map(rel => (
                <Option key={rel} value={rel}>{rel}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="small_relation"
            label="小类关系"
            rules={[{ required: true, message: '请输入小类关系' }]}
          >
            <Input placeholder="请输入小类关系" />
          </Form.Item>

          <Form.Item
            name="person2"
            label="人物2"
            rules={[{ required: true, message: '请输入人物2' }]}
          >
            <Input placeholder="请输入人物2名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RelationManage;
