from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import traceback
from datetime import datetime

app = Flask(__name__)

# Configure CORS
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"]}})

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'jumpstart_database',
    'user': 'postgres',  # Update if different
    'password': 'admin123',  # Update to your PostgreSQL password
    'port': 5432
}

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
    """Create a new project"""
    if request.method == "OPTIONS":
        return '', 200
    try:
        data = request.json
        # Validate required fields
        required_fields = ['name', 'project_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO projects (name, project_type, description, funder, accreditor, project_image_url, start_date, end_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            data['name'].strip(),
            data['project_type'].strip(),
            data.get('description', ''),
            data.get('funder', ''),
            data.get('accreditor', ''),
            data.get('project_image_url', ''),
            data.get('start_date'),
            data.get('end_date')
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
    """Update a project"""
    if request.method == "OPTIONS":
        return '', 200
    try:
        data = request.json
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        cur.execute("SELECT id FROM projects WHERE id = %s", (project_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Project not found"}), 404
        
        # Build update query
        update_fields = []
        values = []
        allowed_fields = ['name', 'project_type', 'description', 'funder', 'accreditor', 'project_image_url', 'start_date', 'end_date', 'status']
        for field in allowed_fields:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])
        
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

# ================= RUN SERVER =================
if __name__ == "__main__":
    print("🚀 JumpStart Backend Server running...")
    app.run(debug=True, port=5050, host='0.0.0.0')
