from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import traceback
from datetime import datetime
import json

app = Flask(__name__)

# Configure CORS properly
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"]
    }
})

# Database configuration - UPDATE THESE VALUES!
DB_CONFIG = {
    'host': 'localhost',
    'database': 'jumpstart_project_and_beneficiary_management_system',
    'user': 'postgres',  # Change if different
    'password': 'admin123',  # Change to your PostgreSQL password
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

# ============= HELPER FUNCTIONS =============

def format_date(date_value):
    """Format date to string or return None"""
    if date_value:
        return date_value.strftime("%Y-%m-%d")
    return None

def parse_json_array(value):
    """Parse JSON array from database or request"""
    if isinstance(value, list):
        return value
    if value and isinstance(value, str):
        try:
            return json.loads(value)
        except:
            return []
    return []

# ============= PROJECTS ROUTES =============

@app.route("/api/projects", methods=["GET", "OPTIONS"])
def get_projects():
    """Get all projects"""
    if request.method == "OPTIONS":
        return '', 200
    
    try:
        print("📋 Fetching all projects...")
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        cur.execute("""
            SELECT id, title, description, start_date, end_date, participants, accreditors
            FROM projects
            ORDER BY id DESC;
        """)
        
        rows = cur.fetchall()
        projects = []
        
        for row in rows:
            projects.append({
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "start_date": format_date(row[3]),
                "end_date": format_date(row[4]),
                "participants": row[5],
                "accreditors": parse_json_array(row[6])
            })
        
        cur.close()
        conn.close()
        
        print(f"✅ Found {len(projects)} projects")
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
        print(f"📋 Fetching project {project_id}...")
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        cur.execute("""
            SELECT id, title, description, start_date, end_date, participants, accreditors
            FROM projects WHERE id = %s;
        """, (project_id,))
        
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            return jsonify({"error": "Project not found"}), 404
        
        project = {
            "id": row[0],
            "title": row[1],
            "description": row[2],
            "start_date": format_date(row[3]),
            "end_date": format_date(row[4]),
            "participants": row[5],
            "accreditors": parse_json_array(row[6])
        }
        
        print(f"✅ Found project: {project['title']}")
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
        print(f"📝 Creating new project with data: {data}")
        
        # Validate required fields
        required_fields = ['title', 'description', 'start_date', 'end_date', 'participants']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        
        # Insert project
        cur.execute("""
            INSERT INTO projects (title, description, start_date, end_date, participants, accreditors)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            data['title'].strip(),
            data['description'].strip(),
            data['start_date'],
            data['end_date'],
            int(data['participants']),
            data.get('accreditors', [])
        ))
        
        project_id = cur.fetchone()[0]
        conn.commit()
        
        cur.close()
        conn.close()
        
        print(f"✅ Project created with ID: {project_id}")
        return jsonify({
            "id": project_id,
            "message": "Project created successfully"
        }), 201
        
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
        print(f"📝 Updating project {project_id} with data: {data}")
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        
        # Check if project exists
        cur.execute("SELECT id FROM projects WHERE id = %s", (project_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Project not found"}), 404
        
        # Build update query
        update_fields = []
        values = []
        
        fields_to_update = {
            'title': data.get('title'),
            'description': data.get('description'),
            'start_date': data.get('start_date'),
            'end_date': data.get('end_date'),
            'participants': data.get('participants'),
            'accreditors': data.get('accreditors')
        }
        
        for field, value in fields_to_update.items():
            if value is not None:
                update_fields.append(f"{field} = %s")
                values.append(value)
        
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
        
        print(f"✅ Project {project_id} updated successfully")
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
        print(f"🗑️ Deleting project {project_id}...")
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        
        # Check if project exists
        cur.execute("SELECT id FROM projects WHERE id = %s", (project_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Project not found"}), 404
        
        # Delete project (cascade will delete beneficiaries)
        cur.execute("DELETE FROM projects WHERE id = %s", (project_id,))
        conn.commit()
        
        cur.close()
        conn.close()
        
        print(f"✅ Project {project_id} deleted successfully")
        return jsonify({"message": "Project deleted successfully"})
        
    except Exception as e:
        print(f"❌ Error in delete_project: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ============= BENEFICIARIES ROUTES =============

@app.route("/api/projects/<int:project_id>/beneficiaries", methods=["GET", "OPTIONS"])
def get_project_beneficiaries(project_id):
    """Get all beneficiaries for a project"""
    if request.method == "OPTIONS":
        return '', 200
    
    try:
        print(f"📋 Fetching beneficiaries for project {project_id}...")
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        
        # Check if project exists
        cur.execute("SELECT id FROM projects WHERE id = %s", (project_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Project not found"}), 404
        
        # Get beneficiaries (simplified for frontend)
        cur.execute("""
            SELECT id, first_name, last_name, id_number, gender, age, 
                   mobile_phone, email, residential_area, created_at
            FROM beneficiaries
            WHERE project_id = %s
            ORDER BY id DESC;
        """, (project_id,))
        
        rows = cur.fetchall()
        beneficiaries = []
        
        for row in rows:
            beneficiaries.append({
                "id": row[0],
                "first_name": row[1] or "",
                "last_name": row[2] or "",
                "id_number": row[3] or "",
                "gender": row[4] or "",
                "age": row[5],
                "mobile_phone": row[6] or "",
                "email": row[7] or "",
                "residential_area": row[8] or "",
                "created_at": row[9].strftime("%Y-%m-%d %H:%M:%S") if row[9] else None
            })
        
        cur.close()
        conn.close()
        
        print(f"✅ Found {len(beneficiaries)} beneficiaries")
        return jsonify(beneficiaries)
        
    except Exception as e:
        print(f"❌ Error in get_project_beneficiaries: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route("/api/projects/<int:project_id>/beneficiaries", methods=["POST", "OPTIONS"])
def create_beneficiary(project_id):
    """Create a new beneficiary for a project"""
    if request.method == "OPTIONS":
        return '', 200
    
    try:
        data = request.json
        print(f"📝 Creating beneficiary for project {project_id} with data: {data}")
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'id_number']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        
        # Check if project exists
        cur.execute("SELECT id FROM projects WHERE id = %s", (project_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Project not found"}), 404
        
        # Insert beneficiary with all fields (NULL for optional ones)
        cur.execute("""
            INSERT INTO beneficiaries (
                project_id, first_name, last_name, initials, title, id_number, race, gender, age,
                disability, youth, non_rsa_citizen, mobile_phone, email, guardian_contact,
                learner_province, learner_municipality, residential_area, urban_rural,
                physical_address_code, stats_area_code, home_language, learning_programme_type,
                date_entered, date_completed, certificate_issue_date, ofo_code, nqf_level,
                qualification_description, employer_name, employer_sdl_number,
                employer_contact_details, training_provider_name, training_provider_sdl_number,
                training_provider_contact_details, training_provider_type,
                training_provider_province, training_provider_code, training_provider_etqa_id,
                training_provider_accreditation_start, training_provider_postal_address,
                training_provider_physical_address, seta_funded, amount_spent_per_learner,
                learnership_id, qualification_id, non_nqf_subfield_id, non_nqf_status_id,
                non_nqf_credit, unit_standard_id, agreement_number, last_school_emis,
                last_school_year
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id;
        """, (
            project_id,
            data['first_name'].strip(),
            data['last_name'].strip(),
            data.get('initials', ''),
            data.get('title', ''),
            data['id_number'].strip(),
            data.get('race', ''),
            data.get('gender', ''),
            data.get('age'),
            data.get('disability', False),
            data.get('youth', False),
            data.get('non_rsa_citizen', False),
            data.get('mobile_phone', ''),
            data.get('email', ''),
            data.get('guardian_contact', ''),
            data.get('learner_province', ''),
            data.get('learner_municipality', ''),
            data.get('residential_area', ''),
            data.get('urban_rural', ''),
            data.get('physical_address_code', ''),
            data.get('stats_area_code', ''),
            data.get('home_language', ''),
            data.get('learning_programme_type', ''),
            data.get('date_entered'),
            data.get('date_completed'),
            data.get('certificate_issue_date'),
            data.get('ofo_code', ''),
            data.get('nqf_level'),
            data.get('qualification_description', ''),
            data.get('employer_name', ''),
            data.get('employer_sdl_number', ''),
            data.get('employer_contact_details', ''),
            data.get('training_provider_name', ''),
            data.get('training_provider_sdl_number', ''),
            data.get('training_provider_contact_details', ''),
            data.get('training_provider_type', ''),
            data.get('training_provider_province', ''),
            data.get('training_provider_code', ''),
            data.get('training_provider_etqa_id', ''),
            data.get('training_provider_accreditation_start'),
            data.get('training_provider_postal_address', ''),
            data.get('training_provider_physical_address', ''),
            data.get('seta_funded', False),
            data.get('amount_spent_per_learner', 0.0),
            data.get('learnership_id', ''),
            data.get('qualification_id', ''),
            data.get('non_nqf_subfield_id', ''),
            data.get('non_nqf_status_id', ''),
            data.get('non_nqf_credit', ''),
            data.get('unit_standard_id', ''),
            data.get('agreement_number', ''),
            data.get('last_school_emis', ''),
            data.get('last_school_year')
        ))
        
        beneficiary_id = cur.fetchone()[0]
        conn.commit()
        
        cur.close()
        conn.close()
        
        print(f"✅ Beneficiary created with ID: {beneficiary_id}")
        return jsonify({
            "id": beneficiary_id,
            "message": "Beneficiary added successfully"
        }), 201
        
    except Exception as e:
        print(f"❌ Error in create_beneficiary: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route("/api/beneficiaries/<int:beneficiary_id>", methods=["GET", "OPTIONS"])
def get_beneficiary(beneficiary_id):
    """Get a single beneficiary by ID"""
    if request.method == "OPTIONS":
        return '', 200
    
    try:
        print(f"📋 Fetching beneficiary {beneficiary_id}...")
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        cur.execute("""
            SELECT id, first_name, last_name, id_number, gender, age, 
                   mobile_phone, email, residential_area, created_at
            FROM beneficiaries WHERE id = %s;
        """, (beneficiary_id,))
        
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            return jsonify({"error": "Beneficiary not found"}), 404
        
        beneficiary = {
            "id": row[0],
            "first_name": row[1] or "",
            "last_name": row[2] or "",
            "id_number": row[3] or "",
            "gender": row[4] or "",
            "age": row[5],
            "mobile_phone": row[6] or "",
            "email": row[7] or "",
            "residential_area": row[8] or "",
            "created_at": row[9].strftime("%Y-%m-%d %H:%M:%S") if row[9] else None
        }
        
        print(f"✅ Found beneficiary: {beneficiary['first_name']} {beneficiary['last_name']}")
        return jsonify(beneficiary)
        
    except Exception as e:
        print(f"❌ Error in get_beneficiary: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/beneficiaries/<int:beneficiary_id>", methods=["PUT", "OPTIONS"])
def update_beneficiary(beneficiary_id):
    """Update a beneficiary"""
    if request.method == "OPTIONS":
        return '', 200
    
    try:
        data = request.json
        print(f"📝 Updating beneficiary {beneficiary_id} with data: {data}")
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        
        # Check if beneficiary exists
        cur.execute("SELECT id FROM beneficiaries WHERE id = %s", (beneficiary_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Beneficiary not found"}), 404
        
        # Build update query for basic fields
        update_fields = []
        values = []
        
        basic_fields = [
            'first_name', 'last_name', 'initials', 'title', 'id_number', 'race', 'gender', 'age',
            'mobile_phone', 'email', 'guardian_contact', 'residential_area'
        ]
        
        for field in basic_fields:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])
        
        if not update_fields:
            cur.close()
            conn.close()
            return jsonify({"error": "No fields to update"}), 400
        
        values.append(beneficiary_id)
        
        query = f"UPDATE beneficiaries SET {', '.join(update_fields)} WHERE id = %s"
        cur.execute(query, values)
        conn.commit()
        
        cur.close()
        conn.close()
        
        print(f"✅ Beneficiary {beneficiary_id} updated successfully")
        return jsonify({"message": "Beneficiary updated successfully"})
        
    except Exception as e:
        print(f"❌ Error in update_beneficiary: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/beneficiaries/<int:beneficiary_id>", methods=["DELETE", "OPTIONS"])
def delete_beneficiary(beneficiary_id):
    """Delete a beneficiary"""
    if request.method == "OPTIONS":
        return '', 200
    
    try:
        print(f"🗑️ Deleting beneficiary {beneficiary_id}...")
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        
        # Check if beneficiary exists
        cur.execute("SELECT id FROM beneficiaries WHERE id = %s", (beneficiary_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Beneficiary not found"}), 404
        
        cur.execute("DELETE FROM beneficiaries WHERE id = %s", (beneficiary_id,))
        conn.commit()
        
        cur.close()
        conn.close()
        
        print(f"✅ Beneficiary {beneficiary_id} deleted successfully")
        return jsonify({"message": "Beneficiary deleted successfully"})
        
    except Exception as e:
        print(f"❌ Error in delete_beneficiary: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ============= HEALTH CHECK =============

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
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

if __name__ == "__main__":
    print("🚀 Starting JumpStart Backend Server...")
    print(f"📊 Database: {DB_CONFIG['database']}")
    print(f"👤 User: {DB_CONFIG['user']}")
    print(f"🌐 Server will run on: http://127.0.0.1:5050")
    print("=" * 50)
    app.run(debug=True, port=5050, host='0.0.0.0')