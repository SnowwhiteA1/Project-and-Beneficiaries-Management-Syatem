from flask import Flask, request, jsonify
from flask_cors import CORS
from flask import send_from_directory
import psycopg2
import psycopg2.extras
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
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}
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
        if isinstance(date_value, str):
            return date_value
        return date_value.strftime("%Y-%m-%d")
    return None

def format_boolean(value):
    """Format boolean to string or return None"""
    if value is not None:
        return bool(value)
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
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("""
            SELECT id, name, project_type, description, funder, accreditor, project_image_url,
                   start_date, end_date, status, created_at
            FROM projects
            ORDER BY id DESC;
        """)
        
        rows = cur.fetchall()
        projects = []
        for row in rows:
            project = dict(row)
            project['start_date'] = format_date(project.get('start_date'))
            project['end_date'] = format_date(project.get('end_date'))
            project['created_at'] = format_date(project.get('created_at'))
            projects.append(project)
        
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
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
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
        
        project = dict(row)
        project['start_date'] = format_date(project.get('start_date'))
        project['end_date'] = format_date(project.get('end_date'))
        project['created_at'] = format_date(project.get('created_at'))
        
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
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"{timestamp}_{filename}"
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(filepath)
                    project_image_url = f"http://localhost:5050/uploads/{filename}"
        else:
            # Handle JSON request
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
            description.strip() if description else None,
            funder.strip() if funder else None,
            accreditor.strip() if accreditor else None,
            project_image_url,
            start_date if start_date else None,
            end_date if end_date else None,
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
        
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form
            project_image_url = existing_project[1]
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
        
        update_fields = []
        values = []
        
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
                if isinstance(value, str):
                    values.append(value.strip() if value.strip() else None)
                else:
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
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("""
            SELECT * FROM beneficiaries
            WHERE project_id = %s
            ORDER BY created_at DESC;
        """, (project_id,))
        
        rows = cur.fetchall()
        beneficiaries = []
        for row in rows:
            beneficiary = dict(row)
            # Format dates
            date_fields = ['date_of_birth', 'programme_start_date', 'programme_completion_date', 
                          'certificate_issue_date', 'training_provider_accreditation_start_date',
                          'created_at', 'updated_at']
            for field in date_fields:
                if beneficiary.get(field):
                    beneficiary[field] = format_date(beneficiary[field])
            beneficiaries.append(beneficiary)
        
        cur.close()
        conn.close()
        return jsonify(beneficiaries)
    
    except Exception as e:
        print(f"❌ Error in get_project_beneficiaries: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route("/api/beneficiaries", methods=["GET", "OPTIONS"])
def get_all_beneficiaries():
    """Get all beneficiaries across all projects"""
    if request.method == "OPTIONS":
        return '', 200
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("""
            SELECT b.*, p.name as project_name
            FROM beneficiaries b
            LEFT JOIN projects p ON b.project_id = p.id
            ORDER BY b.created_at DESC;
        """)
        
        rows = cur.fetchall()
        beneficiaries = []
        for row in rows:
            beneficiary = dict(row)
            # Format dates
            date_fields = ['date_of_birth', 'programme_start_date', 'programme_completion_date', 
                          'certificate_issue_date', 'training_provider_accreditation_start_date',
                          'created_at', 'updated_at']
            for field in date_fields:
                if beneficiary.get(field):
                    beneficiary[field] = format_date(beneficiary[field])
            beneficiaries.append(beneficiary)
        
        cur.close()
        conn.close()
        return jsonify(beneficiaries)
    
    except Exception as e:
        print(f"❌ Error in get_all_beneficiaries: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/projects/<int:project_id>/beneficiaries", methods=["POST", "OPTIONS"])
def create_beneficiary(project_id):
    """Create a new beneficiary for a project"""
    if request.method == "OPTIONS":
        return '', 200
    try:
        data = request.json
        print(f"📥 Received beneficiary data: {data}")
        
        # Required fields validation
        required_fields = ['learner_names', 'learner_surname', 'id_number']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
        
        # Map frontend fields to database columns
        beneficiary_data = {
            "project_id": project_id,
            "learner_names": data.get('learner_names', '').strip(),
            "learner_surname": data.get('learner_surname', '').strip(),
            "learner_initials": data.get('initials', '').strip(),
            "id_number": data.get('id_number', '').strip(),
            "date_of_birth": data.get('date_of_birth'),
            "gender": data.get('gender', '').strip(),
            "race": data.get('race', '').strip(),
            "youth": data.get('youth', True),
            "disability": data.get('disability', False),
            "disability_type": data.get('disability_type', '').strip(),
            "non_rsa_citizen": data.get('non_rsa_citizen', False),
            "home_language": data.get('home_language', 'English').strip(),
            "mobile_phone": data.get('mobile_phone', '').strip(),
            "email_address": data.get('email', '').strip(),
            "learner_province": data.get('learner_province', '').strip(),
            "learner_district_municipality": data.get('learner_municipality', '').strip(),
            "learner_local_municipality": data.get('learner_local_municipality', '').strip(),
            "residential_area": data.get('residential_area', '').strip(),
            "age": data.get('age'),
            "beneficiary_status": data.get('beneficiary_status', 'Current'),
            "type_of_learning_programme": data.get('learning_programme_type', 'Training').strip(),
            "programme_start_date": data.get('programme_start_date', datetime.now().date()),
            "programme_completion_date": data.get('programme_completion_date'),
            "certificate_issue_date": data.get('certificate_issue_date'),
            "ofo_code": data.get('ofo_code', '').strip(),
            "nqf_level": data.get('nqf_level', '').strip(),
            "programme_description": data.get('qualification_description', '').strip(),
            "qualification_id": data.get('qualification_id', '').strip(),
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
            "training_provider_accreditation_start_date": data.get('training_provider_accreditation_start_date'),
            "training_provider_province_code": data.get('training_provider_province_code', '').strip(),
            "seta_industry_funded": data.get('seta_funded', False),
            "amount_spent_per_learner": data.get('amount_spent_per_learner', 0),
            "learnership_id": data.get('learnership_id', '').strip(),
            "agreement_moa_number": data.get('agreement_number', '').strip(),
            "non_nqf_intervention_subfield": data.get('non_nqf_subfield_id', '').strip(),
            "non_nqf_intervention_status": data.get('non_nqf_status_id', '').strip(),
            "non_nqf_intervention_credit": data.get('non_nqf_credit', '').strip(),
            "unit_standard_id": data.get('unit_standard_id', '').strip(),
            "last_school_emis": data.get('last_school_emis', '').strip(),
            "last_school_year": data.get('last_school_year', '').strip(),
            "area_type": data.get('area_type', '').strip(),
            "stats_area_code": data.get('stats_area_code', '').strip(),
            "physical_address_line1": data.get('physical_address_line1', '').strip(),
            "physical_address_line2": data.get('physical_address_line2', '').strip(),
            "physical_address_code": data.get('physical_address_code', '').strip(),
            "postal_address_line1": data.get('postal_address_line1', '').strip(),
            "postal_address_line2": data.get('postal_address_line2', '').strip(),
            "postal_code": data.get('postal_code', '').strip(),
            "parent_guardian_mobile": data.get('parent_guardian_mobile', '').strip(),
            "parent_guardian_email": data.get('parent_guardian_email', '').strip(),
            "skills": data.get('skills', '').strip(),
            "employment_status": data.get('employment_status', '').strip(),
            "current_employer": data.get('current_employer', '').strip(),
            "monthly_income": data.get('monthly_income', 0),
            "programme_outcome": data.get('programme_outcome', '').strip(),
            "notes": data.get('notes', '').strip(),
            "status": data.get('status', 'Active'),
            "validation_errors": data.get('validation_errors', ''),
            "valid_id_number_length": data.get('valid_id_number_length', True),
            "valid_age_for_youth": data.get('valid_age_for_youth', True),
            "correctly_reported_youth": data.get('correctly_reported_youth', True),
            "correctly_reported_gender": data.get('correctly_reported_gender', True),
            "correctly_reported_race": data.get('correctly_reported_race', True),
            "black_designated_groups": data.get('black_designated_groups', 0),
            "black_females": data.get('black_females', 0),
            "black_males": data.get('black_males', 0),
            "coloured_females": data.get('coloured_females', 0),
            "coloured_males": data.get('coloured_males', 0),
            "indian_females": data.get('indian_females', 0),
            "indian_males": data.get('indian_males', 0),
            "white_females": data.get('white_females', 0),
            "white_males": data.get('white_males', 0),
            "disabled_females": data.get('disabled_females', 0),
            "disabled_males": data.get('disabled_males', 0),
            "youth_females": data.get('youth_females', 0),
            "youth_males": data.get('youth_males', 0),
            "non_rsa_citizen_females": data.get('non_rsa_citizen_females', 0),
            "non_rsa_citizen_males": data.get('non_rsa_citizen_males', 0),
            "project_number": data.get('project_number', '').strip(),
            "activity_number": data.get('activity_number', '').strip(),
            "app_sub_programme": data.get('app_sub_programme', '').strip(),
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Validate age if provided
        if beneficiary_data["age"] is not None:
            try:
                age = int(beneficiary_data["age"])
                if age < 0 or age > 120:
                    return jsonify({"error": "Age must be between 0 and 120"}), 400
                beneficiary_data["age"] = age
            except (ValueError, TypeError):
                return jsonify({"error": "Age must be a valid number"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        
        # Build INSERT query
        columns = []
        values = []
        placeholders = []
        
        for key, value in beneficiary_data.items():
            if value is not None and value != '':
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
        
        try:
            cur.execute(query, values)
            beneficiary_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            print(f"✅ Beneficiary created successfully with ID: {beneficiary_id}")
            return jsonify({
                "id": beneficiary_id, 
                "message": "Beneficiary created successfully"
            }), 201
            
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            cur.close()
            conn.close()
            return jsonify({"error": "ID number already exists"}), 409
        except Exception as e:
            conn.rollback()
            cur.close()
            conn.close()
            print(f"❌ Database error: {str(e)}")
            return jsonify({"error": f"Database error: {str(e)}"}), 500
    
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
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("""
            SELECT * FROM beneficiaries
            WHERE id = %s;
        """, (beneficiary_id,))
        
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            return jsonify({"error": "Beneficiary not found"}), 404
        
        beneficiary = dict(row)
        # Format dates
        date_fields = ['date_of_birth', 'programme_start_date', 'programme_completion_date', 
                      'certificate_issue_date', 'training_provider_accreditation_start_date',
                      'created_at', 'updated_at']
        for field in date_fields:
            if beneficiary.get(field):
                beneficiary[field] = format_date(beneficiary[field])
        
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
        
        # Map fields to update
        update_data = {
            "learner_names": data.get('learner_names'),
            "learner_surname": data.get('learner_surname'),
            "learner_initials": data.get('initials'),
            "id_number": data.get('id_number'),
            "date_of_birth": data.get('date_of_birth'),
            "gender": data.get('gender'),
            "age": data.get('age'),
            "beneficiary_status": data.get('beneficiary_status'),
            "race": data.get('race'),
            "youth": data.get('youth'),
            "disability": data.get('disability'),
            "disability_type": data.get('disability_type'),
            "non_rsa_citizen": data.get('non_rsa_citizen'),
            "home_language": data.get('home_language'),
            "mobile_phone": data.get('mobile_phone'),
            "email_address": data.get('email'),
            "learner_province": data.get('learner_province'),
            "learner_district_municipality": data.get('learner_municipality'),
            "learner_local_municipality": data.get('learner_local_municipality'),
            "residential_area": data.get('residential_area'),
            "area_type": data.get('area_type'),
            "type_of_learning_programme": data.get('learning_programme_type'),
            "programme_start_date": data.get('programme_start_date'),
            "programme_completion_date": data.get('programme_completion_date'),
            "certificate_issue_date": data.get('certificate_issue_date'),
            "ofo_code": data.get('ofo_code'),
            "nqf_level": data.get('nqf_level'),
            "programme_description": data.get('programme_description'),
            "qualification_id": data.get('qualification_id'),
            "employer_name": data.get('employer_name'),
            "employer_sdl_number": data.get('employer_sdl_number'),
            "employer_contact_details": data.get('employer_contact_details'),
            "training_provider_name": data.get('training_provider_name'),
            "training_provider_sdl_number": data.get('training_provider_sdl_number'),
            "training_provider_contact_details": data.get('training_provider_contact_details'),
            "training_provider_type": data.get('training_provider_type'),
            "training_provider_province": data.get('training_provider_province'),
            "training_provider_code": data.get('training_provider_code'),
            "training_provider_etqa_id": data.get('training_provider_etqa_id'),
            "seta_industry_funded": data.get('seta_funded'),
            "amount_spent_per_learner": data.get('amount_spent_per_learner'),
            "learnership_id": data.get('learnership_id'),
            "agreement_moa_number": data.get('agreement_number'),
            "non_nqf_intervention_subfield": data.get('non_nqf_subfield_id'),
            "non_nqf_intervention_status": data.get('non_nqf_status_id'),
            "non_nqf_intervention_credit": data.get('non_nqf_credit'),
            "unit_standard_id": data.get('unit_standard_id'),
            "last_school_emis": data.get('last_school_emis'),
            "last_school_year": data.get('last_school_year'),
            "physical_address_line1": data.get('physical_address_line1'),
            "physical_address_line2": data.get('physical_address_line2'),
            "physical_address_code": data.get('physical_address_code'),
            "postal_address_line1": data.get('postal_address_line1'),
            "postal_address_line2": data.get('postal_address_line2'),
            "postal_code": data.get('postal_code'),
            "parent_guardian_mobile": data.get('parent_guardian_mobile'),
            "parent_guardian_email": data.get('parent_guardian_email'),
            "skills": data.get('skills'),
            "employment_status": data.get('employment_status'),
            "current_employer": data.get('current_employer'),
            "monthly_income": data.get('monthly_income'),
            "programme_outcome": data.get('programme_outcome'),
            "notes": data.get('notes'),
            "status": data.get('status'),
            "updated_at": datetime.now()
        }
        
        # Filter out None values
        update_data = {k: v for k, v in update_data.items() if v is not None and v != ''}
        
        if not update_data:
            cur.close()
            conn.close()
            return jsonify({"error": "No fields to update"}), 400
        
        # Build update query
        update_fields = []
        values = []
        
        for field, value in update_data.items():
            update_fields.append(f"{field} = %s")
            values.append(value)
        
        values.append(beneficiary_id)
        query = f"""
            UPDATE beneficiaries 
            SET {', '.join(update_fields)}
            WHERE id = %s
        """
        
        try:
            cur.execute(query, values)
            conn.commit()
            cur.close()
            conn.close()
            
            return jsonify({"message": "Beneficiary updated successfully"})
            
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            cur.close()
            conn.close()
            return jsonify({"error": "ID number already exists"}), 409
    
    except Exception as e:
        print(f"❌ Error in update_beneficiary: {str(e)}")
        print(traceback.format_exc())
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


# ================= REPLACEMENTS ROUTES =================

@app.route("/api/projects/<int:project_id>/replacements", methods=["GET", "OPTIONS"])
def get_project_replacements(project_id):
    """Get all replacements for a project"""
    if request.method == "OPTIONS":
        return '', 200
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("""
            SELECT 
                r.id,
                r.project_id,
                r.replaced_beneficiary_id,
                r.replacement_beneficiary_id,
                r.replacement_date,
                r.reason,
                r.created_at,
                b1.learner_names as replaced_first_name,
                b1.learner_surname as replaced_last_name,
                b1.id_number as replaced_id_number,
                b2.learner_names as replacement_first_name,
                b2.learner_surname as replacement_last_name,
                b2.id_number as replacement_id_number
            FROM replacements r
            LEFT JOIN beneficiaries b1 ON r.replaced_beneficiary_id = b1.id
            LEFT JOIN beneficiaries b2 ON r.replacement_beneficiary_id = b2.id
            WHERE r.project_id = %s
            ORDER BY r.replacement_date DESC, r.created_at DESC;
        """, (project_id,))
        
        rows = cur.fetchall()
        replacements = []
        for row in rows:
            replacement = dict(row)
            replacement['replacement_date'] = format_date(replacement.get('replacement_date'))
            replacement['created_at'] = format_date(replacement.get('created_at'))
            replacements.append(replacement)
        
        cur.close()
        conn.close()
        return jsonify(replacements)
    
    except Exception as e:
        print(f"❌ Error in get_project_replacements: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


# ================= REPLACEMENTS ROUTES =================

# ... other routes like get_project_replacements ...

# KEEP ONLY THIS ONE VERSION of replace_beneficiary
@app.route("/api/projects/<int:project_id>/beneficiaries/replace", methods=["POST", "OPTIONS"])
def replace_beneficiary(project_id):
    """Replace a beneficiary with another"""
    if request.method == "OPTIONS":
        return '', 200
    
    conn = None
    cur = None
    
    try:
        data = request.json
        print(f"📥 Received replacement request: {data}")
        
        replaced_id = data.get('replaced_beneficiary_id')
        replacement_id = data.get('replacement_beneficiary_id')
        reason = data.get('reason', '').strip()
        
        # Validate required fields
        if not replaced_id or not replacement_id:
            return jsonify({"error": "Missing required fields: replaced_beneficiary_id and replacement_beneficiary_id"}), 400
        
        # Check if replacing with self
        if replaced_id == replacement_id:
            return jsonify({"error": "Cannot replace a beneficiary with themselves"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        # IMPORTANT: Don't disable autocommit
        cur = conn.cursor()
        
        # First, verify both beneficiaries exist and belong to the project
        cur.execute("""
            SELECT id, beneficiary_status, status 
            FROM beneficiaries 
            WHERE id IN (%s, %s) AND project_id = %s
        """, (replaced_id, replacement_id, project_id))
        
        beneficiaries = cur.fetchall()
        if len(beneficiaries) != 2:
            return jsonify({"error": "One or both beneficiaries not found in this project"}), 404
        
        # Check if replaced beneficiary is already replaced
        cur.execute("SELECT id FROM replacements WHERE replaced_beneficiary_id = %s", (replaced_id,))
        if cur.fetchone():
            return jsonify({"error": "This beneficiary has already been replaced"}), 409
        
        # Update replaced beneficiary
        cur.execute("""
            UPDATE beneficiaries 
            SET beneficiary_status = 'Replaced', 
                status = 'Replaced'
            WHERE id = %s
        """, (replaced_id,))
        
        # Update replacement beneficiary
        cur.execute("""
            UPDATE beneficiaries 
            SET beneficiary_status = 'Replacement', 
                status = 'Active'
            WHERE id = %s
        """, (replacement_id,))
        
        # Create replacement record
        cur.execute("""
            INSERT INTO replacements (project_id, replaced_beneficiary_id, replacement_beneficiary_id, reason, replacement_date, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (project_id, replaced_id, replacement_id, reason, datetime.now().date(), datetime.now()))
        
        replacement_record_id = cur.fetchone()[0]
        
        # Commit all changes
        conn.commit()
        
        print(f"✅ Replacement successful with ID: {replacement_record_id}")
        return jsonify({
            "message": "Beneficiary replaced successfully",
            "replacement_id": replacement_record_id
        }), 200
        
    except psycopg2.Error as e:
        # Handle database errors specifically
        if conn:
            conn.rollback()
        error_msg = str(e)
        print(f"❌ Database error during replacement: {error_msg}")
        print(traceback.format_exc())
        return jsonify({"error": f"Failed to replace beneficiary: {error_msg}"}), 500
    
    except Exception as e:
        # Handle other errors
        if conn:
            conn.rollback()
        print(f"❌ Error during replacement: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": f"Failed to replace beneficiary: {str(e)}"}), 500
    
    finally:
        # Clean up resources
        if cur:
            cur.close()
        if conn:
            conn.close()

# ... rest of your routes ...



# ================= BENEFICIARY STATISTICS =================

@app.route("/api/beneficiaries/statistics", methods=["GET", "OPTIONS"])
def get_beneficiary_statistics():
    """Get beneficiary statistics"""
    if request.method == "OPTIONS":
        return '', 200
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Get total beneficiaries
        cur.execute("SELECT COUNT(*) as count FROM beneficiaries")
        total_beneficiaries = cur.fetchone()['count']
        
        # Get beneficiaries by gender
        cur.execute("""
            SELECT gender, COUNT(*) as count 
            FROM beneficiaries 
            WHERE gender IS NOT NULL AND gender != ''
            GROUP BY gender
        """)
        gender_stats = {row['gender']: row['count'] for row in cur.fetchall()}
        
        # Get beneficiaries by race
        cur.execute("""
            SELECT race, COUNT(*) as count 
            FROM beneficiaries 
            WHERE race IS NOT NULL AND race != ''
            GROUP BY race
        """)
        race_stats = {row['race']: row['count'] for row in cur.fetchall()}
        
        # Get beneficiaries by status
        cur.execute("""
            SELECT beneficiary_status, COUNT(*) as count 
            FROM beneficiaries 
            WHERE beneficiary_status IS NOT NULL AND beneficiary_status != ''
            GROUP BY beneficiary_status
        """)
        status_stats = {row['beneficiary_status']: row['count'] for row in cur.fetchall()}
        
        # Get beneficiaries by age group
        cur.execute("""
            SELECT 
                CASE 
                    WHEN age < 18 THEN 'Under 18'
                    WHEN age BETWEEN 18 AND 25 THEN '18-25'
                    WHEN age BETWEEN 26 AND 35 THEN '26-35'
                    WHEN age BETWEEN 36 AND 45 THEN '36-45'
                    WHEN age > 45 THEN 'Over 45'
                    ELSE 'Unknown'
                END as age_group,
                COUNT(*) as count
            FROM beneficiaries 
            WHERE age IS NOT NULL
            GROUP BY age_group
        """)
        age_stats = {row['age_group']: row['count'] for row in cur.fetchall()}
        
        # Get beneficiaries by province
        cur.execute("""
            SELECT learner_province, COUNT(*) as count 
            FROM beneficiaries 
            WHERE learner_province IS NOT NULL AND learner_province != ''
            GROUP BY learner_province
        """)
        province_stats = {row['learner_province']: row['count'] for row in cur.fetchall()}
        
        cur.close()
        conn.close()
        
        return jsonify({
            "total_beneficiaries": total_beneficiaries,
            "gender_distribution": gender_stats,
            "race_distribution": race_stats,
            "status_distribution": status_stats,
            "age_distribution": age_stats,
            "province_distribution": province_stats
        })
    
    except Exception as e:
        print(f"❌ Error in get_beneficiary_statistics: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ================= SEARCH BENEFICIARIES =================

@app.route("/api/beneficiaries/search", methods=["GET", "OPTIONS"])
def search_beneficiaries():
    """Search beneficiaries by various criteria"""
    if request.method == "OPTIONS":
        return '', 200
    
    try:
        # Get search parameters
        search_term = request.args.get('q', '')
        project_id = request.args.get('project_id')
        gender = request.args.get('gender')
        race = request.args.get('race')
        beneficiary_status = request.args.get('beneficiary_status')
        min_age = request.args.get('min_age')
        max_age = request.args.get('max_age')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Build query dynamically
        query = """
            SELECT b.*, p.name as project_name
            FROM beneficiaries b
            LEFT JOIN projects p ON b.project_id = p.id
            WHERE 1=1
        """
        params = []
        
        if search_term:
            query += """
                AND (b.learner_names ILIKE %s 
                OR b.learner_surname ILIKE %s 
                OR b.id_number ILIKE %s 
                OR b.email_address ILIKE %s)
            """
            search_pattern = f"%{search_term}%"
            params.extend([search_pattern, search_pattern, search_pattern, search_pattern])
        
        if project_id:
            query += " AND b.project_id = %s"
            params.append(project_id)
        
        if gender:
            query += " AND b.gender = %s"
            params.append(gender)
        
        if race:
            query += " AND b.race = %s"
            params.append(race)
        
        if beneficiary_status:
            query += " AND b.beneficiary_status = %s"
            params.append(beneficiary_status)
        
        if min_age:
            query += " AND b.age >= %s"
            params.append(int(min_age))
        
        if max_age:
            query += " AND b.age <= %s"
            params.append(int(max_age))
        
        query += " ORDER BY b.created_at DESC"
        
        cur.execute(query, params)
        rows = cur.fetchall()
        
        beneficiaries = []
        for row in rows:
            beneficiary = dict(row)
            # Format dates
            date_fields = ['date_of_birth', 'programme_start_date', 'programme_completion_date', 
                          'certificate_issue_date', 'training_provider_accreditation_start_date',
                          'created_at', 'updated_at']
            for field in date_fields:
                if beneficiary.get(field):
                    beneficiary[field] = format_date(beneficiary[field])
            beneficiaries.append(beneficiary)
        
        cur.close()
        conn.close()
        
        return jsonify({
            "results": beneficiaries,
            "count": len(beneficiaries)
        })
    
    except Exception as e:
        print(f"❌ Error in search_beneficiaries: {str(e)}")
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
    
# ================= ANALYTICS ENDPOINTS =================

@app.route("/api/analytics/projects", methods=["GET", "OPTIONS"])
def get_project_analytics():
    """Simple analytics endpoint"""
    if request.method == "OPTIONS":
        return '', 200
    try:
        print("🔍 Analytics endpoint called")
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Get total projects
        cur.execute("SELECT COUNT(*) as count FROM projects")
        total_projects = cur.fetchone()['count']
        
        # Get project types
        cur.execute("SELECT project_type, COUNT(*) as count FROM projects WHERE project_type IS NOT NULL GROUP BY project_type")
        type_data = {row['project_type']: row['count'] for row in cur.fetchall()}
        
        # Get status
        cur.execute("SELECT status, COUNT(*) as count FROM projects WHERE status IS NOT NULL GROUP BY status")
        status_data = {row['status']: row['count'] for row in cur.fetchall()}
        
        # Get funders
        cur.execute("SELECT COALESCE(funder, 'No Funder') as funder, COUNT(*) as count FROM projects GROUP BY funder")
        funder_data = {row['funder']: row['count'] for row in cur.fetchall()}
        
        cur.close()
        conn.close()
        
        print(f"✅ Analytics data: {total_projects} projects")
        
        return jsonify({
            "summary": {
                "total_projects": total_projects,
                "active_projects": status_data.get('Active', 0),
                "completed_projects": status_data.get('Completed', 0),
                "completion_rate": round((status_data.get('Completed', 0) / total_projects * 100), 1) if total_projects > 0 else 0,
                "unique_project_types": len(type_data),
                "unique_funders": len(funder_data) - 1 if 'No Funder' in funder_data else len(funder_data)
            },
            "distributions": {
                "by_type": type_data,
                "by_status": status_data,
                "by_funder": funder_data
            },
            "charts": {
                "type_data": [{"name": k, "value": v} for k, v in type_data.items()],
                "status_data": [{"name": k, "value": v} for k, v in status_data.items()],
                "funder_data": [{"name": k, "value": v} for k, v in funder_data.items()]
            }
        })
        
    except Exception as e:
        print(f"❌ Error in analytics: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ================= STATIC FILES FOR UPLOADS =================
@app.route('/uploads/<filename>')
def serve_uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ================= RUN SERVER =================
if __name__ == "__main__":
    print("🚀 JumpStart Backend Server running...")
    print("📊 Database: jumpstart_database")
    print("🔗 API running on: http://localhost:5050")
    print("📁 Upload folder: uploads/")
    app.run(debug=True, port=5050, host='0.0.0.0')