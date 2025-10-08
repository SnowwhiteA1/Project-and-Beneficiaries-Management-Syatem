from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_db_connection

app = Flask(__name__)
CORS(app)

@app.route('/projects', methods=['GET'])
def get_projects():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM projects ORDER BY id;')
    rows = cur.fetchall()
    cur.close()
    conn.close()

    projects = [
        {"id": r[0], "project_name": r[1], "description": r[2], "start_date": r[3], "end_date": r[4], "created_at": r[5]}
        for r in rows
    ]
    return jsonify(projects)

@app.route('/projects', methods=['POST'])
def add_project():
    data = request.json
    project_name = data.get('project_name')
    description = data.get('description')
    start_date = data.get('start_date')
    end_date = data.get('end_date')

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        'INSERT INTO projects (project_name, description, start_date, end_date) VALUES (%s, %s, %s, %s) RETURNING id;',
        (project_name, description, start_date, end_date)
    )
    project_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Project added successfully 🎉", "id": project_id})

if __name__ == '__main__':
    app.run(debug=True, port=5050)
