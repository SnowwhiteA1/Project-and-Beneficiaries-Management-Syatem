from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import traceback
from datetime import datetime
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Configure CORS
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"]}})

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'jumpstart_database',
    'user': 'postgres',
    'password': 'admin123',
    'port': 5432
}

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create upload folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db_connection():
    """Create a database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return None

# ================= HELPER FUNCTIONS =================

def format_date(date_value):
    """Format date to string or return None"""
    if date_value:
        return date_value.strftime("%Y-%m-%d")
    return None

# ================= PROJECTS ROUTES =================

@app.route("/api/projects", methods=["GET", "OPTIONS"])
def get_projects():
    """Get all projects"""
    if request.method == "OPTIONS":
        return '', 200
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        cur.execute("""
            SELECT id, name, project_type, description, funder, accreditor, project_image_url,
                   start_date, end_date, status, created_at
            FROM projects
            ORDER BY id DESC;
        """)
        
        rows = cur.fetchall()
        projects = []
        for row in rows:
            projects.append({
                "id": row[0],
                "name": row[1],
                "project_type": row[2],
                "description": row[3],
                "funder": row[4],
                "accreditor": row[5],
                "project_image_url": row[6],
                "start_date": format_date(row[7]),
                "end_date": format_date(row[8]),
                "status": row[9],
                "created_at": row[10].strftime("%Y-%m-%d %H:%M:%S") if row[10] else None
            })
        
        cur.close()
        conn.close()
        return jsonify(projects)
    
    except Exception as e:
        print(f"❌ Error in get_projects: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route("/api/projects/<int:project_id>", methods=["GET", "OPTIONS"])
def get_project(project_id):
    """Get a single project by ID"""
    if request.method == "OPTIONS":
        return '', 200
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        cur.execute("""
            SELECT id, name, project_type, description, funder, accreditor, project_image_url,
                   start_date, end_date, status, created_at
            FROM projects
            WHERE id = %s;
        """, (project_id,))
        
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            return jsonify({"error": "Project not found"}), 404
        
        project = {
            "id": row[0],
            "name": row[1],
            "project_type": row[2],
            "description": row[3],
            "funder": row[4],
            "accreditor": row[5],
            "project_image_url": row[6],
            "start_date": format_date(row[7]),
            "end_date": format_date(row[8]),
            "status": row[9],
            "created_at": row[10].strftime("%Y-%m-%d %H:%M:%S") if row[10] else None
        }
        return jsonify(project)
    
    except Exception as e:
        print(f"❌ Error in get_project: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/projects", methods=["POST", "OPTIONS"])
def create_project():
    """Create a new project with optional image upload"""
    if request.method == "OPTIONS":
        return '', 200
    try:
        # Check if request has form data
        if request.content_type and 'multipart/form-data' in request.content_type:
            name = request.form.get('name')
            project_type = request.form.get('project_type')
            description = request.form.get('description', '')
            funder = request.form.get('funder', '')
            accreditor = request.form.get('accreditor', '')
            start_date = request.form.get('start_date')
            end_date = request.form.get('end_date')
            status = request.form.get('status', 'Active')
            
            # Handle file upload
            project_image_url = ''
            if 'project_image' in request.files:
                file = request.files['project_image']
                if file and file.filename != '' and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    # Create unique filename to avoid collisions
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"{timestamp}_{filename}"
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(filepath)
                    # In production, you might want to upload to cloud storage
                    # For local development, serve from uploads folder
                    project_image_url = f"http://localhost:5050/uploads/{filename}"
        else:
            # Handle JSON request (for backward compatibility)
            data = request.json
            name = data.get('name')
            project_type = data.get('project_type')
            description = data.get('description', '')
            funder = data.get('funder', '')
            accreditor = data.get('accreditor', '')
            project_image_url = data.get('project_image_url', '')
            start_date = data.get('start_date')
            end_date = data.get('end_date')
            status = data.get('status', 'Active')
        
        # Validate required fields
        if not name or not project_type:
            return jsonify({"error": "Missing required fields: name and project_type"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO projects (name, project_type, description, funder, accreditor, project_image_url, 
                   start_date, end_date, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            name.strip(),
            project_type.strip(),
            description.strip(),
            funder.strip(),
            accreditor.strip(),
            project_image_url,
            start_date,
            end_date,
            status
        ))
        
        project_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"id": project_id, "message": "Project created successfully"}), 201
    
    except Exception as e:
        print(f"❌ Error in create_project: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route("/api/projects/<int:project_id>", methods=["PUT", "OPTIONS"])
def update_project(project_id):
    """Update a project with optional image upload"""
    if request.method == "OPTIONS":
        return '', 200
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        cur.execute("SELECT id, project_image_url FROM projects WHERE id = %s", (project_id,))
        existing_project = cur.fetchone()
        
        if not existing_project:
            cur.close()
            conn.close()
            return jsonify({"error": "Project not found"}), 404
        
        # Check if request has form data
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form
            # Handle file upload
            project_image_url = existing_project[1]  # Keep existing image URL
            if 'project_image' in request.files:
                file = request.files['project_image']
                if file and file.filename != '' and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"{timestamp}_{filename}"
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(filepath)
                    project_image_url = f"http://localhost:5050/uploads/{filename}"
        else:
            data = request.json
            project_image_url = data.get('project_image_url', existing_project[1])
        
        # Build update query
        update_fields = []
        values = []
        
        # List of allowed fields
        allowed_fields = {
            'name': data.get('name'),
            'project_type': data.get('project_type'),
            'description': data.get('description'),
            'funder': data.get('funder'),
            'accreditor': data.get('accreditor'),
            'project_image_url': project_image_url,
            'start_date': data.get('start_date'),
            'end_date': data.get('end_date'),
            'status': data.get('status')
        }
        
        for field, value in allowed_fields.items():
            if value is not None:
                update_fields.append(f"{field} = %s")
                values.append(value.strip() if isinstance(value, str) else value)
        
        if not update_fields:
            cur.close()
            conn.close()
            return jsonify({"error": "No fields to update"}), 400
        
        values.append(project_id)
        query = f"UPDATE projects SET {', '.join(update_fields)} WHERE id = %s"
        cur.execute(query, values)
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"message": "Project updated successfully"})
    
    except Exception as e:
        print(f"❌ Error in update_project: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/projects/<int:project_id>", methods=["DELETE", "OPTIONS"])
def delete_project(project_id):
    """Delete a project"""
    if request.method == "OPTIONS":
        return '', 200
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        cur.execute("SELECT id FROM projects WHERE id = %s", (project_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Project not found"}), 404
        
        cur.execute("DELETE FROM projects WHERE id = %s", (project_id,))
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"message": "Project deleted successfully"})
    
    except Exception as e:
        print(f"❌ Error in delete_project: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ================= HEALTH CHECK =================
@app.route("/api/health", methods=["GET"])
def health_check():
    try:
        conn = get_db_connection()
        if conn:
            cur = conn.cursor()
            cur.execute("SELECT 1")
            cur.close()
            conn.close()
            return jsonify({"status": "healthy", "database": "connected"})
        else:
            return jsonify({"status": "unhealthy", "database": "disconnected"}), 500
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

# ================= STATIC FILES FOR UPLOADS =================
@app.route('/uploads/<filename>')
def serve_uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ================= RUN SERVER =================
if __name__ == "__main__":
    print("🚀 JumpStart Backend Server running...")
    app.run(debug=True, port=5050, host='0.0.0.0')