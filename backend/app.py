from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import csv
import os
import json
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'person_rel_kg.data')
BIG_REL_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'big_rel_distribution.txt')
SMALL_REL_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'small_rel_distribution.txt')
PERSON_IMAGE_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'person_images')
PERSON_IMAGE_MAP_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'person_image_map.json')

# 确保图片目录存在
if not os.path.exists(PERSON_IMAGE_DIR):
    os.makedirs(PERSON_IMAGE_DIR)

# 允许的图片格式
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def read_data():
    """读取人物关系数据"""
    data = []
    try:
        with open(DATA_FILE, 'r', encoding='utf-8-sig') as f:
            lines = f.readlines()
            if len(lines) < 2:
                return data
            
            # 跳过标题行
            for idx, line in enumerate(lines[1:], 1):
                line = line.strip()
                if not line:
                    continue
                    
                parts = line.split(',')
                if len(parts) >= 4:
                    data.append({
                        'id': idx,
                        'person1': parts[0],
                        'small_relation': parts[1],
                        'big_relation': parts[2],
                        'person2': parts[3]
                    })
    except Exception as e:
        print(f"读取数据错误: {e}")
        import traceback
        traceback.print_exc()
    return data

def write_data(data):
    """写入人物关系数据"""
    try:
        with open(DATA_FILE, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['人物1', '小类关系', '大类关系', '人物2'])
            for item in data:
                writer.writerow([
                    item['person1'],
                    item['small_relation'],
                    item['big_relation'],
                    item['person2']
                ])
        return True
    except Exception as e:
        print(f"写入数据错误: {e}")
        return False

def read_distribution(file_path):
    """读取关系分布数据"""
    data = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and ',' in line:
                    parts = line.split(',')
                    if len(parts) == 2:
                        data.append({
                            'relation': parts[0],
                            'count': int(parts[1])
                        })
    except Exception as e:
        print(f"读取分布数据错误: {e}")
    return data

def read_person_image_map():
    """读取人物图片映射"""
    try:
        if os.path.exists(PERSON_IMAGE_MAP_FILE):
            with open(PERSON_IMAGE_MAP_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"读取图片映射错误: {e}")
    return {}

def write_person_image_map(image_map):
    """写入人物图片映射"""
    try:
        with open(PERSON_IMAGE_MAP_FILE, 'w', encoding='utf-8') as f:
            json.dump(image_map, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"写入图片映射错误: {e}")
        return False

def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_all_persons():
    """获取所有人物列表"""
    data = read_data()
    persons = set()
    for item in data:
        persons.add(item['person1'])
        persons.add(item['person2'])
    return sorted(list(persons))

@app.route('/api/relations', methods=['GET'])
def get_relations():
    """获取人物关系列表（支持分页和搜索）"""
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('pageSize', 20))
    search = request.args.get('search', '').strip()
    big_relation = request.args.get('bigRelation', '').strip()
    
    data = read_data()
    
    # 搜索过滤
    if search:
        data = [item for item in data if 
                search in item['person1'] or 
                search in item['person2'] or 
                search in item['small_relation'] or 
                search in item['big_relation']]
    
    # 大类关系过滤
    if big_relation:
        data = [item for item in data if item['big_relation'] == big_relation]
    
    total = len(data)
    start = (page - 1) * page_size
    end = start + page_size
    
    return jsonify({
        'success': True,
        'data': data[start:end],
        'total': total,
        'page': page,
        'pageSize': page_size
    })

@app.route('/api/relations/<int:relation_id>', methods=['GET'])
def get_relation(relation_id):
    """获取单个关系详情"""
    data = read_data()
    for item in data:
        if item['id'] == relation_id:
            return jsonify({
                'success': True,
                'data': item
            })
    return jsonify({
        'success': False,
        'message': '未找到该关系'
    }), 404

