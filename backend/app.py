from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from db import get_db_connection
import os
from datetime import datetime

app = Flask(__name__)

# SIMPLIFIED CORS CONFIG - Remove duplicate headers
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ===================== PROJECTS ROUTES ===================== #

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
            "image": r[7] if len(r) > 7 else None
        }
        for r in rows
    ]
    return jsonify(projects)

@app.route('/projects', methods=['POST'])
def add_project():
    project_name = request.form.get('project_name')
    description = request.form.get('description')
    start_date = request.form.get('start_date')
    end_date = request.form.get('end_date')
    participants = int(request.form.get('participants', 0))

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

    image_file = request.files.get('image')
    image_filename = None
    if image_file:
        image_filename = image_file.filename
        image_file.save(os.path.join(app.config['UPLOAD_FOLDER'], image_filename))

    conn = get_db_connection()
    cur = conn.cursor()

    if image_filename:
        cur.execute(
            '''
            UPDATE projects 
            SET project_name=%s, description=%s, start_date=%s, end_date=%s, participants=%s, image=%s
            WHERE id=%s;
            ''',
            (project_name, description, start_date, end_date, participants, image_filename, id)
        )
    else:
        cur.execute(
            '''
            UPDATE projects 
            SET project_name=%s, description=%s, start_date=%s, end_date=%s, participants=%s
            WHERE id=%s;
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
    cur.execute('DELETE FROM projects WHERE id=%s;', (id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "Project deleted successfully 🗑️"})

# ===================== BENEFICIARIES ROUTES ===================== #

@app.route('/beneficiaries', methods=['GET'])
def get_beneficiaries():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM beneficiaries ORDER BY id;')
    rows = cur.fetchall()
    cur.close()
    conn.close()

    beneficiaries = [
        {
            "id": r[0],
            "learner_first_name": r[1],
            "learner_surname": r[2],
            "learner_initials": r[3],
            "learner_id_number": r[5],
            "learning_programme_type": r[6],
            "programme_start_date": r[7],
            "programme_completion_date": r[8],
            "programme_description": r[12],
            "employer_name": r[13],
            "training_provider_name": r[16],
            "learner_email": r[32],
            "learner_contact_number": r[31]
        }
        for r in rows
    ]
    return jsonify(beneficiaries)

@app.route('/beneficiaries/<project_id>', methods=['GET'])
def get_beneficiaries_by_project(project_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT * FROM beneficiaries WHERE project_enrolled=%s ORDER BY id;', (project_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()

        beneficiaries = [
            {
                "id": r[0],
                "learner_first_name": r[1],
                "learner_surname": r[2],
                "learner_initials": r[3],
                "learner_id_number": r[5],
                "learning_programme_type": r[6],
                "programme_start_date": r[7],
                "programme_completion_date": r[8],
                "programme_description": r[12],
                "employer_name": r[13],
                "training_provider_name": r[16],
                "learner_email": r[32],
                "learner_contact_number": r[31]
            }
            for r in rows
        ]
        return jsonify(beneficiaries)
    except Exception as e:
        print(f"Error fetching beneficiaries: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/beneficiaries', methods=['POST'])
def add_beneficiary():
    try:
        # Get data from form data
        data = request.form.to_dict()
        
        print("Received data for new beneficiary:", data)
        
        project_id = data.get('project_id')

        if not project_id:
            return jsonify({"error": "Project ID is required"}), 400

        # Helper to format dates
        def format_date(date_str):
            if not date_str:
                return None
            try:
                # Handle HTML5 date input format (YYYY-MM-DD)
                if 'T' in date_str:
                    date_str = date_str.split('T')[0]
                for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%m-%d-%Y', '%d-%m-%Y'):
                    try:
                        return datetime.strptime(date_str, fmt).strftime('%Y-%m-%d')
                    except ValueError:
                        continue
                return date_str  # Return as-is if no format matches
            except:
                return None

        programme_start = format_date(data.get('programme_start_date'))
        programme_completion = format_date(data.get('programme_completion_date'))

        conn = get_db_connection()
        cur = conn.cursor()
        
        # Use the EXACT column names from your database table
        cur.execute(
            '''
            INSERT INTO beneficiaries (
                learner_first_name, learner_surname, learner_initials, learner_title,
                learner_id_number, learning_programme_type, programme_start_date, 
                programme_completion_date, programme_description, employer_name,
                learner_contact_number, learner_email, project_enrolled
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
            ''',
            (
                data.get('learner_first_name', ''), 
                data.get('learner_surname', ''), 
                data.get('learner_initials', ''),
                data.get('learner_title', 'Mr'),  # Default value
                data.get('learner_id_number', ''), 
                data.get('learning_programme_type', ''),
                programme_start,
                programme_completion,
                data.get('programme_description', ''),
                data.get('employer_name', ''),
                data.get('learner_contact_number', ''), 
                data.get('learner_email', ''),
                project_id  # project_enrolled
            )
        )
        beneficiary_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "message": "Beneficiary added successfully 🎉", 
            "id": beneficiary_id
        }), 201

    except Exception as e:
        print(f"Error adding beneficiary: {str(e)}")
        return jsonify({"error": f"Failed to add beneficiary: {str(e)}"}), 500

@app.route('/beneficiaries/<int:beneficiary_id>', methods=['PUT'])
def update_beneficiary(beneficiary_id):
    try:
        # Get data from form data
        data = request.form.to_dict()
        
        print(f"=== UPDATE BENEFICIARY {beneficiary_id} ===")
        print(f"Received data: {data}")
        print(f"Beneficiary ID: {beneficiary_id}")

        # Improved date formatting function
        def format_date(date_str):
            if not date_str:
                return None
            try:
                # Remove any timezone or time information first
                date_str = str(date_str).split('T')[0].split(' ')[0]
                
                # Try different date formats
                for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%m-%d-%Y', '%d-%m-%Y', '%Y/%m/%d'):
                    try:
                        parsed_date = datetime.strptime(date_str, fmt)
                        return parsed_date.strftime('%Y-%m-%d')
                    except ValueError:
                        continue
                
                # If none of the formats work, try parsing with dateutil or return None
                print(f"Warning: Could not parse date: {date_str}")
                return None
            except Exception as e:
                print(f"Error parsing date {date_str}: {str(e)}")
                return None

        programme_start = format_date(data.get('programme_start_date'))
        programme_completion = format_date(data.get('programme_completion_date'))

        print(f"Formatted dates - Start: {programme_start}, Completion: {programme_completion}")

        conn = get_db_connection()
        cur = conn.cursor()
        
        # First check if beneficiary exists
        print(f"Checking if beneficiary {beneficiary_id} exists...")
        cur.execute('SELECT id FROM beneficiaries WHERE id = %s;', (beneficiary_id,))
        beneficiary = cur.fetchone()
        
        if not beneficiary:
            print(f"Beneficiary {beneficiary_id} not found!")
            return jsonify({"error": "Beneficiary not found"}), 404
        
        print(f"Beneficiary {beneficiary_id} found, proceeding with update...")
        
        # Update the beneficiary
        cur.execute(
            '''
            UPDATE beneficiaries SET
                learner_first_name = %s,
                learner_surname = %s,
                learner_initials = %s,
                learner_id_number = %s,
                learning_programme_type = %s,
                programme_start_date = %s,
                programme_completion_date = %s,
                programme_description = %s,
                employer_name = %s,
                learner_contact_number = %s,
                learner_email = %s
            WHERE id = %s;
            ''',
            (
                data.get('learner_first_name', ''), 
                data.get('learner_surname', ''), 
                data.get('learner_initials', ''),
                data.get('learner_id_number', ''), 
                data.get('learning_programme_type', ''),
                programme_start,
                programme_completion,
                data.get('programme_description', ''),
                data.get('employer_name', ''),
                data.get('learner_contact_number', ''), 
                data.get('learner_email', ''),
                beneficiary_id
            )
        )
        
        conn.commit()
        cur.close()
        conn.close()

        print(f"Beneficiary {beneficiary_id} updated successfully!")
        return jsonify({
            "message": "Beneficiary updated successfully ✅", 
            "id": beneficiary_id
        }), 200

    except Exception as e:
        print(f"Error updating beneficiary: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({"error": f"Failed to update beneficiary: {str(e)}"}), 500
@app.route('/beneficiaries/<int:beneficiary_id>', methods=['DELETE'])
def delete_beneficiary(beneficiary_id):
    try:
        print(f"=== DELETE BENEFICIARY {beneficiary_id} ===")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # First check if beneficiary exists
        print(f"Checking if beneficiary {beneficiary_id} exists...")
        cur.execute('SELECT id FROM beneficiaries WHERE id = %s;', (beneficiary_id,))
        beneficiary = cur.fetchone()
        
        if not beneficiary:
            print(f"Beneficiary {beneficiary_id} not found!")
            return jsonify({"error": "Beneficiary not found"}), 404
        
        print(f"Beneficiary {beneficiary_id} found, proceeding with deletion...")
        
        # Delete the beneficiary
        cur.execute('DELETE FROM beneficiaries WHERE id = %s;', (beneficiary_id,))
        conn.commit()
        cur.close()
        conn.close()

        print(f"Beneficiary {beneficiary_id} deleted successfully!")
        return jsonify({"message": "Beneficiary deleted successfully 🗑️"}), 200

    except Exception as e:
        print(f"Error deleting beneficiary: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({"error": f"Failed to delete beneficiary: {str(e)}"}), 500

# ===================== SERVE UPLOADED FILES ===================== #

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ===================== RUN APP ===================== #

if __name__ == '__main__':
    app.run(debug=True, port=5050)