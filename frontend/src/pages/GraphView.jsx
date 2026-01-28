import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, message, Space, Select, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

const API_BASE_URL = 'http://localhost:5000/api';

const GraphView = () => {
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [relations, setRelations] = useState([]);
  const [maxDepth, setMaxDepth] = useState(2);
  const networkRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (relations.length > 0 && containerRef.current) {
      renderGraph();
    }
  }, [relations]);

  const renderGraph = () => {
    if (!containerRef.current) return;

    const nodes = new Map();
    const edges = [];
    const centerPerson = searchKeyword;

    // 添加中心节点
    nodes.set(centerPerson, {
      id: centerPerson,
      label: centerPerson,
      color: {
        background: '#ff4d4f',
        border: '#cf1322',
        highlight: {
          background: '#ff7875',
          border: '#cf1322',
        }
      },
      font: { color: '#ffffff', size: 16, bold: true },
      size: 30,
    });

    // 添加关系节点和边
    relations.forEach((rel, index) => {
      const { person1, person2, big_relation, small_relation } = rel;
      
      if (!nodes.has(person1)) {
        nodes.set(person1, {
          id: person1,
          label: person1,
          color: {
            background: person1 === centerPerson ? '#ff4d4f' : '#1890ff',
            border: person1 === centerPerson ? '#cf1322' : '#096dd9',
          },
          font: { color: '#ffffff', size: 14 },
          size: 25,
        });
      }
      
      if (!nodes.has(person2)) {
        nodes.set(person2, {
          id: person2,
          label: person2,
          color: {
            background: person2 === centerPerson ? '#ff4d4f' : '#52c41a',
            border: person2 === centerPerson ? '#cf1322' : '#389e0d',
          },
          font: { color: '#ffffff', size: 14 },
          size: 25,
        });
      }

      edges.push({
        from: person1,
        to: person2,
        label: `${big_relation}(${small_relation})`,
        arrows: 'to',
        color: { color: '#91d5ff', highlight: '#40a9ff' },
        font: { size: 12, align: 'middle', background: '#ffffff' },
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

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      message.warning('请输入人物名称');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/persons/${searchKeyword}/relations`);
      if (response.data.success) {
        if (response.data.data.length === 0) {
          message.info('未找到相关关系');
          setRelations([]);
        } else {
          setRelations(response.data.data);
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


  return (
    <div style={{ padding: '24px' }}>
      <Card title="人物关系图谱可视化">
        <Space style={{ marginBottom: 24 }}>
          <Input
            placeholder="请输入人物名称"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 300 }}
          />
          <Select
            value={maxDepth}
            onChange={setMaxDepth}
            style={{ width: 150 }}
          >
            <Select.Option value={1}>1度关系</Select.Option>
            <Select.Option value={2}>2度关系</Select.Option>
            <Select.Option value={3}>3度关系</Select.Option>
          </Select>
          <Button 
            type="primary" 
            icon={<SearchOutlined />} 
            onClick={handleSearch}
            loading={loading}
          >
            生成图谱
          </Button>
        </Space>

        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            paddingTop: '200px',
            minHeight: '600px'
          }}>
            <Spin size="large" tip="正在生成关系图谱..." />
          </div>
        ) : relations.length > 0 ? (
          <>
            <div 
              ref={containerRef}
              style={{ 
                width: '100%',
                height: '700px',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                background: '#fafafa'
              }}
            />
            <div style={{ marginTop: 16, color: '#666', fontSize: 12 }}>
              <p><strong>使用说明：</strong></p>
              <ul>
                <li>🔴 红色节点：查询的中心人物</li>
                <li>🔵 蓝色节点：作为人物1的关联人物</li>
                <li>🟢 绿色节点：作为人物2的关联人物</li>
                <li>💡 可以拖拽节点调整位置</li>
                <li>🔍 滚轮缩放，拖拽画布移动视图</li>
                <li>👆 鼠标悬停节点查看详情</li>
              </ul>
            </div>
          </>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            paddingTop: '200px',
            color: '#999',
            minHeight: '600px'
          }}>
            <SearchOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>请输入人物名称并点击"生成图谱"按钮</div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default GraphView;
