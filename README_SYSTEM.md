# 人物关系图谱管理系统

基于 PersonGraphDataSet 数据集的人物关系图谱可视化和管理系统。

## 系统架构

- **后端**: Python Flask + RESTful API
- **前端**: React + Ant Design + Vite
- **数据**: CSV 格式的人物关系数据

## 功能特性

### 1. 关系管理
- ✅ 数据列表展示（支持分页）
- ✅ 搜索功能（人物名称、关系类型）
- ✅ 筛选功能（按大类关系筛选）
- ✅ 新增关系
- ✅ 编辑关系
- ✅ 删除关系
- ✅ 数据统计概览

### 2. 人物查询
- ✅ 根据人物名称查询所有关系
- ✅ 关系列表展示
- ✅ 高亮显示查询人物

### 3. 数据统计
- ✅ 大类关系分布柱状图（TOP 20）
- ✅ 小类关系分布柱状图（TOP 30）
- ✅ 大类关系占比饼图（TOP 10）
- ✅ 数据概览统计

### 4. 关系图谱可视化
- ✅ 基于人物的关系网络图
- ✅ 交互式图谱（拖拽、缩放）
- ✅ 节点颜色区分
- ✅ 关系标签显示

## 快速开始

### 环境要求

- Python 3.8+
- Node.js 16+
- npm 或 yarn

### 后端启动

```bash
# 进入后端目录
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动后端服务
python app.py
```

后端服务将在 `http://localhost:5000` 启动

### 前端启动

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将在 `http://localhost:3000` 启动

## API 接口文档

### 关系管理

#### 获取关系列表
```
GET /api/relations
参数:
  - page: 页码（默认1）
  - pageSize: 每页数量（默认20）
  - search: 搜索关键词
  - bigRelation: 大类关系筛选
```

#### 获取单个关系
```
GET /api/relations/{id}
```

#### 创建关系
```
POST /api/relations
Body:
{
  "person1": "人物1",
  "small_relation": "小类关系",
  "big_relation": "大类关系",
  "person2": "人物2"
}
```

#### 更新关系
```
PUT /api/relations/{id}
Body: 同创建关系
```

#### 删除关系
```
DELETE /api/relations/{id}
```

### 统计接口

#### 获取数据概览
```
GET /api/statistics/overview
```

#### 获取大类关系统计
```
GET /api/statistics/big-relations
```

#### 获取小类关系统计
```
GET /api/statistics/small-relations
```

### 人物查询

#### 搜索人物
```
GET /api/persons/search?keyword={keyword}
```

#### 获取人物关系
```
GET /api/persons/{person_name}/relations
```

#### 获取关系类型
```
GET /api/relations-types
```

## 数据格式

### 人物关系数据格式
```csv
人物1,小类关系,大类关系,人物2
周洋,队友,合作,孙琳琳
```

### 关系分布数据格式
```
合作,14048
朋友,13632
```

## 项目结构

```
PersonGraphDataSet/
├── backend/                 # 后端代码
│   ├── app.py              # Flask 应用主文件
│   └── requirements.txt    # Python 依赖
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   │   ├── RelationManage.jsx    # 关系管理
│   │   │   ├── PersonSearch.jsx      # 人物查询
│   │   │   ├── Statistics.jsx        # 数据统计
│   │   │   └── GraphView.jsx         # 图谱可视化
│   │   ├── App.jsx        # 主应用
│   │   ├── App.css        # 样式
│   │   └── main.jsx       # 入口文件
│   ├── index.html         # HTML 模板
│   ├── package.json       # 依赖配置
│   └── vite.config.js     # Vite 配置
└── data/                  # 数据文件
    ├── person_rel_kg.data           # 人物关系数据
    ├── big_rel_distribution.txt     # 大类关系分布
    └── small_rel_distribution.txt   # 小类关系分布
```

## 技术栈

### 后端
- Flask: Web 框架
- Flask-CORS: 跨域支持
- CSV: 数据读写

### 前端
- React 18: UI 框架
- Ant Design 5: UI 组件库
- @ant-design/plots: 数据可视化
- @ant-design/graphs: 图谱可视化
- Axios: HTTP 客户端
- React Router: 路由管理
- Vite: 构建工具

## 数据说明

本系统基于 PersonGraphDataSet 数据集，包含：
- **关系总数**: 97,158 条
- **人物总数**: 71,243 个
- **大类关系**: 102 个
- **小类关系**: 266 个

## 注意事项

1. 首次启动前请确保数据文件存在于 `data/` 目录
2. 后端服务需要先于前端启动
3. 修改数据会直接写入 CSV 文件，请注意备份
4. 图谱可视化功能在数据量大时可能较慢

## 开发计划

- [ ] 添加数据导入导出功能
- [ ] 支持多跳关系查询
- [ ] 添加关系路径推理
- [ ] 优化图谱渲染性能
- [ ] 添加用户权限管理

## 许可证

基于原 PersonGraphDataSet 项目

## 作者

基于刘焕勇的 PersonGraphDataSet 数据集开发
