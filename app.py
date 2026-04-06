from flask import Flask, render_template, request
import os
from parser import process_resume
from skills import JOB_ROLES

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

last_results = []


@app.route("/", methods=["GET", "POST"])
def index():
    global last_results
    job_result = None

    if request.method == "POST":

        # Upload resume
        if "resume" in request.files:
            file = request.files["resume"]

            if file and file.filename != "":
                path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
                file.save(path)

                last_results = process_resume(path)

        # Job check
        if "job_role" in request.form:
            job_input = request.form["job_role"].strip().lower()

            for role in JOB_ROLES:
                if job_input in role.lower():

                    user_skills = last_results[0]["skills"] if last_results else []

                    required = JOB_ROLES[role]

                    known = [s for s in required if s in user_skills]
                    missing = [s for s in required if s not in user_skills]

                    job_result = {
                        "job": role,
                        "known": known,
                        "missing": missing
                    }
                    break

    return render_template("index.html", results=last_results, job_result=job_result)


if __name__ == "__main__":
    app.run(debug=True)