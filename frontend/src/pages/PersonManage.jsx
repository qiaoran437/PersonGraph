import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, message, Space, Modal, Upload, Image, 
  Popconfirm, Input, Avatar, Tag, Form, Select
} from 'antd';
import { 
  UserOutlined, UploadOutlined, DeleteOutlined, SearchOutlined,
  PictureOutlined, PlusOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const API_BASE_URL = 'http://localhost:5000/api';

const PersonManage = () => {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [addPersonModalVisible, setAddPersonModalVisible] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [relationTypes, setRelationTypes] = useState({ big_relations: [], small_relations: [] });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPersons();
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

  const fetchPersons = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/persons`);
      if (response.data.success) {
        setPersons(response.data.data);
      }
    } catch (error) {
      message.error('获取人物列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = (person) => {
    setSelectedPerson(person);
    setFileList([]);
    setUploadModalVisible(true);
  };

  const handleUploadOk = async () => {
    if (fileList.length === 0) {
      message.warning('请选择图片文件');
      return;
    }

    const formData = new FormData();
    formData.append('image', fileList[0].originFileObj);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/persons/${selectedPerson.name}/image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        message.success('上传成功');
        setUploadModalVisible(false);
        setFileList([]);
        await fetchPersons();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '上传失败');
      console.error(error);
    }
  };

  const handleDeleteImage = async (person) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/persons/${person.name}/image`);
      if (response.data.success) {
        message.success('删除成功');
        await fetchPersons();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '删除失败');
      console.error(error);
    }
  };

  const handleDeletePerson = async (personName) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/persons/${personName}`);
      if (response.data.success) {
        message.success(response.data.message);
        await fetchPersons();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '删除失败');
      console.error(error);
    }
  };

  const handleAddPerson = () => {
    form.resetFields();
    setAddPersonModalVisible(true);
  };

  const handleAddPersonOk = async () => {
    try {
      const values = await form.validateFields();
      const response = await axios.post(`${API_BASE_URL}/relations`, values);
      if (response.data.success) {
        message.success('新增人物关系成功');
        setAddPersonModalVisible(false);
        await fetchPersons();
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

  const uploadProps = {
    fileList,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件！');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('图片大小不能超过 5MB！');
        return false;
      }
      setFileList([file]);
      return false;
    },
    onRemove: () => {
      setFileList([]);
    },
    maxCount: 1,
  };

  const filteredPersons = persons.filter(person => 
    person.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: '头像',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (image, record) => (
        image ? (
          <Image
            src={`${API_BASE_URL}/images/${image}`}
            width={50}
            height={50}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
            fallback="data:image/png;base64,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"
          />
        ) : (
          <Avatar size={50} icon={<UserOutlined />} />
        )
      ),
    },
    {
      title: '人物名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <Tag color="blue" style={{ fontSize: 14 }}>{text}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'image',
      key: 'status',
      width: 100,
      render: (image) => (
        image ? (
          <Tag color="success" icon={<PictureOutlined />}>已设置头像</Tag>
        ) : (
          <Tag color="default">未设置头像</Tag>
        )
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<UploadOutlined />}
            onClick={() => handleUploadImage(record)}
          >
            {record.image ? '更换头像' : '上传头像'}
          </Button>
          {record.image && (
            <Popconfirm
              title="确定删除该人物的头像吗？"
              onConfirm={() => handleDeleteImage(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                删除头像
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title={`确定删除人物 "${record.name}" 及其所有关系吗？`}
            onConfirm={() => handleDeletePerson(record.name)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除人物
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title={
          <Space>
            <UserOutlined />
            <span>人物管理</span>
            <Tag color="blue">{persons.length} 人</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAddPerson}
            >
              新增人物
            </Button>
            <Input
              placeholder="搜索人物"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredPersons}
          rowKey="name"
          loading={loading}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `共 ${total} 个人物`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
        />
      </Card>

      <Modal
        title={`上传 ${selectedPerson?.name} 的头像`}
        open={uploadModalVisible}
        onOk={handleUploadOk}
        onCancel={() => {
          setUploadModalVisible(false);
          setFileList([]);
        }}
        okText="上传"
        cancelText="取消"
      >
        <Upload {...uploadProps} listType="picture-card">
          <div>
            <UploadOutlined />
            <div style={{ marginTop: 8 }}>选择图片</div>
          </div>
        </Upload>
        <div style={{ marginTop: 16, color: '#666', fontSize: 12 }}>
          <p>支持格式：PNG, JPG, JPEG, GIF, WEBP</p>
          <p>文件大小：不超过 5MB</p>
          <p>图片将保存到：data/person_images/ 目录</p>
        </div>
      </Modal>

      <Modal
        title="新增人物"
        open={addPersonModalVisible}
        onOk={handleAddPersonOk}
        onCancel={() => setAddPersonModalVisible(false)}
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
            rules={[{ required: true, message: '请输入人物1名称' }]}
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
            rules={[{ required: true, message: '请输入人物2名称' }]}
          >
            <Input placeholder="请输入人物2名称" />
          </Form.Item>
        </Form>
        <div style={{ marginTop: 16, padding: 12, background: '#f0f0f0', borderRadius: 4 }}>
          <p style={{ margin: 0, color: '#666', fontSize: 12 }}>
            💡 提示：通过添加关系来创建新人物。如果人物1或人物2不存在，系统会自动创建。
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default PersonManage;
