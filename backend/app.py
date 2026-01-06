from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from db import get_db_connection
import os
from datetime import datetime

app = Flask(__name__)

# CORS Configuration - allow all origins for development
CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# ===================== DEBUG & INFO ENDPOINTS ===================== #

@app.route('/debug', methods=['GET'])
def debug_info():
    """Debug endpoint to see database structure"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get all tables
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        tables = [row[0] for row in cur.fetchall()]
        
        result = {"tables": {}}
        for table in tables:
            # Get columns for each table
            cur.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s
                ORDER BY ordinal_position;
            """, (table,))
            
            columns = []
            for row in cur.fetchall():
                columns.append({
                    "name": row[0],
                    "type": row[1],
                    "nullable": row[2]
                })
            
            # Get row count
            cur.execute(f"SELECT COUNT(*) FROM {table};")
            row_count = cur.fetchone()[0]
            
            result["tables"][table] = {
                "columns": columns,
                "row_count": row_count
            }
        
        cur.close()
        conn.close()
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/test-connection', methods=['GET'])
def test_connection():
    """Test database connection"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT 1;')
        result = cur.fetchone()
        cur.close()
        conn.close()
        return jsonify({
            "status": "success",
            "message": "Database connection successful",
            "test_result": result[0]
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Database connection failed: {str(e)}"
        }), 500

# ===================== PROJECTS ROUTES ===================== #

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """Get all projects"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # First, let's find out what columns exist
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'projects' 
            ORDER BY ordinal_position;
        """)
        columns = [row[0] for row in cur.fetchall()]
        print(f"📋 Projects table columns: {columns}")
        
        # Build column list for SELECT
        if 'title' in columns:
            select_cols = 'id, title as project_name, description, start_date, end_date, participants, accreditors'
        elif 'project_name' in columns:
            select_cols = 'id, project_name, description, start_date, end_date, participants, accreditors'
        else:
            # If we're not sure, use *
            select_cols = '*'
        
        query = f'SELECT {select_cols} FROM projects ORDER BY id;'
        print(f"🔍 Executing query: {query}")
        
        cur.execute(query)
        rows = cur.fetchall()
        
        # Get column names from the result
        col_names = [desc[0] for desc in cur.description]
        print(f"📊 Result columns: {col_names}")
        
        cur.close()
        conn.close()

        projects = []
        for row in rows:
            project = {}
            for i, col_name in enumerate(col_names):
                value = row[i]
                
                # Format dates for JSON
                if isinstance(value, datetime):
                    value = value.strftime('%Y-%m-%d %H:%M:%S')
                elif isinstance(value, datetime.date):
                    value = value.strftime('%Y-%m-%d')
                
                project[col_name] = value
            
            projects.append(project)
        
        print(f"✅ Found {len(projects)} projects")
        return jsonify(projects)
        
    except Exception as e:
        print(f"❌ Error fetching projects: {str(e)}")
        return jsonify({"error": f"Failed to fetch projects: {str(e)}"}), 500

@app.route('/api/projects', methods=['POST'])
def create_project():
    """Create a new project"""
    try:
        # Get data from request
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        print(f"📝 Creating project with data: {data}")
        
        # Required fields
        required_fields = ['project_name', 'description', 'start_date', 'end_date']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check what column name is used for project name
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'projects' 
            AND column_name IN ('title', 'project_name', 'name');
        """)
        name_columns = [row[0] for row in cur.fetchall()]
        
        if not name_columns:
            return jsonify({"error": "Could not find project name column in database"}), 500
        
        name_column = name_columns[0]  # Use the first matching column
        
        # Insert project
        cur.execute(f"""
            INSERT INTO projects ({name_column}, description, start_date, end_date, participants, accreditors)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            data['project_name'],
            data['description'],
            data['start_date'],
            data['end_date'],
            data.get('participants', 0),
            data.get('accreditors', '')
        ))
        
        project_id = cur.fetchone()[0]
        conn.commit()
        
        cur.close()
        conn.close()
        
        print(f"✅ Project created with ID: {project_id}")
        return jsonify({
            "message": "Project created successfully",
            "id": project_id,
            "project_name": data['project_name']
        }), 201
        
    except Exception as e:
        print(f"❌ Error creating project: {str(e)}")
        return jsonify({"error": f"Failed to create project: {str(e)}"}), 500

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    """Update a project"""
    try:
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check what column name is used for project name
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'projects' 
            AND column_name IN ('title', 'project_name', 'name');
        """)
        name_columns = [row[0] for row in cur.fetchall()]
        
        if not name_columns:
            return jsonify({"error": "Could not find project name column in database"}), 500
        
        name_column = name_columns[0]
        
        # Update project
        cur.execute(f"""
            UPDATE projects 
            SET {name_column} = %s, 
                description = %s, 
                start_date = %s, 
                end_date = %s, 
                participants = %s, 
                accreditors = %s
            WHERE id = %s;
        """, (
            data.get('project_name'),
            data.get('description'),
            data.get('start_date'),
            data.get('end_date'),
            data.get('participants', 0),
            data.get('accreditors', ''),
            project_id
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            "message": "Project updated successfully",
            "id": project_id
        })
        
    except Exception as e:
        print(f"❌ Error updating project: {str(e)}")
        return jsonify({"error": f"Failed to update project: {str(e)}"}), 500

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    """Delete a project"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if project exists
        cur.execute('SELECT id FROM projects WHERE id = %s;', (project_id,))
        if not cur.fetchone():
            return jsonify({"error": "Project not found"}), 404
        
        # Delete project
        cur.execute('DELETE FROM projects WHERE id = %s;', (project_id,))
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({
            "message": "Project deleted successfully",
            "id": project_id
        })
        
    except Exception as e:
        print(f"❌ Error deleting project: {str(e)}")
        return jsonify({"error": f"Failed to delete project: {str(e)}"}), 500

# ===================== BENEFICIARIES ROUTES ===================== #

@app.route('/api/beneficiaries', methods=['GET'])
def get_beneficiaries():
    """Get all beneficiaries"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Find out beneficiary name columns
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'beneficiaries' 
            AND column_name IN ('first_name', 'learner_first_name', 'name');
        """)
        first_name_cols = [row[0] for row in cur.fetchall()]
        first_name_col = first_name_cols[0] if first_name_cols else 'first_name'
        
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'beneficiaries' 
            AND column_name IN ('last_name', 'learner_surname', 'surname');
        """)
        last_name_cols = [row[0] for row in cur.fetchall()]
        last_name_col = last_name_cols[0] if last_name_cols else 'last_name'
        
        # Build query with JOIN to get project name
        query = f"""
            SELECT 
                b.id,
                b.project_id,
                b.{first_name_col} as first_name,
                b.{last_name_col} as last_name,
                b.initials,
                b.title,
                b.id_number,
                b.mobile_phone,
                b.email,
                b.learning_programme_type,
                b.date_entered,
                b.date_completed,
                b.qualification_description,
                b.employer_name,
                b.training_provider_name,
                b.created_at,
                COALESCE(p.project_name, p.title) as project_name
            FROM beneficiaries b
            LEFT JOIN projects p ON b.project_id = p.id
            ORDER BY b.id;
        """
        
        print(f"🔍 Executing beneficiaries query: {query}")
        cur.execute(query)
        rows = cur.fetchall()
        
        beneficiaries = []
        for row in rows:
            beneficiary = {
                "id": row[0],
                "project_id": row[1],
                "first_name": row[2],
                "last_name": row[3],
                "initials": row[4],
                "title": row[5],
                "id_number": row[6],
                "mobile_phone": row[7],
                "email": row[8],
                "learning_programme_type": row[9],
                "date_entered": row[10].strftime('%Y-%m-%d') if row[10] else None,
                "date_completed": row[11].strftime('%Y-%m-%d') if row[11] else None,
                "qualification_description": row[12],
                "employer_name": row[13],
                "training_provider_name": row[14],
                "created_at": row[15].strftime('%Y-%m-%d %H:%M:%S') if row[15] else None,
                "project_name": row[16]
            }
            beneficiaries.append(beneficiary)
        
        cur.close()
        conn.close()
        
        print(f"✅ Found {len(beneficiaries)} beneficiaries")
        return jsonify(beneficiaries)
        
    except Exception as e:
        print(f"❌ Error fetching beneficiaries: {str(e)}")
        return jsonify({"error": f"Failed to fetch beneficiaries: {str(e)}"}), 500

