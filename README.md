# Rifle Assembly Academy

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

4. Open your browser and navigate to `http://localhost:5000`

## Database

The application uses SQLite to store user progress. The database file (`quiz.db`) will be created automatically when you first run the application.

## Note

This is a single-user application. It assumes only one user will be using the application at a time. In a production environment, you would want to implement user accounts and proper session management. 