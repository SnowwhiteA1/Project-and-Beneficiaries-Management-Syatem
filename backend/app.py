from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from db import get_db_connection
import os
from datetime import datetime
import uuid  # For unique file names

app = Flask(__name__)

# SIMPLIFIED CORS CONFIG
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
    beneficiaries = [
        {desc[0]: val for desc, val in zip(cur.description, r)}
        for r in rows
    ]
    cur.close()
    conn.close()
    return jsonify(beneficiaries)

# ADD THIS MISSING ENDPOINT - FIXES THE 404 ERROR
@app.route('/beneficiaries/<project_id>', methods=['GET'])
def get_beneficiaries_by_project(project_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT * FROM beneficiaries WHERE project_enrolled=%s ORDER BY id;', (project_id,))
        rows = cur.fetchall()
        beneficiaries = [
            {desc[0]: val for desc, val in zip(cur.description, r)}
            for r in rows
        ]
        cur.close()
        conn.close()
        return jsonify(beneficiaries)
    except Exception as e:
        print(f"Error fetching beneficiaries by project: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/beneficiaries', methods=['POST'])
def add_beneficiary():
    try:
        data = request.form.to_dict()
        project_id = data.get('project_enrolled')
        if not project_id:
            return jsonify({"error": "Project ID is required"}), 400

        # ------------------ Handle file upload ------------------ #
        uploaded_file = request.files.get('file')  # Optional file
        file_filename = None
        if uploaded_file:
            ext = os.path.splitext(uploaded_file.filename)[1]
            file_filename = f"{uuid.uuid4().hex}{ext}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_filename)
            uploaded_file.save(file_path)

        def format_date(date_str):
            if not date_str:
                return None
            try:
                if 'T' in date_str:
                    date_str = date_str.split('T')[0]
                for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%m-%d-%Y', '%d-%m-%Y'):
                    try:
                        return datetime.strptime(date_str, fmt).strftime('%Y-%m-%d')
                    except ValueError:
                        continue
                return date_str
            except:
                return None

        # Format date fields
        programme_start = format_date(data.get('programme_start_date'))
        programme_completion = format_date(data.get('programme_completion_date'))
        certificate_issue = format_date(data.get('certificate_issue_date'))
        accreditation_start = format_date(data.get('training_provider_accreditation_start_date'))

        # Handle numeric fields
        def format_numeric(value):
            if not value:
                return None
            try:
                return float(value)
            except:
                return None

        amount_spent = format_numeric(data.get('amount_spent_per_learner'))
        intervention_credit = format_numeric(data.get('non_nqf_intervention_credit'))

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            '''
            INSERT INTO beneficiaries (
                learner_first_name, learner_surname, learner_initials, learner_title,
                learner_id_number, learning_programme_type, programme_start_date, 
                programme_completion_date, certificate_issue_date, ofo_code,
                nqf_level, programme_description, employer_name, employer_sdl_number,
                employer_contact_details, training_provider_name, training_provider_sdl_number,
                training_provider_contact_details, training_provider_type, training_provider_province,
                learner_province, learner_local_district, learner_residential_area, learner_area_type,
                learner_physical_address_code, programme_funding_type, amount_spent_per_learner,
                key_dev_transformation, project_number, activity_number, app_sub_programme,
                learner_contact_number, learner_email, learner_parent_contact, non_nqf_intervention_subfield_id,
                non_nqf_intervention_status_id, non_nqf_intervention_credit, unit_standard_id,
                training_provider_code, training_provider_etqa_id, training_provider_postal_address,
                training_provider_accreditation_start_date, training_provider_province_code,
                training_provider_physical_address, learner_home_language, agreement_number,
                learner_last_school_emis, learner_last_school_year, learner_stats_area_code,
                additional_documents, project_enrolled, uploaded_file
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            RETURNING id;
            ''',
            (
                data.get('learner_first_name', ''), 
                data.get('learner_surname', ''), 
                data.get('learner_initials', ''),
                data.get('learner_title', ''),
                data.get('learner_id_number', ''), 
                data.get('learning_programme_type', ''),
                programme_start,
                programme_completion,
                certificate_issue,
                data.get('ofo_code', ''),
                data.get('nqf_level', ''),
                data.get('programme_description', ''),
                data.get('employer_name', ''),
                data.get('employer_sdl_number', ''),
                data.get('employer_contact_details', ''),
                data.get('training_provider_name', ''),
                data.get('training_provider_sdl_number', ''),
                data.get('training_provider_contact_details', ''),
                data.get('training_provider_type', ''),
                data.get('training_provider_province', ''),
                data.get('learner_province', ''),
                data.get('learner_local_district', ''),
                data.get('learner_residential_area', ''),
                data.get('learner_area_type', ''),
                data.get('learner_physical_address_code', ''),
                data.get('programme_funding_type', ''),
                amount_spent,
                data.get('key_dev_transformation', ''),
                data.get('project_number', ''),
                data.get('activity_number', ''),
                data.get('app_sub_programme', ''),
                data.get('learner_contact_number', ''), 
                data.get('learner_email', ''),
                data.get('learner_parent_contact', ''),
                data.get('non_nqf_intervention_subfield_id', ''),
                data.get('non_nqf_intervention_status_id', ''),
                intervention_credit,
                data.get('unit_standard_id', ''),
                data.get('training_provider_code', ''),
                data.get('training_provider_etqa_id', ''),
                data.get('training_provider_postal_address', ''),
                accreditation_start,
                data.get('training_provider_province_code', ''),
                data.get('training_provider_physical_address', ''),
                data.get('learner_home_language', ''),
                data.get('agreement_number', ''),
                data.get('learner_last_school_emis', ''),
                data.get('learner_last_school_year', ''),
                data.get('learner_stats_area_code', ''),
                data.get('additional_documents', ''),
                project_id,
                file_filename
            )
        )
        beneficiary_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Beneficiary added successfully 🎉", "id": beneficiary_id}), 201

    except Exception as e:
        print(f"Error adding beneficiary: {str(e)}")
        return jsonify({"error": f"Failed to add beneficiary: {str(e)}"}), 500

# ADD BENEFICIARY EDIT AND DELETE ENDPOINTS
@app.route('/beneficiaries/<int:id>', methods=['PUT'])
def update_beneficiary(id):
    try:
        data = request.form.to_dict()
        
        # Handle file upload
        uploaded_file = request.files.get('file')
        file_filename = None
        if uploaded_file:
            ext = os.path.splitext(uploaded_file.filename)[1]
            file_filename = f"{uuid.uuid4().hex}{ext}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_filename)
            uploaded_file.save(file_path)

        def format_date(date_str):
            if not date_str:
                return None
            try:
                if 'T' in date_str:
                    date_str = date_str.split('T')[0]
                for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%m-%d-%Y', '%d-%m-%Y'):
                    try:
                        return datetime.strptime(date_str, fmt).strftime('%Y-%m-%d')
                    except ValueError:
                        continue
                return date_str
            except:
                return None

        # Format date fields
        programme_start = format_date(data.get('programme_start_date'))
        programme_completion = format_date(data.get('programme_completion_date'))
        certificate_issue = format_date(data.get('certificate_issue_date'))
        accreditation_start = format_date(data.get('training_provider_accreditation_start_date'))

        # Handle numeric fields
        def format_numeric(value):
            if not value:
                return None
            try:
                return float(value)
            except:
                return None

        amount_spent = format_numeric(data.get('amount_spent_per_learner'))
        intervention_credit = format_numeric(data.get('non_nqf_intervention_credit'))

        conn = get_db_connection()
        cur = conn.cursor()
        
        if file_filename:
            # Update with file
            cur.execute(
                '''
                UPDATE beneficiaries SET
                    learner_first_name=%s, learner_surname=%s, learner_initials=%s, learner_title=%s,
                    learner_id_number=%s, learning_programme_type=%s, programme_start_date=%s, 
                    programme_completion_date=%s, certificate_issue_date=%s, ofo_code=%s,
                    nqf_level=%s, programme_description=%s, employer_name=%s, employer_sdl_number=%s,
                    employer_contact_details=%s, training_provider_name=%s, training_provider_sdl_number=%s,
                    training_provider_contact_details=%s, training_provider_type=%s, training_provider_province=%s,
                    learner_province=%s, learner_local_district=%s, learner_residential_area=%s, learner_area_type=%s,
                    learner_physical_address_code=%s, programme_funding_type=%s, amount_spent_per_learner=%s,
                    key_dev_transformation=%s, project_number=%s, activity_number=%s, app_sub_programme=%s,
                    learner_contact_number=%s, learner_email=%s, learner_parent_contact=%s, non_nqf_intervention_subfield_id=%s,
                    non_nqf_intervention_status_id=%s, non_nqf_intervention_credit=%s, unit_standard_id=%s,
                    training_provider_code=%s, training_provider_etqa_id=%s, training_provider_postal_address=%s,
                    training_provider_accreditation_start_date=%s, training_provider_province_code=%s,
                    training_provider_physical_address=%s, learner_home_language=%s, agreement_number=%s,
                    learner_last_school_emis=%s, learner_last_school_year=%s, learner_stats_area_code=%s,
                    additional_documents=%s, uploaded_file=%s
                WHERE id=%s
                ''',
                (
                    data.get('learner_first_name', ''), data.get('learner_surname', ''), data.get('learner_initials', ''),
                    data.get('learner_title', ''), data.get('learner_id_number', ''), data.get('learning_programme_type', ''),
                    programme_start, programme_completion, certificate_issue, data.get('ofo_code', ''),
                    data.get('nqf_level', ''), data.get('programme_description', ''), data.get('employer_name', ''),
                    data.get('employer_sdl_number', ''), data.get('employer_contact_details', ''), data.get('training_provider_name', ''),
                    data.get('training_provider_sdl_number', ''), data.get('training_provider_contact_details', ''), data.get('training_provider_type', ''),
                    data.get('training_provider_province', ''), data.get('learner_province', ''), data.get('learner_local_district', ''),
                    data.get('learner_residential_area', ''), data.get('learner_area_type', ''), data.get('learner_physical_address_code', ''),
                    data.get('programme_funding_type', ''), amount_spent, data.get('key_dev_transformation', ''),
                    data.get('project_number', ''), data.get('activity_number', ''), data.get('app_sub_programme', ''),
                    data.get('learner_contact_number', ''), data.get('learner_email', ''), data.get('learner_parent_contact', ''),
                    data.get('non_nqf_intervention_subfield_id', ''), data.get('non_nqf_intervention_status_id', ''), intervention_credit,
                    data.get('unit_standard_id', ''), data.get('training_provider_code', ''), data.get('training_provider_etqa_id', ''),
                    data.get('training_provider_postal_address', ''), accreditation_start, data.get('training_provider_province_code', ''),
                    data.get('training_provider_physical_address', ''), data.get('learner_home_language', ''), data.get('agreement_number', ''),
                    data.get('learner_last_school_emis', ''), data.get('learner_last_school_year', ''), data.get('learner_stats_area_code', ''),
                    data.get('additional_documents', ''), file_filename, id
                )
            )
        else:
            # Update without changing file
            cur.execute(
                '''
                UPDATE beneficiaries SET
                    learner_first_name=%s, learner_surname=%s, learner_initials=%s, learner_title=%s,
                    learner_id_number=%s, learning_programme_type=%s, programme_start_date=%s, 
                    programme_completion_date=%s, certificate_issue_date=%s, ofo_code=%s,
                    nqf_level=%s, programme_description=%s, employer_name=%s, employer_sdl_number=%s,
                    employer_contact_details=%s, training_provider_name=%s, training_provider_sdl_number=%s,
                    training_provider_contact_details=%s, training_provider_type=%s, training_provider_province=%s,
                    learner_province=%s, learner_local_district=%s, learner_residential_area=%s, learner_area_type=%s,
                    learner_physical_address_code=%s, programme_funding_type=%s, amount_spent_per_learner=%s,
                    key_dev_transformation=%s, project_number=%s, activity_number=%s, app_sub_programme=%s,
                    learner_contact_number=%s, learner_email=%s, learner_parent_contact=%s, non_nqf_intervention_subfield_id=%s,
                    non_nqf_intervention_status_id=%s, non_nqf_intervention_credit=%s, unit_standard_id=%s,
                    training_provider_code=%s, training_provider_etqa_id=%s, training_provider_postal_address=%s,
                    training_provider_accreditation_start_date=%s, training_provider_province_code=%s,
                    training_provider_physical_address=%s, learner_home_language=%s, agreement_number=%s,
                    learner_last_school_emis=%s, learner_last_school_year=%s, learner_stats_area_code=%s,
                    additional_documents=%s
                WHERE id=%s
                ''',
                (
                    data.get('learner_first_name', ''), data.get('learner_surname', ''), data.get('learner_initials', ''),
                    data.get('learner_title', ''), data.get('learner_id_number', ''), data.get('learning_programme_type', ''),
                    programme_start, programme_completion, certificate_issue, data.get('ofo_code', ''),
                    data.get('nqf_level', ''), data.get('programme_description', ''), data.get('employer_name', ''),
                    data.get('employer_sdl_number', ''), data.get('employer_contact_details', ''), data.get('training_provider_name', ''),
                    data.get('training_provider_sdl_number', ''), data.get('training_provider_contact_details', ''), data.get('training_provider_type', ''),
                    data.get('training_provider_province', ''), data.get('learner_province', ''), data.get('learner_local_district', ''),
                    data.get('learner_residential_area', ''), data.get('learner_area_type', ''), data.get('learner_physical_address_code', ''),
                    data.get('programme_funding_type', ''), amount_spent, data.get('key_dev_transformation', ''),
                    data.get('project_number', ''), data.get('activity_number', ''), data.get('app_sub_programme', ''),
                    data.get('learner_contact_number', ''), data.get('learner_email', ''), data.get('learner_parent_contact', ''),
                    data.get('non_nqf_intervention_subfield_id', ''), data.get('non_nqf_intervention_status_id', ''), intervention_credit,
                    data.get('unit_standard_id', ''), data.get('training_provider_code', ''), data.get('training_provider_etqa_id', ''),
                    data.get('training_provider_postal_address', ''), accreditation_start, data.get('training_provider_province_code', ''),
                    data.get('training_provider_physical_address', ''), data.get('learner_home_language', ''), data.get('agreement_number', ''),
                    data.get('learner_last_school_emis', ''), data.get('learner_last_school_year', ''), data.get('learner_stats_area_code', ''),
                    data.get('additional_documents', ''), id
                )
            )
        
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Beneficiary updated successfully ✅"})

    except Exception as e:
        print(f"Error updating beneficiary: {str(e)}")
        return jsonify({"error": f"Failed to update beneficiary: {str(e)}"}), 500

@app.route('/beneficiaries/<int:id>', methods=['DELETE'])
def delete_beneficiary(id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('DELETE FROM beneficiaries WHERE id=%s;', (id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Beneficiary deleted successfully 🗑️"})
    except Exception as e:
        print(f"Error deleting beneficiary: {str(e)}")
        return jsonify({"error": f"Failed to delete beneficiary: {str(e)}"}), 500

# ===================== SERVE UPLOADED FILES ===================== #

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ===================== RUN APP ===================== #

if __name__ == '__main__':
    app.run(debug=True, port=5050)