@app.route('/api/beneficiaries/project/<int:project_id>', methods=['GET'])
def get_beneficiaries_by_project(project_id):
    """Get beneficiaries by project ID"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Find out beneficiary name columns
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'beneficiaries' 
            AND column_name IN ('first_name', 'learner_first_name', 'name');
        """)
        first_name_cols = [row[0] for row in cur.fetchall()]
        first_name_col = first_name_cols[0] if first_name_cols else 'first_name'
        
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'beneficiaries' 
            AND column_name IN ('last_name', 'learner_surname', 'surname');
        """)
        last_name_cols = [row[0] for row in cur.fetchall()]
        last_name_col = last_name_cols[0] if last_name_cols else 'last_name'
        
        query = f"""
            SELECT 
                b.id,
                b.{first_name_col} as first_name,
                b.{last_name_col} as last_name,
                b.initials,
                b.title,
                b.id_number,
                b.mobile_phone,
                b.email,
                b.learning_programme_type,
                b.date_entered,
                b.date_completed,
                b.qualification_description,
                b.employer_name,
                b.training_provider_name,
                b.created_at
            FROM beneficiaries b
            WHERE b.project_id = %s
            ORDER BY b.id;
        """
        
        cur.execute(query, (project_id,))
        rows = cur.fetchall()
        
        beneficiaries = []
        for row in rows:
            beneficiary = {
                "id": row[0],
                "first_name": row[1],
                "last_name": row[2],
                "initials": row[3],
                "title": row[4],
                "id_number": row[5],
                "mobile_phone": row[6],
                "email": row[7],
                "learning_programme_type": row[8],
                "date_entered": row[9].strftime('%Y-%m-%d') if row[9] else None,
                "date_completed": row[10].strftime('%Y-%m-%d') if row[10] else None,
                "qualification_description": row[11],
                "employer_name": row[12],
                "training_provider_name": row[13],
                "created_at": row[14].strftime('%Y-%m-%d %H:%M:%S') if row[14] else None
            }
            beneficiaries.append(beneficiary)
        
        cur.close()
        conn.close()
        
        return jsonify(beneficiaries)
        
    except Exception as e:
        print(f"❌ Error fetching beneficiaries by project: {str(e)}")
        return jsonify({"error": f"Failed to fetch beneficiaries: {str(e)}"}), 500

@app.route('/api/beneficiaries', methods=['POST'])
def create_beneficiary():
    """Create a new beneficiary"""
    try:
        # Get data from request
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        print(f"📝 Creating beneficiary with data: {data}")
        
        # Required fields
        required_fields = ['project_id', 'first_name', 'last_name', 'id_number']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Find actual column names
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'beneficiaries';
        """)
        all_columns = [row[0] for row in cur.fetchall()]
        print(f"📋 Available beneficiary columns: {all_columns}")
        
        # Map data fields to actual column names
        column_mapping = {
            'first_name': 'first_name' if 'first_name' in all_columns else 'learner_first_name',
            'last_name': 'last_name' if 'last_name' in all_columns else 'learner_surname',
            'mobile_phone': 'mobile_phone' if 'mobile_phone' in all_columns else 'learner_contact_number'
        }
        
        # Prepare insert
        columns = ['project_id']
        values = [data['project_id']]
        placeholders = ['%s']
        
        # Add mapped fields
        for field in ['first_name', 'last_name', 'initials', 'title', 'id_number', 
                     'mobile_phone', 'email', 'learning_programme_type', 
                     'date_entered', 'date_completed', 'qualification_description',
                     'employer_name', 'training_provider_name']:
            
            actual_col = column_mapping.get(field, field)
            if actual_col in all_columns and data.get(field):
                columns.append(actual_col)
                values.append(data[field])
                placeholders.append('%s')
        
        # Add created_at if column exists
        if 'created_at' in all_columns:
            columns.append('created_at')
            values.append('NOW()')
            placeholders.append('NOW()')
        
        query = f"""
            INSERT INTO beneficiaries ({', '.join(columns)})
            VALUES ({', '.join(placeholders)})
            RETURNING id;
        """
        
        print(f"🔍 Executing query: {query}")
        print(f"📊 With values: {values}")
        
        # Filter out NOW() from values for parameterized query
        param_values = [v for v, p in zip(values, placeholders) if p == '%s']
        
        cur.execute(query, param_values)
        beneficiary_id = cur.fetchone()[0]
        conn.commit()
        
        cur.close()
        conn.close()
        
        print(f"✅ Beneficiary created with ID: {beneficiary_id}")
        return jsonify({
            "message": "Beneficiary created successfully",
            "id": beneficiary_id
        }), 201
        
    except Exception as e:
        print(f"❌ Error creating beneficiary: {str(e)}")
        return jsonify({"error": f"Failed to create beneficiary: {str(e)}"}), 500

