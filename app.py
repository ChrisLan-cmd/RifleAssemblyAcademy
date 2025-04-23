from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
import random

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///quiz.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Database Models
class UserProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    score = db.Column(db.Integer, default=0)
    current_question = db.Column(db.Integer, default=1)

# Quiz data
QUIZ_DATA = {
    "parts": [
        {
            "id": 1,
            "name": "Magazine",
            "image": "/static/images/magazine.jpg",
            "description": "Holds ammunition for the rifle"
        },
        {
            "id": 2,
            "name": "Upper Receiver Group",
            "image": "/static/images/upper_receiver.jpg",
            "description": "Houses the barrel and bolt carrier group"
        },
        {
            "id": 3,
            "name": "Bolt Group",
            "image": "/static/images/bolt_group.jpg",
            "description": "Contains firing mechanism"
        }
    ]
}

@app.route("/")
def home():
    # Reset user progress when starting new quiz
    progress = UserProgress.query.first()
    if progress:
        db.session.delete(progress)
        db.session.commit()
    return render_template("home.html")

@app.route("/viewsar")
def viewsar():
    return render_template("viewsar.html")

@app.route("/infosar")
def infosar():
    return render_template("infosar.html")

@app.route('/quiz/<int:question_num>')
def quiz(question_num):
    if question_num > len(QUIZ_DATA["parts"]):
        return redirect(url_for('quiz_results'))
    
    # Get current part
    current_part = QUIZ_DATA["parts"][question_num - 1]
    
    # Get all possible options
    options = [part["name"] for part in QUIZ_DATA["parts"]]
    
    # Randomize options
    random.shuffle(options)
    
    return render_template('quiz.html',
                         image_url=current_part["image"],
                         options=options,
                         question_num=question_num,
                         total_questions=len(QUIZ_DATA["parts"]))

@app.route('/submit_answer', methods=['POST'])
def submit_answer():
    data = request.get_json()
    question_num = data.get('question_num')
    selected_answer = data.get('answer')
    
    # Get current part
    current_part = QUIZ_DATA["parts"][question_num - 1]
    correct_answer = current_part["name"]
    
    # Get or create user progress
    progress = UserProgress.query.first()
    if not progress:
        progress = UserProgress()
        db.session.add(progress)
    
    # Update score based on answer
    if selected_answer == correct_answer:
        progress.score += 5
    else:
        progress.score -= 3
    
    progress.current_question = question_num + 1
    db.session.commit()
    
    return jsonify({
        'success': True,
        'correct': selected_answer == correct_answer,
        'score': progress.score
    })

@app.route('/quiz_results')
def quiz_results():
    progress = UserProgress.query.first()
    if not progress:
        return redirect(url_for('home'))
    
    return render_template('results.html', 
                         score=progress.score,
                         total_questions=len(QUIZ_DATA["parts"]))

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
