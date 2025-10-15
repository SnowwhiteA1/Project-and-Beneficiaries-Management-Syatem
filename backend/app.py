from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from db import get_db_connection
import os

app = Flask(__name__)
CORS(app)

# Directory to store uploaded images
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/projects', methods=['GET'])
def get_projects():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM projects ORDER BY id;')
    rows = cur.fetchall()
    cur.close()
    conn.close()

    projects = [
        {
            "id": r[0],
            "project_name": r[1],
            "description": r[2],
            "start_date": r[3],
            "end_date": r[4],
            "created_at": r[5],
            "participants": r[6] if len(r) > 6 else 0,
            "image": r[7] if len(r) > 7 else None  # image filename
        }
        for r in rows
    ]
    return jsonify(projects)

@app.route('/projects', methods=['POST'])
def add_project():
    # Use form-data for image upload
    project_name = request.form.get('project_name')
    description = request.form.get('description')
    start_date = request.form.get('start_date')
    end_date = request.form.get('end_date')
    participants = int(request.form.get('participants', 0))

    # Handle image
    image_file = request.files.get('image')
    image_filename = None
    if image_file:
        image_filename = image_file.filename
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
        image_file.save(image_path)

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        '''
        INSERT INTO projects (project_name, description, start_date, end_date, participants, image)
        VALUES (%s, %s, %s, %s, %s, %s) RETURNING id;
        ''',
        (project_name, description, start_date, end_date, participants, image_filename)
    )
    project_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Project added successfully 🎉", "id": project_id})

@app.route('/projects/<int:id>', methods=['PUT'])
def update_project(id):
    project_name = request.form.get('project_name')
    description = request.form.get('description')
    start_date = request.form.get('start_date')
    end_date = request.form.get('end_date')
    participants = int(request.form.get('participants', 0))

    # Handle image update
    image_file = request.files.get('image')
    image_filename = None
    if image_file:
        image_filename = image_file.filename
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
        image_file.save(image_path)

    conn = get_db_connection()
    cur = conn.cursor()

    if image_filename:
        cur.execute(
            '''
            UPDATE projects 
            SET project_name = %s, description = %s, start_date = %s, end_date = %s, participants = %s, image = %s
            WHERE id = %s;
            ''',
            (project_name, description, start_date, end_date, participants, image_filename, id)
        )
    else:
        cur.execute(
            '''
            UPDATE projects 
            SET project_name = %s, description = %s, start_date = %s, end_date = %s, participants = %s
            WHERE id = %s;
            ''',
            (project_name, description, start_date, end_date, participants, id)
        )

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Project updated successfully ✅"})

@app.route('/projects/<int:id>', methods=['DELETE'])
def delete_project(id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM projects WHERE id = %s;', (id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "Project deleted successfully 🗑️"})

# Serve uploaded images
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True, port=5050)
