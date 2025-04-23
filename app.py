from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import random
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your-secret-key'  # Required for session

# Quiz data
QUIZ_DATA = {
    "parts": [
        {
            "id": 1,
            "name": "Magazine",
            "image": "/static/images/Magazine.png",
            "description": "Holds ammunition for the rifle"
        },
        {
            "id": 2,
            "name": "Upper Receiver Group",
            "image": "/static/images/Upper_Receiver_Group.png",
            "description": "Houses the barrel and bolt carrier group"
        },
        {
            "id": 3,
            "name": "Bolt Group",
            "image": "/static/images/Bolt_Group.png",
            "description": "Contains firing mechanism"
        },
        {
            "id": 4,
            "name": "Lower Receiver Group",
            "image": "/static/images/Lower_Receiver_Group.png",
            "description": "Houses the trigger group and magazine"
        },
        {
            "id": 5,
            "name": "Barrel Group",
            "image": "/static/images/Barrel_Group.png",
            "description": "Houses the barrel and gas system"
        }
    ]
}

@app.route("/")
def home():
    session.clear()  # Clear any existing quiz progress
    return render_template("home.html")

@app.route("/viewsar")
def viewsar():
    return render_template("viewsar.html")

@app.route("/infosar")
def infosar():
    return render_template("infosar.html")

@app.route('/quiz/<int:question_num>')
def quiz(question_num):
    if 'score' not in session:
        session['score'] = 0
        session['completed'] = []
        session['answers'] = []  # List to store answer history
    
    # Check if all questions are completed
    if len(session['completed']) >= len(QUIZ_DATA["parts"]):
        return redirect(url_for('quiz_results'))
    
    # Get available parts (not completed yet)
    available_parts = [part for part in QUIZ_DATA["parts"] if part["id"] not in session['completed']]
    if not available_parts:
        return redirect(url_for('quiz_results'))
    
    # Select a random part from available parts
    current_part = random.choice(available_parts)
    
    # Get all possible options except the correct one
    other_options = [part["name"] for part in QUIZ_DATA["parts"] if part["name"] != current_part["name"]]
    # Randomly select 2 wrong options
    random.shuffle(other_options)
    options = other_options[:2] + [current_part["name"]]
    # Shuffle all options
    random.shuffle(options)
    
    return render_template('quiz.html',
                         image_url=current_part["image"],
                         options=options,
                         question_num=question_num,
                         current_part_id=current_part["id"],
                         total_questions=len(QUIZ_DATA["parts"]),
                         score=session['score'])

@app.route('/submit_answer', methods=['POST'])
def submit_answer():
    data = request.get_json()
    part_id = data.get('part_id')
    selected_answer = data.get('answer')
    
    # Get current part
    current_part = next((part for part in QUIZ_DATA["parts"] if part["id"] == part_id), None)
    if not current_part:
        return jsonify({'success': False, 'message': 'Invalid part ID'})
    
    correct_answer = current_part["name"]
    
    # Store answer data
    answer_data = {
        'part_id': part_id,
        'part_name': current_part["name"],
        'selected_answer': selected_answer,
        'correct_answer': correct_answer,
        'is_correct': selected_answer == correct_answer,
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    if 'answers' not in session:
        session['answers'] = []
    session['answers'] = session.get('answers', []) + [answer_data]
    
    # Check if answer is correct
    is_correct = selected_answer == correct_answer
    if is_correct:
        session['score'] = session.get('score', 0) + 5
        if part_id not in session.get('completed', []):
            session['completed'] = session.get('completed', []) + [part_id]
    else:
        session['score'] = session.get('score', 0) - 3  # Remove the max(0, ...) to allow negative scores
    
    # Check if all questions are completed
    all_completed = len(session.get('completed', [])) >= len(QUIZ_DATA["parts"])
    
    return jsonify({
        'success': True,
        'correct': is_correct,
        'score': session['score'],
        'all_completed': all_completed
    })

@app.route('/quiz_results')
def quiz_results():
    if 'score' not in session:
        return redirect(url_for('home'))
    
    # Get answer history from session
    answers = session.get('answers', [])
    
    # Calculate statistics
    total_questions = len(answers)
    correct_answers = sum(1 for answer in answers if answer['is_correct'])
    accuracy = (correct_answers / total_questions * 100) if total_questions > 0 else 0
    
    return render_template('results.html', 
                         score=session['score'],
                         total_questions=len(QUIZ_DATA["parts"]),
                         answers=answers,
                         accuracy=accuracy)

@app.route('/restart_quiz')
def restart_quiz():
    session.clear()  # Clear all session data
    return redirect(url_for('quiz', question_num=1))

if __name__ == "__main__":
    app.run(debug=True)
