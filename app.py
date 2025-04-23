from flask import Flask, render_template

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

if __name__ == "__main__":
    app.run(debug=True)