@app.route('/api/relations', methods=['POST'])
def create_relation():
    """创建新的人物关系"""
    try:
        new_relation = request.json
        data = read_data()
        
        # 验证必填字段
        required_fields = ['person1', 'small_relation', 'big_relation', 'person2']
        for field in required_fields:
            if not new_relation.get(field):
                return jsonify({
                    'success': False,
                    'message': f'缺少必填字段: {field}'
                }), 400
        
        # 添加新数据
        data.append({
            'person1': new_relation['person1'],
            'small_relation': new_relation['small_relation'],
            'big_relation': new_relation['big_relation'],
            'person2': new_relation['person2']
        })
        
        if write_data(data):
            return jsonify({
                'success': True,
                'message': '创建成功'
            })
        else:
            return jsonify({
                'success': False,
                'message': '保存失败'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/relations/<int:relation_id>', methods=['PUT'])
def update_relation(relation_id):
    """更新人物关系"""
    try:
        updated_relation = request.json
        data = read_data()
        
        # 查找并更新
        found = False
        for idx, item in enumerate(data):
            if item['id'] == relation_id:
                data[idx] = {
                    'person1': updated_relation.get('person1', item['person1']),
                    'small_relation': updated_relation.get('small_relation', item['small_relation']),
                    'big_relation': updated_relation.get('big_relation', item['big_relation']),
                    'person2': updated_relation.get('person2', item['person2'])
                }
                found = True
                break
        
        if not found:
            return jsonify({
                'success': False,
                'message': '未找到该关系'
            }), 404
        
        if write_data(data):
            return jsonify({
                'success': True,
                'message': '更新成功'
            })
        else:
            return jsonify({
                'success': False,
                'message': '保存失败'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/relations/<int:relation_id>', methods=['DELETE'])
def delete_relation(relation_id):
    """删除人物关系"""
    try:
        data = read_data()
        original_length = len(data)
        
        # 删除指定ID的数据
        data = [item for item in data if item['id'] != relation_id]
        
        if len(data) == original_length:
            return jsonify({
                'success': False,
                'message': '未找到该关系'
            }), 404
        
        if write_data(data):
            return jsonify({
                'success': True,
                'message': '删除成功'
            })
        else:
            return jsonify({
                'success': False,
                'message': '保存失败'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/statistics/big-relations', methods=['GET'])
def get_big_relations_stats():
    """获取大类关系统计"""
    data = read_distribution(BIG_REL_FILE)
    return jsonify({
        'success': True,
        'data': data
    })

@app.route('/api/statistics/small-relations', methods=['GET'])
def get_small_relations_stats():
    """获取小类关系统计"""
    data = read_distribution(SMALL_REL_FILE)
    return jsonify({
        'success': True,
        'data': data
    })

@app.route('/api/statistics/overview', methods=['GET'])
def get_overview_stats():
    """获取数据概览统计"""
    data = read_data()
    
    # 统计人物数量
    persons = set()
    big_relations = set()
    small_relations = set()
    
    for item in data:
        persons.add(item['person1'])
        persons.add(item['person2'])
        big_relations.add(item['big_relation'])
        small_relations.add(item['small_relation'])
    
    return jsonify({
        'success': True,
        'data': {
            'total_relations': len(data),
            'total_persons': len(persons),
            'total_big_relations': len(big_relations),
            'total_small_relations': len(small_relations)
        }
    })

@app.route('/api/persons/search', methods=['GET'])
def search_persons():
    """搜索人物"""
    keyword = request.args.get('keyword', '').strip()
    data = read_data()
    
    persons = set()
    for item in data:
        if keyword in item['person1']:
            persons.add(item['person1'])
        if keyword in item['person2']:
            persons.add(item['person2'])
    
    return jsonify({
        'success': True,
        'data': sorted(list(persons))
    })

@app.route('/api/persons/<person_name>/relations', methods=['GET'])
def get_person_relations(person_name):
    """获取指定人物的所有关系"""
    data = read_data()
    
    relations = []
    for item in data:
        if item['person1'] == person_name or item['person2'] == person_name:
            relations.append(item)
    
    return jsonify({
        'success': True,
        'data': relations,
        'total': len(relations)
    })

@app.route('/api/relations-types', methods=['GET'])
def get_relation_types():
    """获取所有关系类型"""
    big_rels = read_distribution(BIG_REL_FILE)
    small_rels = read_distribution(SMALL_REL_FILE)
    
    return jsonify({
        'success': True,
        'data': {
            'big_relations': [item['relation'] for item in big_rels],
            'small_relations': [item['relation'].split('/')[1] if '/' in item['relation'] else item['relation'] for item in small_rels]
        }
    })

# ==================== 人物管理接口 ====================

@app.route('/api/persons', methods=['GET'])
def get_persons():
    """获取所有人物列表"""
    persons = get_all_persons()
    image_map = read_person_image_map()
    
    # 添加图片信息
    persons_with_images = []
    for person in persons:
        persons_with_images.append({
            'name': person,
            'image': image_map.get(person, None)
        })
    
    return jsonify({
        'success': True,
        'data': persons_with_images,
        'total': len(persons_with_images)
    })

@app.route('/api/persons/<person_name>', methods=['DELETE'])
def delete_person(person_name):
    """删除人物及其所有关系"""
    try:
        data = read_data()
        original_length = len(data)
        
        # 删除包含该人物的所有关系
        data = [item for item in data if item['person1'] != person_name and item['person2'] != person_name]
        
        if len(data) == original_length:
            return jsonify({
                'success': False,
                'message': '未找到该人物'
            }), 404
        
        # 删除图片映射
        image_map = read_person_image_map()
        if person_name in image_map:
            # 删除图片文件
            image_file = image_map[person_name]
            image_path = os.path.join(PERSON_IMAGE_DIR, image_file)
            if os.path.exists(image_path):
                os.remove(image_path)
            del image_map[person_name]
            write_person_image_map(image_map)
        
        if write_data(data):
            return jsonify({
                'success': True,
                'message': f'已删除人物 {person_name} 及其 {original_length - len(data)} 条关系'
            })
        else:
            return jsonify({
                'success': False,
                'message': '保存失败'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# ==================== 图片管理接口 ====================

@app.route('/api/persons/<person_name>/image', methods=['POST'])
def upload_person_image(person_name):
    """上传人物头像"""
    try:
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'message': '没有上传文件'
            }), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': '文件名为空'
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'message': '不支持的文件格式，仅支持: png, jpg, jpeg, gif, webp'
            }), 400
        
        # 生成安全的文件名
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{secure_filename(person_name)}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{ext}"
        filepath = os.path.join(PERSON_IMAGE_DIR, filename)
        
        # 保存文件
        file.save(filepath)
        
        # 更新映射
        image_map = read_person_image_map()
        
        # 删除旧图片
        if person_name in image_map:
            old_file = image_map[person_name]
            old_path = os.path.join(PERSON_IMAGE_DIR, old_file)
            if os.path.exists(old_path):
                os.remove(old_path)
        
        image_map[person_name] = filename
        write_person_image_map(image_map)
        
        return jsonify({
            'success': True,
            'message': '上传成功',
            'data': {
                'person': person_name,
                'image': filename
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/persons/<person_name>/image', methods=['DELETE'])
def delete_person_image(person_name):
    """删除人物头像"""
    try:
        image_map = read_person_image_map()
        
        if person_name not in image_map:
            return jsonify({
                'success': False,
                'message': '该人物没有头像'
            }), 404
        
        # 删除图片文件
        filename = image_map[person_name]
        filepath = os.path.join(PERSON_IMAGE_DIR, filename)
        if os.path.exists(filepath):
            os.remove(filepath)
        
        # 更新映射
        del image_map[person_name]
        write_person_image_map(image_map)
        
        return jsonify({
            'success': True,
            'message': '删除成功'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/images/<filename>')
def get_image(filename):
    """获取图片文件"""
    return send_from_directory(PERSON_IMAGE_DIR, filename)

@app.route('/api/person-images', methods=['GET'])
def get_person_images():
    """获取所有人物图片映射"""
    image_map = read_person_image_map()
    return jsonify({
        'success': True,
        'data': image_map
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
