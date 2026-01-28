# 前端应用

基于 React + Ant Design 的人物关系图谱管理系统前端。

## 安装依赖

```bash
npm install
```

## 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动

## 构建生产版本

```bash
npm run build
```

## 功能模块

### 1. 关系管理 (`/`)
- 数据表格展示
- 搜索和筛选
- 新增、编辑、删除操作
- 统计数据展示

### 2. 人物查询 (`/search`)
- 根据人物名称查询关系
- 关系列表展示

### 3. 数据统计 (`/statistics`)
- 大类关系分布图
- 小类关系分布图
- 关系占比饼图

### 4. 关系图谱 (`/graph`)
- 交互式关系网络图
- 节点拖拽和缩放
- 关系可视化

## 技术栈

- React 18
- Ant Design 5
- @ant-design/plots (图表)
- @ant-design/graphs (图谱)
- React Router 6
- Axios
- Vite

## 配置

- 开发端口: 3000
- API 代理: `/api` -> `http://localhost:5000`
