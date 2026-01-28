import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, message, Space, Row, Col, Statistic, List, Badge, Spin, Modal, Form, Select, Popconfirm } from 'antd';
import { SearchOutlined, UserOutlined, LinkOutlined, TeamOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

const { Option } = Select;

const API_BASE_URL = 'http://localhost:5000/api';

const PersonSearchNew = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [personImages, setPersonImages] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRelation, setEditingRelation] = useState(null);
  const [relationTypes, setRelationTypes] = useState({ big_relations: [], small_relations: [] });
  const [form] = Form.useForm();
  const networkRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchPersonImages();
    fetchRelationTypes();
  }, []);

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

  useEffect(() => {
    if (relations.length > 0 && containerRef.current) {
      renderGraph();
    }
  }, [relations, personImages]);

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

  const handleAddRelation = () => {
    setEditingRelation(null);
    form.resetFields();
    if (selectedPerson) {
      form.setFieldsValue({ person1: selectedPerson });
    }
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
        if (selectedPerson) {
          await handleSearch();
        }
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
          if (selectedPerson) {
            await handleSearch();
          }
        }
      } else {
        const response = await axios.post(`${API_BASE_URL}/relations`, values);
        if (response.data.success) {
          message.success('创建成功');
          setModalVisible(false);
          if (selectedPerson) {
            await handleSearch();
          }
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
        } else {
          message.success(`找到 ${response.data.data.length} 条关系`);
        }
      }
    } catch (error) {
      message.error('查询失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getPersonStats = () => {
    if (!selectedPerson || relations.length === 0) return {};

    const relationTypes = new Map();
    const relatedPersons = new Set();
    const bigRelationTypes = new Map();

    relations.forEach(rel => {
      const relType = rel.big_relation;
      bigRelationTypes.set(relType, (bigRelationTypes.get(relType) || 0) + 1);
      
      const smallRelType = rel.small_relation;
      relationTypes.set(smallRelType, (relationTypes.get(smallRelType) || 0) + 1);
      
      if (rel.person1 === selectedPerson) {
        relatedPersons.add(rel.person2);
      } else {
        relatedPersons.add(rel.person1);
      }
    });

    return {
      totalRelations: relations.length,
      relatedPersons: relatedPersons.size,
      bigRelationTypes: Array.from(bigRelationTypes.entries()).map(([type, count]) => ({
        type,
        count
      })),
      relationTypes: Array.from(relationTypes.entries()).map(([type, count]) => ({
        type,
        count
      }))
    };
  };

  const renderGraph = () => {
    if (!containerRef.current) return;

    const nodes = new Map();
    const edges = [];

    // 添加中心节点
    const centerHasImage = personImages[selectedPerson];
    nodes.set(selectedPerson, {
      id: selectedPerson,
      label: selectedPerson,
      shape: centerHasImage ? 'circularImage' : 'dot',
      image: centerHasImage ? `${API_BASE_URL}/images/${personImages[selectedPerson]}` : undefined,
      color: {
        background: '#ff4d4f',
        border: '#cf1322',
        highlight: {
          background: '#ff7875',
          border: '#cf1322',
        }
      },
      font: { 
        color: '#000000',
        size: 16,
        bold: true,
        background: 'rgba(255, 255, 255, 0.9)',
        strokeWidth: 0
      },
      size: 35,
      borderWidth: 4,
    });

    // 添加关系节点和边
    relations.forEach((rel) => {
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
        label: `${big_relation}`,
        title: `${person1} → ${big_relation}(${small_relation}) → ${person2}`,
        arrows: 'to',
        color: { color: '#91d5ff', highlight: '#40a9ff' },
        font: { 
          size: 12, 
          align: 'middle',
          color: '#000000',
          background: 'rgba(255, 255, 255, 0.9)',
          strokeWidth: 0
        },
        smooth: { type: 'curvedCW', roundness: 0.2 },
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
      },
      edges: {
        width: 2,
        shadow: true,
      },
      physics: {
        enabled: true,
        stabilization: {
          iterations: 200,
        },
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.3,
          springLength: 200,
          springConstant: 0.04,
          damping: 0.09,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true,
      },
      layout: {
        improvedLayout: true,
      },
    };

    if (networkRef.current) {
      networkRef.current.destroy();
    }

    networkRef.current = new Network(containerRef.current, data, options);
  };

  const stats = getPersonStats();

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title="人物详情查询" 
        size="small"
        extra={
          selectedPerson && relations.length > 0 && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAddRelation}
            >
              新增关系
            </Button>
          )
        }
      >
        <Space style={{ marginBottom: 24 }}>
          <Input
            placeholder="搜索人物"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 300 }}
            prefix={<UserOutlined />}
            allowClear
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" tip="正在查询..." />
          </div>
        ) : selectedPerson && relations.length > 0 ? (
          <>
            {/* 统计卡片 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="关系总数"
                    value={stats.totalRelations || 0}
                    prefix={<LinkOutlined />}
                    valueStyle={{ color: '#3f8600', fontSize: 24 }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="关联人物"
                    value={stats.relatedPersons || 0}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#1890ff', fontSize: 24 }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="关系类型"
                    value={stats.bigRelationTypes?.length || 0}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#cf1322', fontSize: 24 }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 关系类型分布 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card title={`所有关系列表 (${relations.length})`} size="small">
                  <List
                    size="small"
                    bordered
                    dataSource={relations}
                    style={{ maxHeight: 300, overflow: 'auto' }}
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
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>

            {/* 知识图谱 */}
            <Card title={`${selectedPerson} 的关系图谱`} size="small">
              <div 
                ref={containerRef}
                style={{ 
                  width: '100%',
                  height: '500px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px',
                  background: '#fafafa'
                }}
              />
              <div style={{ marginTop: 12, color: '#666', fontSize: 12 }}>
                <Space split="|">
                  <span>🔴 红色节点：查询的中心人物</span>
                  <span>🔵 蓝色节点：人物1</span>
                  <span>🟢 绿色节点：人物2</span>
                  <span>🖱️ 可拖拽节点</span>
                  <span>🔍 滚轮缩放</span>
                </Space>
              </div>
            </Card>
          </>
        ) : selectedPerson && relations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
            <UserOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>未找到 "{selectedPerson}" 的关系数据</div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
            <SearchOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>请输入人物名称并点击查询</div>
          </div>
        )}
      </Card>

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

export default PersonSearchNew;
