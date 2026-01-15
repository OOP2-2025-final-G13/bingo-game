# ============================================
# Flaskバックエンド - ビンゴ最短記録管理
# ファイル名: app.py
# ============================================

from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime
import os

app = Flask(__name__)

# データベースファイルのパス
DB_PATH = 'bingo_records.db'

# ============================================
# データベース初期化
# ============================================

def init_db():
    """
    データベースとテーブルを初期化
    役割：アプリ起動時にDBとテーブルを作成
    目的：bingo_recordsテーブルが存在しない場合に作成する
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # bingo_recordsテーブルを作成
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bingo_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            draw_count INTEGER NOT NULL,
            timestamp TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# ============================================
# データベース操作関数
# ============================================

def get_best_record():
    """
    最短記録を取得
    役割：DBから最も少ない回数の記録を取得
    目的：フロントエンドに最短記録を提供
    @returns {dict|None} - {id, draw_count, timestamp, created_at} または None
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # draw_countが最小のレコードを取得
    cursor.execute('''
        SELECT id, draw_count, timestamp, created_at
        FROM bingo_records
        ORDER BY draw_count ASC, created_at ASC
        LIMIT 1
    ''')
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            'id': row[0],
            'draw_count': row[1],
            'timestamp': row[2],
            'created_at': row[3]
        }
    return None

def add_record(draw_count):
    """
    新しい記録を追加
    役割：ビンゴ達成時の記録をDBに保存
    目的：BE①から呼ばれて記録を保存する
    @param {int} draw_count - ビンゴ達成時の抽選回数
    @returns {dict} - 追加された記録 + 新記録フラグ
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 現在の最短記録を取得
    best_record = get_best_record()
    
    # 現在のタイムスタンプを生成
    now = datetime.now()
    timestamp_str = now.strftime('%Y年%m月%d日 %H:%M:%S')
    
    # 新しい記録を挿入
    cursor.execute('''
        INSERT INTO bingo_records (draw_count, timestamp)
        VALUES (?, ?)
    ''', (draw_count, timestamp_str))
    
    record_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    # 新記録かどうかを判定（DB上の最新の最短記録IDと、今回追加したIDが一致するか）
    best_record = get_best_record()
    is_new_record = (best_record is not None) and (best_record['id'] == record_id)
    
    return {
        'id': record_id,
        'draw_count': draw_count,
        'timestamp': timestamp_str,
        'is_new_record': is_new_record
    }

def get_all_records():
    """
    全記録を取得
    役割：これまでの全ビンゴ記録を取得
    目的：履歴画面での一覧表示に使用
    @returns {list} - 記録のリスト（新しい順）
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, draw_count, timestamp, created_at
        FROM bingo_records
        ORDER BY created_at DESC
    ''')
    
    rows = cursor.fetchall()
    conn.close()
    
    records = []
    for row in rows:
        records.append({
            'id': row[0],
            'draw_count': row[1],
            'timestamp': row[2],
            'created_at': row[3]
        })
    
    return records

def delete_all_records():
    """
    全記録を削除
    役割：DBの全データを削除
    目的：リセット機能の実装
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM bingo_records')
    
    conn.commit()
    conn.close()

# ============================================
# ルーティング（エンドポイント）
# ============================================

@app.route('/')
def index():
    """
    メインページ
    役割：index.htmlを返す
    目的：ビンゴゲームのフロントエンドを表示
    """
    return render_template('index.html')

@app.route('/history.html')
def history():
    """
    履歴ページ
    役割：history.htmlを返す
    目的：履歴画面を表示
    """
    return render_template('history.html')

@app.route('/api/record/best', methods=['GET'])
def api_get_best_record():
    """
    GET /api/record/best - 最短記録を取得
    役割：最短ビンゴ記録をJSON形式で返す
    目的：フロントエンドが最短記録を表示する際に使用
    
    レスポンス例（記録あり）:
    {
        "success": true,
        "data": {
            "id": 5,
            "draw_count": 12,
            "timestamp": "2026年01月11日 15:30:45",
            "created_at": "2026-01-11 15:30:45"
        }
    }
    
    レスポンス例（記録なし）:
    {
        "success": true,
        "data": null
    }
    """
    try:
        best_record = get_best_record()
        return jsonify({
            'success': True,
            'data': best_record
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/record/add', methods=['POST'])
def api_add_record():
    """
    POST /api/record/add - 新しい記録を追加
    役割：ビンゴ達成時の記録をDBに保存
    目的：BE①がビンゴ達成時に呼び出す
    
    リクエストボディ:
    {
        "draw_count": 12
    }
    
    レスポンス例:
    {
        "success": true,
        "data": {
            "id": 6,
            "draw_count": 12,
            "timestamp": "2026年01月11日 15:30:45",
            "is_new_record": true
        }
    }
    """
    try:
        data = request.get_json()
        draw_count = data.get('draw_count')
        
        if draw_count is None or not isinstance(draw_count, int) or draw_count <= 0:
            return jsonify({
                'success': False,
                'error': 'draw_countは正の整数である必要があります'
            }), 400
        
        result = add_record(draw_count)
        
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/record/all', methods=['GET'])
def api_get_all_records():
    """
    GET /api/record/all - 全記録を取得
    役割：これまでの全ビンゴ記録を取得
    目的：履歴画面での一覧表示に使用
    
    レスポンス例:
    {
        "success": true,
        "data": [
            {
                "id": 6,
                "draw_count": 12,
                "timestamp": "2026年01月11日 15:30:45",
                "created_at": "2026-01-11 15:30:45"
            },
            {
                "id": 5,
                "draw_count": 15,
                "timestamp": "2026年01月10日 14:20:30",
                "created_at": "2026-01-10 14:20:30"
            }
        ]
    }
    """
    try:
        records = get_all_records()
        return jsonify({
            'success': True,
            'data': records
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/record/reset', methods=['DELETE'])
def api_delete_all_records():
    """
    DELETE /api/record/reset - 全記録を削除
    役割：DBの全データを削除
    目的：リセットボタン押下時に使用
    
    レスポンス例:
    {
        "success": true,
        "message": "全記録を削除しました"
    }
    """
    try:
        delete_all_records()
        return jsonify({
            'success': True,
            'message': '全記録を削除しました'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================
# アプリケーション起動
# ============================================

if __name__ == '__main__':
    # データベース初期化
    init_db()
    
    # Flaskアプリ起動
    # debug=True: 開発モード（コード変更時に自動リロード）
    # host='0.0.0.0': 外部からアクセス可能
    # port=5000: ポート番号
    app.run(debug=True, host='0.0.0.0', port=5500)