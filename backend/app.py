from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from db import get_db_connection
import os
from werkzeug.utils import secure_filename
from datetime import datetime
import json

app = Flask(__name__)

# Configure CORS properly
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "supports_credentials": False
    }
})

# Configure upload folder (if you need images later)
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/api/projects", methods=["GET", "OPTIONS"])
def get_projects():
    if request.method == "OPTIONS":
        return '', 200
        
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT id, title, description, start_date, end_date, participants, accreditors
            FROM projects
            ORDER BY id DESC;
        """)

        rows = cur.fetchall()
        cur.close()
        conn.close()

        projects = []
        for r in rows:
            projects.append({
                "id": r[0],
                "title": r[1],  # Changed from project_name to title
                "description": r[2],
                "start_date": r[3].strftime("%Y-%m-%d") if r[3] else "",
                "end_date": r[4].strftime("%Y-%m-%d") if r[4] else "",
                "participants": r[5],
                "accreditors": r[6] if r[6] else []  # Array field
            })

        return jsonify(projects)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/projects", methods=["POST", "OPTIONS"])
def create_project():
    if request.method == "OPTIONS":
        return '', 200
        
    try:
        # First check content type
        content_type = request.content_type or ''
        
        if content_type.startswith('application/json'):
            data = request.get_json()
            
            # Extract fields - match database column names
            title = data.get('title')
            description = data.get('description')
            start_date = data.get('start_date')
            end_date = data.get('end_date')
            participants = data.get('participants')
            accreditors = data.get('accreditors', [])  # Default to empty array
            
            # Validate required fields
            if not all([title, description, start_date, end_date, participants]):
                return jsonify({"error": "Missing required fields"}), 400
                
        elif 'multipart/form-data' in content_type:
            # If you're sending form data (with files)
            title = request.form.get('title')
            description = request.form.get('description')
            start_date = request.form.get('start_date')
            end_date = request.form.get('end_date')
            participants = request.form.get('participants')
            accreditors_str = request.form.get('accreditors', '[]')
            
            # Parse accreditors if it's a JSON string
            try:
                accreditors = json.loads(accreditors_str) if accreditors_str else []
            except:
                accreditors = []
        else:
            return jsonify({"error": "Unsupported content type"}), 415

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO projects 
            (title, description, start_date, end_date, participants, accreditors)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            title,
            description,
            start_date,
            end_date,
            int(participants),
            accreditors  # This should be an array
        ))

        project_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "id": project_id,
            "title": title,
            "message": "Project created successfully"
        }), 201
    except Exception as e:
        print(f"Error creating project: {e}")  # For debugging
        return jsonify({"error": str(e)}), 500

@app.route("/api/projects/<int:project_id>", methods=["PUT", "OPTIONS"])
def update_project(project_id):
    if request.method == "OPTIONS":
        return '', 200
        
    try:
        content_type = request.content_type or ''
        
        if content_type.startswith('application/json'):
            data = request.get_json()
            title = data.get('title')
            description = data.get('description')
            start_date = data.get('start_date')
            end_date = data.get('end_date')
            participants = data.get('participants')
            accreditors = data.get('accreditors')
            
        elif 'multipart/form-data' in content_type:
            title = request.form.get('title')
            description = request.form.get('description')
            start_date = request.form.get('start_date')
            end_date = request.form.get('end_date')
            participants = request.form.get('participants')
            accreditors_str = request.form.get('accreditors')
            
            if accreditors_str:
                try:
                    accreditors = json.loads(accreditors_str)
                except:
                    accreditors = None
            else:
                accreditors = None
        else:
            return jsonify({"error": "Unsupported content type"}), 415

        conn = get_db_connection()
        cur = conn.cursor()

        # Build dynamic update query
        update_fields = []
        values = []
        
        if title is not None:
            update_fields.append("title = %s")
            values.append(title)
        if description is not None:
            update_fields.append("description = %s")
            values.append(description)
        if start_date is not None:
            update_fields.append("start_date = %s")
            values.append(start_date)
        if end_date is not None:
            update_fields.append("end_date = %s")
            values.append(end_date)
        if participants is not None:
            update_fields.append("participants = %s")
            values.append(int(participants))
        if accreditors is not None:
            update_fields.append("accreditors = %s")
            values.append(accreditors)

        values.append(project_id)
        
        if update_fields:
            query = f"""
                UPDATE projects
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING id;
            """
            cur.execute(query, values)
            conn.commit()

        cur.close()
        conn.close()

        return jsonify({"message": "Project updated successfully"}), 200
    except Exception as e:
        print(f"Error updating project: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/projects/<int:project_id>", methods=["DELETE", "OPTIONS"])
def delete_project(project_id):
    if request.method == "OPTIONS":
        return '', 200
        
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("DELETE FROM projects WHERE id = %s", (project_id,))
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Project deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Create uploads directory if it doesn't exist
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(debug=True, port=5050, host='0.0.0.0')