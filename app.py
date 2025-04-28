from flask import Flask, render_template, g
import time

app = Flask(__name__)
# stamp once, when the server process spins up
app.config['QUIZ_VERSION'] = str(int(time.time()))

@app.context_processor
def inject_quiz_version():
    return {'quiz_version': app.config['QUIZ_VERSION']}

@app.route("/")
def home():
    return render_template("home.html")

@app.route('/viewsar')
def viewsar():
    return render_template('viewsar.html')

@app.route('/infosar')
def infosar():
    return render_template('infosar.html')

@app.route('/parts')
def parts():
    return render_template('parts.html')

@app.route('/videosar')
def videosar():
    return render_template('videosar.html')

@app.route('/quiz')
def quiz():
    return render_template('quiz.html')

@app.route('/results')
def results():
    return render_template('results.html')

@app.route('/quiz/multiple')
def quiz_mc():
    return render_template('quiz_mc.html')

@app.route('/quiz/dragdrop')
def quiz_dd():
    return render_template('quiz_dd.html')

if __name__ == '__main__':
    app.run(debug=True, port=8000)