@app.route('/api/beneficiaries/<int:beneficiary_id>', methods=['PUT'])
def update_beneficiary(beneficiary_id):
    """Update a beneficiary"""
    try:
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if beneficiary exists
        cur.execute('SELECT id FROM beneficiaries WHERE id = %s;', (beneficiary_id,))
        if not cur.fetchone():
            return jsonify({"error": "Beneficiary not found"}), 404
        
        # Find actual column names
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'beneficiaries';
        """)
        all_columns = [row[0] for row in cur.fetchall()]
        
        # Build update query
        updates = []
        values = []
        
        # Map fields to update
        fields_to_update = {
            'first_name': 'first_name' if 'first_name' in all_columns else 'learner_first_name',
            'last_name': 'last_name' if 'last_name' in all_columns else 'learner_surname',
            'project_id': 'project_id',
            'initials': 'initials',
            'title': 'title',
            'id_number': 'id_number',
            'mobile_phone': 'mobile_phone' if 'mobile_phone' in all_columns else 'learner_contact_number',
            'email': 'email',
            'learning_programme_type': 'learning_programme_type',
            'date_entered': 'date_entered',
            'date_completed': 'date_completed',
            'qualification_description': 'qualification_description',
            'employer_name': 'employer_name',
            'training_provider_name': 'training_provider_name'
        }
        
        for field, column in fields_to_update.items():
            if column in all_columns and field in data:
                updates.append(f"{column} = %s")
                values.append(data[field])
        
        values.append(beneficiary_id)
        
        query = f"UPDATE beneficiaries SET {', '.join(updates)} WHERE id = %s;"
        
        cur.execute(query, values)
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({
            "message": "Beneficiary updated successfully",
            "id": beneficiary_id
        })
        
    except Exception as e:
        print(f"❌ Error updating beneficiary: {str(e)}")
        return jsonify({"error": f"Failed to update beneficiary: {str(e)}"}), 500

@app.route('/api/beneficiaries/<int:beneficiary_id>', methods=['DELETE'])
def delete_beneficiary(beneficiary_id):
    """Delete a beneficiary"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if beneficiary exists
        cur.execute('SELECT id FROM beneficiaries WHERE id = %s;', (beneficiary_id,))
        if not cur.fetchone():
            return jsonify({"error": "Beneficiary not found"}), 404
        
        # Delete beneficiary
        cur.execute('DELETE FROM beneficiaries WHERE id = %s;', (beneficiary_id,))
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({
            "message": "Beneficiary deleted successfully",
            "id": beneficiary_id
        })
        
    except Exception as e:
        print(f"❌ Error deleting beneficiary: {str(e)}")
        return jsonify({"error": f"Failed to delete beneficiary: {str(e)}"}), 500

# ===================== FILE UPLOADS ===================== #

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ===================== ROOT & HEALTH ===================== #

@app.route('/')
def home():
    return jsonify({
        "message": "Beneficiary Management System API",
        "version": "1.0",
        "endpoints": {
            "debug": "/debug",
            "test": "/test-connection",
            "projects": "/api/projects",
            "beneficiaries": "/api/beneficiaries",
            "beneficiaries_by_project": "/api/beneficiaries/project/<project_id>"
        }
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    })

# ===================== ERROR HANDLERS ===================== #

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

# ===================== RUN APP ===================== #

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Starting Beneficiary Management System API")
    print("📡 Server running on: http://localhost:5050")
    print("📊 Debug info: http://localhost:5050/debug")
    print("🩺 Health check: http://localhost:5050/health")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5050)