from flask import Flask, request, jsonify
from flask_cors import CORS
from flask import send_from_directory
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

# ================= BENEFICIARIES ROUTES =================

@app.route("/api/projects/<int:project_id>/beneficiaries", methods=["GET", "OPTIONS"])
def get_project_beneficiaries(project_id):
    """Get all beneficiaries for a specific project"""
    if request.method == "OPTIONS":
        return '', 200
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        cur.execute("""
            SELECT id, learner_names, learner_surname, id_number, gender, age, 
                   mobile_phone, email_address, residential_area, learner_province,
                   learner_district_municipality, disability, youth, non_rsa_citizen,
                   race, status, created_at
            FROM beneficiaries
            WHERE project_id = %s
            ORDER BY created_at DESC;
        """, (project_id,))
        
        rows = cur.fetchall()
        beneficiaries = []
        for row in rows:
            beneficiaries.append({
                "id": row[0],
                "first_name": row[1],  # learner_names
                "last_name": row[2],   # learner_surname
                "id_number": row[3],
                "gender": row[4],
                "age": row[5],
                "mobile_phone": row[6],
                "email": row[7],  # email_address
                "residential_area": row[8],
                "learner_province": row[9],
                "learner_municipality": row[10],  # learner_district_municipality
                "disability": row[11],
                "youth": row[12],
                "non_rsa_citizen": row[13],
                "race": row[14],
                "status": row[15],
                "created_at": row[16].strftime("%Y-%m-%d %H:%M:%S") if row[16] else None
            })
        
        cur.close()
        conn.close()
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
        
        # Map frontend field names to database column names
        beneficiary_data = {
            "project_id": project_id,
            "learner_names": data.get('first_name', '').strip(),
            "learner_surname": data.get('last_name', '').strip(),
            "learner_initials": data.get('initials', '').strip(),
            "id_number": data.get('id_number', '').strip(),
            "gender": data.get('gender', '').strip(),
            "race": data.get('race', '').strip(),
            "youth": data.get('youth', False),
            "disability": data.get('disability', False),
            "non_rsa_citizen": data.get('non_rsa_citizen', False),
            "mobile_phone": data.get('mobile_phone', '').strip(),
            "email_address": data.get('email', '').strip(),
            "learner_province": data.get('learner_province', '').strip(),
            "learner_district_municipality": data.get('learner_municipality', '').strip(),
            "residential_area": data.get('residential_area', '').strip(),
            "age": data.get('age'),
            "seta_industry_funded": data.get('seta_funded', False),
            "home_language": data.get('home_language', '').strip(),
            "type_of_learning_programme": data.get('learning_programme_type', '').strip(),
            "programme_start_date": datetime.now().date(),  # Default to today
            "ofo_code": data.get('ofo_code', '').strip(),
            "nqf_level": data.get('nqf_level'),
            "programme_description": data.get('qualification_description', '').strip(),
            "employer_name": data.get('employer_name', '').strip(),
            "employer_sdl_number": data.get('employer_sdl_number', '').strip(),
            "employer_contact_details": data.get('employer_contact_details', '').strip(),
            "training_provider_name": data.get('training_provider_name', '').strip(),
            "training_provider_sdl_number": data.get('training_provider_sdl_number', '').strip(),
            "training_provider_contact_details": data.get('training_provider_contact_details', '').strip(),
            "training_provider_type": data.get('training_provider_type', '').strip(),
            "training_provider_province": data.get('training_provider_province', '').strip(),
            "training_provider_code": data.get('training_provider_code', '').strip(),
            "training_provider_etqa_id": data.get('training_provider_etqa_id', '').strip(),
            "training_provider_postal_address": data.get('training_provider_postal_address', '').strip(),
            "training_provider_physical_address": data.get('training_provider_physical_address', '').strip(),
            "amount_spent_per_learner": data.get('amount_spent_per_learner', 0),
            "learnership_id": data.get('learnership_id', '').strip(),
            "qualification_id": data.get('qualification_id', '').strip(),
            "non_nqf_intervention_subfield": data.get('non_nqf_subfield_id', '').strip(),
            "non_nqf_intervention_status": data.get('non_nqf_status_id', '').strip(),
            "non_nqf_intervention_credit": data.get('non_nqf_credit', '').strip(),
            "unit_standard_id": data.get('unit_standard_id', '').strip(),
            "agreement_moa_number": data.get('agreement_number', '').strip(),
            "last_school_emis": data.get('last_school_emis', '').strip(),
            "last_school_year": data.get('last_school_year'),
            "status": "Active"
        }
        
        # Validate required fields
        if not beneficiary_data["learner_names"]:
            return jsonify({"error": "First name is required"}), 400
        if not beneficiary_data["learner_surname"]:
            return jsonify({"error": "Last name is required"}), 400
        if not beneficiary_data["id_number"]:
            return jsonify({"error": "ID number is required"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        
        # Build the INSERT query dynamically
        columns = []
        values = []
        placeholders = []
        
        for key, value in beneficiary_data.items():
            if value is not None:
                columns.append(key)
                values.append(value)
                placeholders.append("%s")
        
        columns_str = ", ".join(columns)
        placeholders_str = ", ".join(placeholders)
        
        query = f"""
            INSERT INTO beneficiaries ({columns_str})
            VALUES ({placeholders_str})
            RETURNING id;
        """
        
        cur.execute(query, values)
        beneficiary_id = cur.fetchone()[0]
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({
            "id": beneficiary_id, 
            "message": "Beneficiary created successfully"
        }), 201
    
    except psycopg2.errors.UniqueViolation:
        return jsonify({"error": "ID number already exists"}), 409
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
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        cur.execute("""
            SELECT id, learner_names, learner_surname, id_number, gender, age, 
                   mobile_phone, email_address, residential_area, learner_province,
                   learner_district_municipality, disability, youth, non_rsa_citizen,
                   race, status, created_at
            FROM beneficiaries
            WHERE id = %s;
        """, (beneficiary_id,))
        
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            return jsonify({"error": "Beneficiary not found"}), 404
        
        beneficiary = {
            "id": row[0],
            "first_name": row[1],
            "last_name": row[2],
            "id_number": row[3],
            "gender": row[4],
            "age": row[5],
            "mobile_phone": row[6],
            "email": row[7],
            "residential_area": row[8],
            "learner_province": row[9],
            "learner_municipality": row[10],
            "disability": row[11],
            "youth": row[12],
            "non_rsa_citizen": row[13],
            "race": row[14],
            "status": row[15],
            "created_at": row[16].strftime("%Y-%m-%d %H:%M:%S") if row[16] else None
        }
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
        
        # Map frontend field names to database column names
        update_data = {
            "learner_names": data.get('first_name'),
            "learner_surname": data.get('last_name'),
            "id_number": data.get('id_number'),
            "gender": data.get('gender'),
            "age": data.get('age'),
            "race": data.get('race'),
            "youth": data.get('youth'),
            "disability": data.get('disability'),
            "non_rsa_citizen": data.get('non_rsa_citizen'),
            "mobile_phone": data.get('mobile_phone'),
            "email_address": data.get('email'),
            "learner_province": data.get('learner_province'),
            "learner_district_municipality": data.get('learner_municipality'),
            "residential_area": data.get('residential_area'),
            "updated_at": datetime.now()
        }
        
        # Filter out None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        if not update_data:
            cur.close()
            conn.close()
            return jsonify({"error": "No fields to update"}), 400
        
        # Build update query
        update_fields = []
        values = []
        
        for field, value in update_data.items():
            if field == "age" and value is not None:
                try:
                    value = int(value)
                except (ValueError, TypeError):
                    continue
            
            update_fields.append(f"{field} = %s")
            values.append(value)
        
        values.append(beneficiary_id)
        query = f"""
            UPDATE beneficiaries 
            SET {', '.join(update_fields)}
            WHERE id = %s
        """
        
        cur.execute(query, values)
        conn.commit()
        cur.close()
        conn.close()
        
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
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        cur.execute("SELECT id FROM beneficiaries WHERE id = %s", (beneficiary_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Beneficiary not found"}), 404
        
        cur.execute("DELETE FROM beneficiaries WHERE id = %s", (beneficiary_id,))
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"message": "Beneficiary deleted successfully"})
    
    except Exception as e:
        print(f"❌ Error in delete_beneficiary: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Add this import at the top of your file

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