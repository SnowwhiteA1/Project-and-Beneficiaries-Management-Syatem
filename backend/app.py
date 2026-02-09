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
            SELECT id, learner_names, learner_surname, learner_initials, id_number, 
                   date_of_birth, gender, race, youth, disability, disability_type,
                   non_rsa_citizen, home_language, mobile_phone, email_address,
                   type_of_learning_programme, programme_start_date, programme_completion_date,
                   certificate_issue_date, ofo_code, nqf_level, programme_description,
                   qualification_id, employer_name, employer_sdl_number, employer_contact_details,
                   training_provider_name, training_provider_sdl_number, training_provider_contact_details,
                   training_provider_type, training_provider_province, training_provider_code,
                   training_provider_etqa_id, learner_province, learner_district_municipality,
                   learner_local_municipality, residential_area, area_type, stats_area_code,
                   physical_address_line1, physical_address_line2, physical_address_code,
                   postal_address_line1, postal_address_line2, postal_code, seta_industry_funded,
                   amount_spent_per_learner, agreement_moa_number, black_designated_groups,
                   black_females, black_males, coloured_females, coloured_males, indian_females,
                   indian_males, white_females, white_males, disabled_females, disabled_males,
                   youth_females, youth_males, non_rsa_citizen_females, non_rsa_citizen_males,
                   project_number, activity_number, app_sub_programme, parent_guardian_mobile,
                   parent_guardian_email, non_nqf_intervention_subfield, non_nqf_intervention_status,
                   non_nqf_intervention_credit, unit_standard_id, training_provider_postal_address,
                   training_provider_accreditation_start_date, training_provider_province_code,
                   training_provider_physical_address, learnership_id, last_school_emis,
                   last_school_year, valid_id_number_length, valid_age_for_youth,
                   correctly_reported_youth, correctly_reported_gender, correctly_reported_race,
                   skills, employment_status, current_employer, monthly_income, programme_outcome,
                   status, age, beneficiary_status, id_document_url, qualification_document_url,
                   notes, validation_errors, created_at, updated_at
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
                "initials": row[3],    # learner_initials
                "id_number": row[4],
                "date_of_birth": format_date(row[5]),
                "gender": row[6],
                "race": row[7],
                "youth": format_boolean(row[8]),
                "disability": format_boolean(row[9]),
                "disability_type": row[10],
                "non_rsa_citizen": format_boolean(row[11]),
                "home_language": row[12],
                "mobile_phone": row[13],
                "email": row[14],  # email_address
                "learning_programme_type": row[15],  # type_of_learning_programme
                "programme_start_date": format_date(row[16]),
                "programme_completion_date": format_date(row[17]),
                "certificate_issue_date": format_date(row[18]),
                "ofo_code": row[19],
                "nqf_level": row[20],
                "programme_description": row[21],
                "qualification_id": row[22],
                "employer_name": row[23],
                "employer_sdl_number": row[24],
                "employer_contact_details": row[25],
                "training_provider_name": row[26],
                "training_provider_sdl_number": row[27],
                "training_provider_contact_details": row[28],
                "training_provider_type": row[29],
                "training_provider_province": row[30],
                "training_provider_code": row[31],
                "training_provider_etqa_id": row[32],
                "learner_province": row[33],
                "learner_district_municipality": row[34],  # learner_municipality
                "learner_local_municipality": row[35],
                "residential_area": row[36],
                "area_type": row[37],
                "stats_area_code": row[38],
                "physical_address_line1": row[39],
                "physical_address_line2": row[40],
                "physical_address_code": row[41],
                "postal_address_line1": row[42],
                "postal_address_line2": row[43],
                "postal_code": row[44],
                "seta_industry_funded": format_boolean(row[45]),
                "amount_spent_per_learner": float(row[46]) if row[46] else None,
                "agreement_moa_number": row[47],
                "black_designated_groups": row[48],
                "black_females": row[49],
                "black_males": row[50],
                "coloured_females": row[51],
                "coloured_males": row[52],
                "indian_females": row[53],
                "indian_males": row[54],
                "white_females": row[55],
                "white_males": row[56],
                "disabled_females": row[57],
                "disabled_males": row[58],
                "youth_females": row[59],
                "youth_males": row[60],
                "non_rsa_citizen_females": row[61],
                "non_rsa_citizen_males": row[62],
                "project_number": row[63],
                "activity_number": row[64],
                "app_sub_programme": row[65],
                "parent_guardian_mobile": row[66],
                "parent_guardian_email": row[67],
                "non_nqf_intervention_subfield": row[68],
                "non_nqf_intervention_status": row[69],
                "non_nqf_intervention_credit": row[70],
                "unit_standard_id": row[71],
                "training_provider_postal_address": row[72],
                "training_provider_accreditation_start_date": format_date(row[73]),
                "training_provider_province_code": row[74],
                "training_provider_physical_address": row[75],
                "learnership_id": row[76],
                "last_school_emis": row[77],
                "last_school_year": row[78],
                "valid_id_number_length": format_boolean(row[79]),
                "valid_age_for_youth": format_boolean(row[80]),
                "correctly_reported_youth": format_boolean(row[81]),
                "correctly_reported_gender": format_boolean(row[82]),
                "correctly_reported_race": format_boolean(row[83]),
                "skills": row[84],
                "employment_status": row[85],
                "current_employer": row[86],
                "monthly_income": float(row[87]) if row[87] else None,
                "programme_outcome": row[88],
                "status": row[89],  # Main status field
                "age": row[90],  # New age field
                "beneficiary_status": row[91],  # New beneficiary_status field
                "id_document_url": row[92],
                "qualification_document_url": row[93],
                "notes": row[94],
                "validation_errors": row[95],
                "created_at": row[96].strftime("%Y-%m-%d %H:%M:%S") if row[96] else None,
                "updated_at": row[97].strftime("%Y-%m-%d %H:%M:%S") if row[97] else None
            })
        
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
        
        cur = conn.cursor()
        cur.execute("""
            SELECT b.id, b.learner_names, b.learner_surname, b.id_number, b.gender, 
                   b.age, b.mobile_phone, b.email_address, b.residential_area, 
                   b.learner_province, b.learner_district_municipality, b.disability, 
                   b.youth, b.non_rsa_citizen, b.race, b.status, b.beneficiary_status,
                   b.created_at, p.name as project_name
            FROM beneficiaries b
            LEFT JOIN projects p ON b.project_id = p.id
            ORDER BY b.created_at DESC;
        """)
        
        rows = cur.fetchall()
        beneficiaries = []
        for row in rows:
            beneficiaries.append({
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
                "disability": format_boolean(row[11]),
                "youth": format_boolean(row[12]),
                "non_rsa_citizen": format_boolean(row[13]),
                "race": row[14],
                "status": row[15],
                "beneficiary_status": row[16],
                "created_at": row[17].strftime("%Y-%m-%d %H:%M:%S") if row[17] else None,
                "project_name": row[18]
            })
        
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
        
        # Map frontend field names to database column names
        beneficiary_data = {
            "project_id": project_id,
            "learner_names": data.get('first_name', '').strip(),
            "learner_surname": data.get('last_name', '').strip(),
            "learner_initials": data.get('initials', '').strip(),
            "id_number": data.get('id_number', '').strip(),
            "date_of_birth": data.get('date_of_birth'),
            "gender": data.get('gender', '').strip(),
            "race": data.get('race', '').strip(),
            "youth": data.get('youth', False),
            "disability": data.get('disability', False),
            "disability_type": data.get('disability_type', '').strip(),
            "non_rsa_citizen": data.get('non_rsa_citizen', False),
            "home_language": data.get('home_language', '').strip(),
            "mobile_phone": data.get('mobile_phone', '').strip(),
            "email_address": data.get('email', '').strip(),
            "learner_province": data.get('learner_province', '').strip(),
            "learner_district_municipality": data.get('learner_municipality', '').strip(),
            "learner_local_municipality": data.get('learner_local_municipality', '').strip(),
            "residential_area": data.get('residential_area', '').strip(),
            "age": data.get('age'),  # New age field
            "beneficiary_status": data.get('beneficiary_status', 'Current'),  # New field with default
            "type_of_learning_programme": data.get('learning_programme_type', '').strip(),
            "programme_start_date": data.get('programme_start_date', datetime.now().date()),
            "programme_completion_date": data.get('programme_completion_date'),
            "certificate_issue_date": data.get('certificate_issue_date'),
            "ofo_code": data.get('ofo_code', '').strip(),
            "nqf_level": data.get('nqf_level'),
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
            "seta_industry_funded": data.get('seta_funded', False),
            "amount_spent_per_learner": data.get('amount_spent_per_learner', 0),
            "learnership_id": data.get('learnership_id', '').strip(),
            "agreement_moa_number": data.get('agreement_number', '').strip(),
            "non_nqf_intervention_subfield": data.get('non_nqf_subfield_id', '').strip(),
            "non_nqf_intervention_status": data.get('non_nqf_status_id', '').strip(),
            "non_nqf_intervention_credit": data.get('non_nqf_credit', '').strip(),
            "unit_standard_id": data.get('unit_standard_id', '').strip(),
            "last_school_emis": data.get('last_school_emis', '').strip(),
            "last_school_year": data.get('last_school_year'),
            "area_type": data.get('area_type', '').strip(),
            "physical_address_line1": data.get('physical_address_line1', '').strip(),
            "physical_address_line2": data.get('physical_address_line2', '').strip(),
            "postal_address_line1": data.get('postal_address_line1', '').strip(),
            "postal_address_line2": data.get('postal_address_line2', '').strip(),
            "postal_code": data.get('postal_code', '').strip(),
            "parent_guardian_mobile": data.get('parent_guardian_mobile', '').strip(),
            "parent_guardian_email": data.get('parent_guardian_email', '').strip(),
            "skills": data.get('skills', '').strip(),
            "employment_status": data.get('employment_status', '').strip(),
            "current_employer": data.get('current_employer', '').strip(),
            "monthly_income": data.get('monthly_income'),
            "programme_outcome": data.get('programme_outcome', '').strip(),
            "notes": data.get('notes', '').strip(),
            "status": data.get('status', 'Active')  # Main status field
        }
        
        # Validate required fields
        required_fields = ["learner_names", "learner_surname", "id_number"]
        missing_fields = []
        for field in required_fields:
            if not beneficiary_data[field]:
                missing_fields.append(field)
        
        if missing_fields:
            return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
        
        # Validate age if provided
        age = beneficiary_data["age"]
        if age is not None:
            try:
                age = int(age)
                if age < 0 or age > 120:
                    return jsonify({"error": "Age must be between 0 and 120"}), 400
                beneficiary_data["age"] = age
            except (ValueError, TypeError):
                return jsonify({"error": "Age must be a valid number"}), 400
        
        # Handle file uploads if present in form data
        if request.content_type and 'multipart/form-data' in request.content_type:
            # Handle ID document upload
            if 'id_document' in request.files:
                file = request.files['id_document']
                if file and file.filename != '' and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"id_doc_{timestamp}_{filename}"
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(filepath)
                    beneficiary_data["id_document_url"] = f"http://localhost:5050/uploads/{filename}"
            
            # Handle qualification document upload
            if 'qualification_document' in request.files:
                file = request.files['qualification_document']
                if file and file.filename != '' and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"qual_doc_{timestamp}_{filename}"
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(filepath)
                    beneficiary_data["qualification_document_url"] = f"http://localhost:5050/uploads/{filename}"
        
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
        
        try:
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
            conn.rollback()
            cur.close()
            conn.close()
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
            SELECT id, learner_names, learner_surname, learner_initials, id_number, 
                   date_of_birth, gender, race, youth, disability, disability_type,
                   non_rsa_citizen, home_language, mobile_phone, email_address,
                   type_of_learning_programme, programme_start_date, programme_completion_date,
                   certificate_issue_date, ofo_code, nqf_level, programme_description,
                   qualification_id, employer_name, employer_sdl_number, employer_contact_details,
                   training_provider_name, training_provider_sdl_number, training_provider_contact_details,
                   training_provider_type, training_provider_province, training_provider_code,
                   training_provider_etqa_id, learner_province, learner_district_municipality,
                   learner_local_municipality, residential_area, area_type, stats_area_code,
                   physical_address_line1, physical_address_line2, physical_address_code,
                   postal_address_line1, postal_address_line2, postal_code, seta_industry_funded,
                   amount_spent_per_learner, agreement_moa_number, black_designated_groups,
                   black_females, black_males, coloured_females, coloured_males, indian_females,
                   indian_males, white_females, white_males, disabled_females, disabled_males,
                   youth_females, youth_males, non_rsa_citizen_females, non_rsa_citizen_males,
                   project_number, activity_number, app_sub_programme, parent_guardian_mobile,
                   parent_guardian_email, non_nqf_intervention_subfield, non_nqf_intervention_status,
                   non_nqf_intervention_credit, unit_standard_id, training_provider_postal_address,
                   training_provider_accreditation_start_date, training_provider_province_code,
                   training_provider_physical_address, learnership_id, last_school_emis,
                   last_school_year, valid_id_number_length, valid_age_for_youth,
                   correctly_reported_youth, correctly_reported_gender, correctly_reported_race,
                   skills, employment_status, current_employer, monthly_income, programme_outcome,
                   status, age, beneficiary_status, id_document_url, qualification_document_url,
                   notes, validation_errors, created_at, updated_at, project_id
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
            "initials": row[3],
            "id_number": row[4],
            "date_of_birth": format_date(row[5]),
            "gender": row[6],
            "race": row[7],
            "youth": format_boolean(row[8]),
            "disability": format_boolean(row[9]),
            "disability_type": row[10],
            "non_rsa_citizen": format_boolean(row[11]),
            "home_language": row[12],
            "mobile_phone": row[13],
            "email": row[14],
            "learning_programme_type": row[15],
            "programme_start_date": format_date(row[16]),
            "programme_completion_date": format_date(row[17]),
            "certificate_issue_date": format_date(row[18]),
            "ofo_code": row[19],
            "nqf_level": row[20],
            "programme_description": row[21],
            "qualification_id": row[22],
            "employer_name": row[23],
            "employer_sdl_number": row[24],
            "employer_contact_details": row[25],
            "training_provider_name": row[26],
            "training_provider_sdl_number": row[27],
            "training_provider_contact_details": row[28],
            "training_provider_type": row[29],
            "training_provider_province": row[30],
            "training_provider_code": row[31],
            "training_provider_etqa_id": row[32],
            "learner_province": row[33],
            "learner_district_municipality": row[34],
            "learner_local_municipality": row[35],
            "residential_area": row[36],
            "area_type": row[37],
            "stats_area_code": row[38],
            "physical_address_line1": row[39],
            "physical_address_line2": row[40],
            "physical_address_code": row[41],
            "postal_address_line1": row[42],
            "postal_address_line2": row[43],
            "postal_code": row[44],
            "seta_industry_funded": format_boolean(row[45]),
            "amount_spent_per_learner": float(row[46]) if row[46] else None,
            "agreement_moa_number": row[47],
            "black_designated_groups": row[48],
            "black_females": row[49],
            "black_males": row[50],
            "coloured_females": row[51],
            "coloured_males": row[52],
            "indian_females": row[53],
            "indian_males": row[54],
            "white_females": row[55],
            "white_males": row[56],
            "disabled_females": row[57],
            "disabled_males": row[58],
            "youth_females": row[59],
            "youth_males": row[60],
            "non_rsa_citizen_females": row[61],
            "non_rsa_citizen_males": row[62],
            "project_number": row[63],
            "activity_number": row[64],
            "app_sub_programme": row[65],
            "parent_guardian_mobile": row[66],
            "parent_guardian_email": row[67],
            "non_nqf_intervention_subfield": row[68],
            "non_nqf_intervention_status": row[69],
            "non_nqf_intervention_credit": row[70],
            "unit_standard_id": row[71],
            "training_provider_postal_address": row[72],
            "training_provider_accreditation_start_date": format_date(row[73]),
            "training_provider_province_code": row[74],
            "training_provider_physical_address": row[75],
            "learnership_id": row[76],
            "last_school_emis": row[77],
            "last_school_year": row[78],
            "valid_id_number_length": format_boolean(row[79]),
            "valid_age_for_youth": format_boolean(row[80]),
            "correctly_reported_youth": format_boolean(row[81]),
            "correctly_reported_gender": format_boolean(row[82]),
            "correctly_reported_race": format_boolean(row[83]),
            "skills": row[84],
            "employment_status": row[85],
            "current_employer": row[86],
            "monthly_income": float(row[87]) if row[87] else None,
            "programme_outcome": row[88],
            "status": row[89],
            "age": row[90],  # New age field
            "beneficiary_status": row[91],  # New beneficiary_status field
            "id_document_url": row[92],
            "qualification_document_url": row[93],
            "notes": row[94],
            "validation_errors": row[95],
            "created_at": row[96].strftime("%Y-%m-%d %H:%M:%S") if row[96] else None,
            "updated_at": row[97].strftime("%Y-%m-%d %H:%M:%S") if row[97] else None,
            "project_id": row[98]
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
        # Check if request has form data
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form
            # Handle file uploads
            file_data = {}
            if 'id_document' in request.files:
                file = request.files['id_document']
                if file and file.filename != '' and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"id_doc_{timestamp}_{filename}"
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(filepath)
                    file_data["id_document_url"] = f"http://localhost:5050/uploads/{filename}"
            
            if 'qualification_document' in request.files:
                file = request.files['qualification_document']
                if file and file.filename != '' and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"qual_doc_{timestamp}_{filename}"
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(filepath)
                    file_data["qualification_document_url"] = f"http://localhost:5050/uploads/{filename}"
        else:
            data = request.json
            file_data = {}
        
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
            "learner_initials": data.get('initials'),
            "id_number": data.get('id_number'),
            "date_of_birth": data.get('date_of_birth'),
            "gender": data.get('gender'),
            "age": data.get('age'),  # New age field
            "beneficiary_status": data.get('beneficiary_status'),  # New beneficiary_status field
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
            "status": data.get('status'),  # Main status field
            "updated_at": datetime.now()
        }
        
        # Add file data
        update_data.update(file_data)
        
        # Validate age if provided
        if update_data.get("age") is not None:
            try:
                age = int(update_data["age"])
                if age < 0 or age > 120:
                    return jsonify({"error": "Age must be between 0 and 120"}), 400
                update_data["age"] = age
            except (ValueError, TypeError):
                return jsonify({"error": "Age must be a valid number"}), 400
        
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
            # Handle boolean conversion
            if field in ['youth', 'disability', 'non_rsa_citizen', 'seta_industry_funded']:
                if isinstance(value, str):
                    value = value.lower() in ['true', 'yes', '1', 't']
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
        
        cur = conn.cursor()
        
        # Get total beneficiaries
        cur.execute("SELECT COUNT(*) FROM beneficiaries")
        total_beneficiaries = cur.fetchone()[0]
        
        # Get beneficiaries by gender
        cur.execute("""
            SELECT gender, COUNT(*) 
            FROM beneficiaries 
            WHERE gender IS NOT NULL 
            GROUP BY gender
        """)
        gender_stats = {row[0]: row[1] for row in cur.fetchall()}
        
        # Get beneficiaries by race
        cur.execute("""
            SELECT race, COUNT(*) 
            FROM beneficiaries 
            WHERE race IS NOT NULL 
            GROUP BY race
        """)
        race_stats = {row[0]: row[1] for row in cur.fetchall()}
        
        # Get beneficiaries by status
        cur.execute("""
            SELECT beneficiary_status, COUNT(*) 
            FROM beneficiaries 
            WHERE beneficiary_status IS NOT NULL 
            GROUP BY beneficiary_status
        """)
        status_stats = {row[0]: row[1] for row in cur.fetchall()}
        
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
                COUNT(*)
            FROM beneficiaries 
            WHERE age IS NOT NULL
            GROUP BY 1
        """)
        age_stats = {row[0]: row[1] for row in cur.fetchall()}
        
        # Get beneficiaries by province
        cur.execute("""
            SELECT learner_province, COUNT(*) 
            FROM beneficiaries 
            WHERE learner_province IS NOT NULL 
            GROUP BY learner_province
        """)
        province_stats = {row[0]: row[1] for row in cur.fetchall()}
        
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
        
        cur = conn.cursor()
        
        # Build query dynamically
        query = """
            SELECT b.id, b.learner_names, b.learner_surname, b.id_number, b.gender, 
                   b.age, b.mobile_phone, b.email_address, b.residential_area, 
                   b.learner_province, b.learner_district_municipality, b.disability, 
                   b.youth, b.non_rsa_citizen, b.race, b.status, b.beneficiary_status,
                   b.created_at, p.name as project_name
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
            beneficiaries.append({
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
                "disability": format_boolean(row[11]),
                "youth": format_boolean(row[12]),
                "non_rsa_citizen": format_boolean(row[13]),
                "race": row[14],
                "status": row[15],
                "beneficiary_status": row[16],
                "created_at": row[17].strftime("%Y-%m-%d %H:%M:%S") if row[17] else None,
                "project_name": row[18]
            })
        
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
        
        cur = conn.cursor()
        
        # Get total projects
        cur.execute("SELECT COUNT(*) FROM projects")
        total_projects = cur.fetchone()[0]
        
        # Get project types
        cur.execute("SELECT project_type, COUNT(*) FROM projects GROUP BY project_type")
        type_data = {row[0]: row[1] for row in cur.fetchall()}
        
        # Get status
        cur.execute("SELECT status, COUNT(*) FROM projects GROUP BY status")
        status_data = {row[0]: row[1] for row in cur.fetchall()}
        
        # Get funders
        cur.execute("SELECT COALESCE(funder, 'No Funder'), COUNT(*) FROM projects GROUP BY funder")
        funder_data = {row[0]: row[1] for row in cur.fetchall()}
        
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