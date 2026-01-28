import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin } from 'antd';
import { Column, Pie } from '@ant-design/plots';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const Statistics = () => {
  const [loading, setLoading] = useState(false);
  const [bigRelationsData, setBigRelationsData] = useState([]);
  const [smallRelationsData, setSmallRelationsData] = useState([]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const [bigRelRes, smallRelRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/statistics/big-relations`),
        axios.get(`${API_BASE_URL}/statistics/small-relations`)
      ]);

      if (bigRelRes.data.success) {
        setBigRelationsData(bigRelRes.data.data.slice(0, 20));
      }

      if (smallRelRes.data.success) {
        setSmallRelationsData(smallRelRes.data.data.slice(0, 30));
      }
    } catch (error) {
      console.error('获取统计数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const bigRelationConfig = {
    data: bigRelationsData,
    xField: 'relation',
    yField: 'count',
    label: {
      position: 'top',
      style: {
        fill: '#000000',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoRotate: true,
        autoHide: false,
      },
    },
    meta: {
      relation: {
        alias: '关系类型',
      },
      count: {
        alias: '数量',
      },
    },
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
  };

  const smallRelationConfig = {
    data: smallRelationsData,
    xField: 'relation',
    yField: 'count',
    label: {
      position: 'top',
      style: {
        fill: '#000000',
        opacity: 0.6,
        fontSize: 10,
      },
    },
    xAxis: {
      label: {
        autoRotate: true,
        autoHide: false,
        style: {
          fontSize: 10,
        },
      },
    },
    meta: {
      relation: {
        alias: '关系类型',
      },
      count: {
        alias: '数量',
      },
    },
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
  };

  const pieConfig = {
    data: bigRelationsData.slice(0, 10),
    angleField: 'count',
    colorField: 'relation',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="大类关系分布 TOP 20">
            <Column {...bigRelationConfig} height={400} />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="小类关系分布 TOP 30">
            <Column {...smallRelationConfig} height={500} />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="大类关系占比 TOP 10">
            <Pie {...pieConfig} height={400} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;
