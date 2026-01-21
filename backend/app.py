from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_db_connection
from datetime import datetime

app = Flask(__name__)
CORS(app)


@app.route("/api/projects", methods=["GET"])
def get_projects():
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
                "title": r[1],
                "description": r[2],
                "start_date": r[3].strftime("%Y-%m-%d"),
                "end_date": r[4].strftime("%Y-%m-%d"),
                "participants": r[5],
                "accreditors": r[6]
            })

        return jsonify(projects)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/projects", methods=["POST"])
def create_project():
    data = request.get_json()

    required = ["title", "description", "start_date", "end_date", "participants", "accreditors"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO projects
            (title, description, start_date, end_date, participants, accreditors)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            data["title"],
            data["description"],
            data["start_date"],
            data["end_date"],
            data["participants"],
            data["accreditors"]
        ))

        project_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"id": project_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===================== BENEFICIARIES ===================== #

@app.route("/api/beneficiaries", methods=["GET"])
def get_beneficiaries():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
              b.id,
              b.project_id,
              b.learner_first_names,
              b.learner_surname,
              b.learner_id_number,
              b.learning_programme_type,
              b.programme_start_date,
              b.programme_completion_date,
              p.title
            FROM beneficiaries b
            JOIN projects p ON b.project_id = p.id
            ORDER BY b.id DESC;
        """)

        rows = cur.fetchall()
        cur.close()
        conn.close()

        beneficiaries = []
        for r in rows:
            beneficiaries.append({
                "id": r[0],
                "project_id": r[1],
                "learner_first_names": r[2],
                "learner_surname": r[3],
                "learner_id_number": r[4],
                "learning_programme_type": r[5],
                "programme_start_date": r[6].strftime("%Y-%m-%d") if r[6] else None,
                "programme_completion_date": r[7].strftime("%Y-%m-%d") if r[7] else None,
                "project_title": r[8]
            })

        return jsonify(beneficiaries)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/beneficiaries", methods=["POST"])
def create_beneficiary():
    data = request.get_json()

    required = [
        "project_id",
        "learner_first_names",
        "learner_surname",
        "learner_id_number"
    ]

    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO beneficiaries
            (project_id, learner_first_names, learner_surname, learner_id_number,
             learning_programme_type, programme_start_date, programme_completion_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            data["project_id"],
            data["learner_first_names"],
            data["learner_surname"],
            data["learner_id_number"],
            data.get("learning_programme_type"),
            data.get("programme_start_date"),
            data.get("programme_completion_date")
        ))

        beneficiary_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"id": beneficiary_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===================== ROOT ===================== #

@app.route("/")
def home():
    return jsonify({
        "message": "Beneficiary Management System API",
        "version": "1.0"
    })


if __name__ == "__main__":
    app.run(debug=True, port=5050)
