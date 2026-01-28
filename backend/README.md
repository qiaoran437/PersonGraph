# 后端 API 服务

基于 Flask 的 RESTful API 服务，提供人物关系数据的增删改查功能。

## 安装依赖

```bash
pip install -r requirements.txt
```

## 启动服务

```bash
python app.py
```

服务将在 `http://localhost:5000` 启动

## API 端点

### 关系管理
- `GET /api/relations` - 获取关系列表
- `GET /api/relations/<id>` - 获取单个关系
- `POST /api/relations` - 创建关系
- `PUT /api/relations/<id>` - 更新关系
- `DELETE /api/relations/<id>` - 删除关系

### 统计数据
- `GET /api/statistics/overview` - 数据概览
- `GET /api/statistics/big-relations` - 大类关系统计
- `GET /api/statistics/small-relations` - 小类关系统计

### 人物查询
- `GET /api/persons/search` - 搜索人物
- `GET /api/persons/<name>/relations` - 获取人物关系
- `GET /api/relations-types` - 获取关系类型列表

## 配置

- 端口: 5000
- 数据文件路径: `../data/person_rel_kg.data`
- CORS: 已启用，允许所有来源

## 注意事项

1. 确保数据文件存在
2. 修改操作会直接写入 CSV 文件
3. 建议定期备份数据文件
