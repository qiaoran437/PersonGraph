import React, { useState, useEffect, useRef } from 'react';
import { 
  Button, Input, message, Space, Select, 
  Card, Row, Col, Statistic, Drawer, Descriptions, List, Spin, Badge,
  Modal, Form, Popconfirm
} from 'antd';
import { 
  SearchOutlined, UserOutlined, TeamOutlined, LinkOutlined, 
  CloseOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

const { Option } = Select;
const API_BASE_URL = 'http://localhost:5000/api';

const RelationManageNew = () => {
  const [allRelations, setAllRelations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedBigRelation, setSelectedBigRelation] = useState('');
  const [statistics, setStatistics] = useState({});
  const [relationTypes, setRelationTypes] = useState({
    big_relations: [],
    small_relations: []
  });
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personRelations, setPersonRelations] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRelation, setEditingRelation] = useState(null);
  const [personImages, setPersonImages] = useState({});
  const [form] = Form.useForm();
  const networkRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchAllRelations();
    fetchStatistics();
    fetchRelationTypes();
    fetchPersonImages();
  }, []);

  useEffect(() => {
    if (allRelations.length > 0 && containerRef.current) {
      renderGraph();
    }
  }, [allRelations, searchText, selectedBigRelation]);

  const fetchAllRelations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/relations`, {
        params: {
          page: 1,
          pageSize: 2000,
          search: '',
          bigRelation: ''
        }
      });
      
      if (response.data.success) {
        setAllRelations(response.data.data);
        message.success(`加载了 ${response.data.data.length} 条关系数据`);
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

  const fetchPersonImages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/person-images`);
      if (response.data.success) {
        setPersonImages(response.data.data);
      }
    } catch (error) {
      console.error('获取人物图片映射失败', error);
    }
  };

  const fetchPersonRelations = async (personName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/persons/${personName}/relations`);
      if (response.data.success) {
        setPersonRelations(response.data.data);
      }
    } catch (error) {
      console.error('获取人物关系失败', error);
    }
  };

  const filterRelations = () => {
    let filtered = allRelations;

    if (searchText) {
      filtered = filtered.filter(rel => 
        rel.person1.includes(searchText) || 
        rel.person2.includes(searchText)
      );
    }

    if (selectedBigRelation) {
      filtered = filtered.filter(rel => rel.big_relation === selectedBigRelation);
    }

    return filtered;
  };

  const renderGraph = () => {
    if (!containerRef.current) return;

    const filtered = filterRelations();
    const nodes = new Map();
    const edges = [];

    // 构建节点和边
    filtered.forEach((rel) => {
      const { person1, person2, big_relation, small_relation } = rel;
      
      if (!nodes.has(person1)) {
        const hasImage = personImages[person1];
        nodes.set(person1, {
          id: person1,
          label: person1,
          shape: hasImage ? 'circularImage' : 'dot',
          image: hasImage ? `${API_BASE_URL}/images/${personImages[person1]}` : undefined,
          color: {
            background: person1 === selectedPerson ? '#ff4d4f' : '#1890ff',
            border: person1 === selectedPerson ? '#cf1322' : '#096dd9',
          },
          font: { 
            color: '#000000',
            size: 14,
            bold: true,
            background: 'rgba(255, 255, 255, 0.8)',
            strokeWidth: 0
          },
          size: 25,
          borderWidth: 3,
        });
      }
      
      if (!nodes.has(person2)) {
        const hasImage = personImages[person2];
        nodes.set(person2, {
          id: person2,
          label: person2,
          shape: hasImage ? 'circularImage' : 'dot',
          image: hasImage ? `${API_BASE_URL}/images/${personImages[person2]}` : undefined,
          color: {
            background: person2 === selectedPerson ? '#ff4d4f' : '#52c41a',
            border: person2 === selectedPerson ? '#cf1322' : '#389e0d',
          },
          font: { 
            color: '#000000',
            size: 14,
            bold: true,
            background: 'rgba(255, 255, 255, 0.8)',
            strokeWidth: 0
          },
          size: 25,
          borderWidth: 3,
        });
      }

      edges.push({
        from: person1,
        to: person2,
        label: big_relation,
        title: `${person1} → ${big_relation}(${small_relation}) → ${person2}`,
        arrows: 'to',
        color: { color: '#bfbfbf', highlight: '#40a9ff' },
        font: { size: 10, align: 'middle' },
        smooth: { type: 'curvedCW', roundness: 0.1 },
      });
    });

    const nodesDataSet = new DataSet(Array.from(nodes.values()));
    const edgesDataSet = new DataSet(edges);

    const data = {
      nodes: nodesDataSet,
      edges: edgesDataSet,
    };

    const options = {
      nodes: {
        shape: 'dot',
        borderWidth: 2,
        shadow: true,
        font: {
          size: 14,
          color: '#000000',
          bold: true,
          background: 'rgba(255, 255, 255, 0.8)',
        },
      },
      edges: {
        width: 1.5,
        shadow: false,
        font: {
          size: 12,
          color: '#000000',
          background: 'rgba(255, 255, 255, 0.9)',
          strokeWidth: 0,
        },
      },
      physics: {
        enabled: true,
        stabilization: {
          iterations: 100,
        },
        barnesHut: {
          gravitationalConstant: -3000,
          centralGravity: 0.3,
          springLength: 150,
          springConstant: 0.04,
          damping: 0.09,
          avoidOverlap: 0.5,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        zoomView: true,
        dragView: true,
        navigationButtons: true,
      },
      layout: {
        improvedLayout: true,
      },
    };

    if (networkRef.current) {
      networkRef.current.destroy();
    }

    networkRef.current = new Network(containerRef.current, data, options);

    // 点击节点事件
    networkRef.current.on('click', async (params) => {
      if (params.nodes.length > 0) {
        const personName = params.nodes[0];
        setSelectedPerson(personName);
        await fetchPersonRelations(personName);
        setDrawerVisible(true);
      }
    });

    // 双击节点聚焦
    networkRef.current.on('doubleClick', (params) => {
      if (params.nodes.length > 0) {
        networkRef.current.focus(params.nodes[0], {
          scale: 1.5,
          animation: true,
        });
      }
    });
  };

  const handleSearch = () => {
    if (allRelations.length > 0 && containerRef.current) {
      renderGraph();
    }
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedBigRelation('');
    if (allRelations.length > 0 && containerRef.current) {
      renderGraph();
    }
  };

  const handleAddRelation = () => {
    setEditingRelation(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditRelation = (relation) => {
    setEditingRelation(relation);
    form.setFieldsValue({
      person1: relation.person1,
      small_relation: relation.small_relation,
      big_relation: relation.big_relation,
      person2: relation.person2
    });
    setModalVisible(true);
  };

  const handleDeleteRelation = async (relationId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/relations/${relationId}`);
      if (response.data.success) {
        message.success('删除成功');
        await fetchAllRelations();
        await fetchStatistics();
        await fetchRelationTypes();
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
          await fetchAllRelations();
        }
      } else {
        const response = await axios.post(`${API_BASE_URL}/relations`, values);
        if (response.data.success) {
          message.success('创建成功');
          setModalVisible(false);
          await fetchAllRelations();
          await fetchStatistics();
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
    }
  };

  const getPersonStats = () => {
    if (!selectedPerson || personRelations.length === 0) return {};

    const relationTypes = new Map();
    const relatedPersons = new Set();

    personRelations.forEach(rel => {
      const relType = rel.big_relation;
      relationTypes.set(relType, (relationTypes.get(relType) || 0) + 1);
      
      if (rel.person1 === selectedPerson) {
        relatedPersons.add(rel.person2);
      } else {
        relatedPersons.add(rel.person1);
      }
    });

    return {
      totalRelations: personRelations.length,
      relatedPersons: relatedPersons.size,
      relationTypes: Array.from(relationTypes.entries()).map(([type, count]) => ({
        type,
        count
      }))
    };
  };

  const stats = selectedPerson ? getPersonStats() : {};

  return (
    <div style={{ padding: '24px', height: 'calc(100vh - 64px)' }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="关系总数"
              value={statistics.total_relations || 0}
              prefix={<LinkOutlined />}
              valueStyle={{ color: '#3f8600', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="人物总数"
              value={statistics.total_persons || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="大类关系"
              value={statistics.total_big_relations || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#cf1322', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="当前显示"
              value={filterRelations().length}
              prefix={<LinkOutlined />}
              valueStyle={{ color: '#722ed1', fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="人物关系图谱" 
        size="small"
        extra={
          <Space>
            <Input
              placeholder="搜索人物"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
              allowClear
            />
            <Select
              placeholder="筛选关系类型"
              style={{ width: 150 }}
              allowClear
              value={selectedBigRelation || undefined}
              onChange={(value) => setSelectedBigRelation(value || '')}
            >
              {relationTypes.big_relations.map(rel => (
                <Option key={rel} value={rel}>{rel}</Option>
              ))}
            </Select>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              筛选
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        }
      >
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            paddingTop: '200px',
            minHeight: '600px'
          }}>
            <Spin size="large" tip="正在加载关系图谱..." />
          </div>
        ) : (
          <>
            <div 
              ref={containerRef}
              style={{ 
                width: '100%',
                height: 'calc(100vh - 300px)',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                background: '#fafafa'
              }}
            />
            <div style={{ marginTop: 12, color: '#666', fontSize: 12 }}>
              <Space split="|">
                <span>💡 <strong>提示</strong>: 点击节点查看人物详情</span>
                <span>🖱️ 双击节点聚焦</span>
                <span>🔍 滚轮缩放</span>
                <span>✋ 拖拽移动</span>
                <span>🔵 蓝色=人物1</span>
                <span>🟢 绿色=人物2</span>
              </Space>
            </div>
          </>
        )}
      </Card>

      <Drawer
        title={
          <Space>
            <UserOutlined />
            <span>{selectedPerson} 的关系统计</span>
          </Space>
        }
        placement="right"
        width={500}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Button 
            type="text" 
            icon={<CloseOutlined />} 
            onClick={() => setDrawerVisible(false)}
          />
        }
      >
        {selectedPerson && (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="关系总数"
                    value={stats.totalRelations || 0}
                    prefix={<LinkOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="关联人物"
                    value={stats.relatedPersons || 0}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>

            <Descriptions title="基本信息" bordered size="small" column={1}>
              <Descriptions.Item label="人物名称">{selectedPerson}</Descriptions.Item>
              <Descriptions.Item label="关系数量">{stats.totalRelations}</Descriptions.Item>
              <Descriptions.Item label="关联人数">{stats.relatedPersons}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <h4>关系类型分布</h4>
              <List
                size="small"
                dataSource={stats.relationTypes || []}
                renderItem={item => (
                  <List.Item>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <span>{item.type}</span>
                      <Badge count={item.count} style={{ backgroundColor: '#52c41a' }} />
                    </Space>
                  </List.Item>
                )}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <h4>所有关系 ({personRelations.length})</h4>
              <List
                size="small"
                bordered
                dataSource={personRelations}
                style={{ maxHeight: 400, overflow: 'auto' }}
                renderItem={rel => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        size="small" 
                        icon={<EditOutlined />}
                        onClick={() => handleEditRelation(rel)}
                      >
                        编辑
                      </Button>,
                      <Popconfirm
                        title="确定删除这条关系吗？"
                        onConfirm={() => handleDeleteRelation(rel.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button 
                          type="link" 
                          size="small" 
                          danger
                          icon={<DeleteOutlined />}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    ]}
                  >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Space>
                        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                          {rel.person1}
                        </span>
                        <span>→</span>
                        <span style={{ color: '#52c41a' }}>
                          {rel.big_relation}({rel.small_relation})
                        </span>
                        <span>→</span>
                        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                          {rel.person2}
                        </span>
                      </Space>
                    </Space>
                  </List.Item>
                )}
              />
            </div>
          </>
        )}
      </Drawer>

      {/* 新增/编辑关系弹窗 */}
      <Modal
        title={editingRelation ? '编辑关系' : '新增关系'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
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
            <Select placeholder="请选择大类关系">
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

export default RelationManageNew;
