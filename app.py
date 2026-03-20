from flask import Flask, render_template, request, redirect, url_for, session
import sqlite3

app = Flask(__name__)
app.secret_key = "supersecretkey123"

# Create DB table
def init_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            url TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def home():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    if username == "admin" and password == "admin123":
        session['user'] = username   
        return redirect(url_for('dashboard'))
    else:
        return "Invalid Credentials "
    
@app.route('/logout')
def logout():
    session.pop('user', None)   # remove session
    return redirect(url_for('home'))

@app.route('/dashboard')
def dashboard():
    if 'user' not in session:
        return redirect(url_for('home'))  # redirect to login

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pages")
    pages = cursor.fetchall()
    conn.close()

    return render_template('dashboard.html', pages=pages)

@app.route('/add_page', methods=['POST'])
def add_page():
    name = request.form['name']
    url = request.form['url']

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO pages (name, url) VALUES (?, ?)", (name, url))
    conn.commit()
    conn.close()

    return redirect(url_for('dashboard'))

@app.route('/delete/<int:id>')
def delete_page(id):
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM pages WHERE id = ?", (id,))
    conn.commit()
    conn.close()

    return redirect(url_for('dashboard'))

if __name__ == '__main__':
    app.run(debug=True)