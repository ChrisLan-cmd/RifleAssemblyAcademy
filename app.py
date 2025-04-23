from flask import Flask, render_template, url_for   # url_for is handy in templates

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("home.html")

@app.route("/viewsar")
def viewsar():
    return render_template("viewsar.html")

@app.route("/infosar")
def infosar():
    return render_template("infosar.html")

# NEW ──────────────────────────────────────────────
@app.route("/videosar")
def videosar():
    return render_template("videosar.html")
# ──────────────────────────────────────────────────

@app.route("/quiz")
def quiz():
    # 1) define the ordered list of part-image names
    part_names = [
        "Barrel_Group",
        "Bolt_Group",
        "Lower_Receiver_Group",
        "Magazine",
        "Upper_Receiver_Group"
    ]

    # 2) pick the first part as the “current” one (you can advance this index later)
    initial_part_id = 1   # 1-based index
    # map to 0-based list index
    part_key = part_names[initial_part_id - 1]

    # 3) build the image URL from your static folder
    image_url = url_for(
        'static',
        filename=f'images/{part_key}.jpg'
    )

    # 4) all options shown in the quiz
    options = part_names.copy()

    # 5) initial quiz context
    return render_template(
        "quiz.html",
        image_url       = image_url,
        options         = options,
        current_part_id = initial_part_id,
        question_num    = 1,
        score           = 0
    )

if __name__ == "__main__":
    app.run(debug=True)