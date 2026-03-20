from flask import Flask, render_template, redirect, url_for, session
import sqlite3
import ssl
import socket
from datetime import datetime
import requests
import re
from flask import jsonify, request
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from bs4 import BeautifulSoup

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

@app.route('/edit_page', methods=['POST'])
def edit_page():
    if 'user' not in session:
        return redirect(url_for('home'))

    id = request.form['id']
    name = request.form['name']
    url = request.form['url']

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    cursor.execute("UPDATE pages SET name=?, url=? WHERE id=?", (name, url, id))

    conn.commit()
    conn.close()

    return redirect(url_for('dashboard'))

@app.route('/nmap')
def nmap():
    if 'user' not in session:
        return redirect(url_for('home'))
    return render_template('nmap.html')

@app.route('/ssl-check', methods=['GET', 'POST'])
def ssl_check():
    result = None

    if request.method == 'POST':
        raw_host = request.form['host'].strip()

        try:
            # Parse input
            parsed = urlparse(raw_host)
            host = parsed.netloc if parsed.netloc else raw_host
            host = host.split(":")[0]

            if not host:
                raise ValueError("Invalid input")

            context = ssl.create_default_context()

            with socket.create_connection((host, 443), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=host) as ssock:
                    cert = ssock.getpeercert()

            issuer = dict(x[0] for x in cert['issuer'])
            issued_to = dict(x[0] for x in cert['subject'])

            expiry_date = datetime.strptime(cert['notAfter'], "%b %d %H:%M:%S %Y %Z")
            days_left = (expiry_date - datetime.utcnow()).days

            result = {
                "valid": True,
                "issuer": issuer.get('organizationName', 'N/A'),
                "issued_to": issued_to.get('commonName', 'N/A'),
                "expiry": expiry_date,
                "days_left": days_left
            }

        #  Invalid domain / DNS issue
        except socket.gaierror:
            result = {
                "valid": False,
                "error": " Domain not found (DNS resolution failed)"
            }

        #  No SSL (port 443 closed)
        except ConnectionRefusedError:
            result = {
                "valid": False,
                "error": " SSL not enabled (Port 443 closed)"
            }

        #  Timeout
        except socket.timeout:
            result = {
                "valid": False,
                "error": " Server not responding (Timeout)"
            }

        #  SSL handshake issue
        except ssl.SSLError:
            result = {
                "valid": False,
                "error": " SSL handshake failed (Invalid or misconfigured certificate)"
            }

        #  Invalid input
        except ValueError:
            result = {
                "valid": False,
                "error": "Please enter a valid domain (example.com)"
            }

        #  Any other error
        except Exception as e:
            result = {
                "valid": False,
                "error": f" Error: {str(e)}"
            }

    return render_template("ssl.html", result=result)


@app.route('/headers-check', methods=['GET', 'POST'])
def headers_check():

    if request.method == 'GET':
        return render_template("headers.html")

    data = request.get_json()
    url = data.get("url")

    try:
        if not url.startswith("http"):
            url = "http://" + url

        res = requests.get(url, timeout=5)

        headers = res.headers

        result = {
            "Content-Security-Policy": headers.get("Content-Security-Policy"),
            "X-Frame-Options": headers.get("X-Frame-Options"),
            "X-Content-Type-Options": headers.get("X-Content-Type-Options"),
            "Strict-Transport-Security": headers.get("Strict-Transport-Security"),
            "Referrer-Policy": headers.get("Referrer-Policy"),
            "Permissions-Policy": headers.get("Permissions-Policy")
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)})
    
@app.route('/tech-check', methods=['GET', 'POST'])
def tech_check():

    if request.method == 'GET':
        return render_template("tech.html")

    data = request.get_json()
    url = data.get("url")

    try:
        if not url.startswith("http"):
            url = "http://" + url

        res = requests.get(url, timeout=5)
        html = res.text
        headers = res.headers

        result = {}

        # Detect jQuery
        jquery = re.search(r'jquery[.-](\d+\.\d+\.\d+)', html, re.I)
        result["jQuery"] = jquery.group(1) if jquery else None

        # Detect Bootstrap
        bootstrap = re.search(r'bootstrap[.-](\d+\.\d+\.\d+)', html, re.I)
        result["Bootstrap"] = bootstrap.group(1) if bootstrap else None

        # Server detection
        result["Server"] = headers.get("Server")

        # X-Powered-By
        result["X-Powered-By"] = headers.get("X-Powered-By")

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)})
    
@app.route('/dirscan')
def dirscan():
    return render_template("dirscan.html")

@app.route('/subdomain')
def subdomain():
    return render_template("subdomain.html")

@app.route('/sqli-nosql')
def injection():
    return render_template("injection.html")

@app.route("/waf-check", methods=["GET", "POST"])
def waf_check():
    result = {}

    if request.method == "POST":
        url = request.form["url"]

        try:
            if not url.startswith("http"):
                url = "https://" + url

            # ---------------- BASE REQUEST ----------------
            res = requests.get(url, timeout=10)
            headers = str(res.headers).lower()

            waf = []

            if "cloudflare" in headers:
                waf.append("Cloudflare WAF")
            if "akamai" in headers:
                waf.append("Akamai WAF")
            if "incapsula" in headers:
                waf.append("Imperva Incapsula")
            if "cloudfront" in headers:
                waf.append("AWS CloudFront WAF")

            if res.status_code in [403, 406, 503]:
                waf.append("Possible WAF Blocking")

            # ---------------- BYPASS ENGINE ----------------
            payloads = [
                "' OR 1=1--",
                "' OR '1'='1",
                "'/**/OR/**/1=1",
                "' OR SLEEP(1)--",
                "' UNION SELECT NULL--"
            ]

            bypass_results = []

            parsed = urlparse(url)
            query_params = parse_qs(parsed.query)

            param_key = list(query_params.keys())[0] if query_params else "id"

            for p in payloads:
                try:
                    params = query_params.copy()
                    params[param_key] = p

                    new_query = urlencode(params, doseq=True)

                    test_url = urlunparse((
                        parsed.scheme,
                        parsed.netloc,
                        parsed.path,
                        parsed.params,
                        new_query,
                        parsed.fragment
                    ))

                    r = requests.get(test_url, timeout=10)

                    bypass_results.append({
                        "payload": p,
                        "status": r.status_code,
                        "diff": abs(len(r.text) - len(res.text))
                    })

                except Exception:
                    bypass_results.append({
                        "payload": p,
                        "status": "failed",
                        "diff": 0
                    })

            # ---------------- FINAL RESULT ----------------
            result = {
                "status": res.status_code,
                "waf": waf if waf else ["No WAF detected"],
                "bypass": bypass_results
            }

        except Exception as e:
            result = {"error": str(e)}

    return render_template("waf.html", result=result)

@app.route("/js-analyzer", methods=["GET", "POST"])
def js_analyzer():
    result = {}

    if request.method == "POST":
        url = request.form["url"]

        try:
            if not url.startswith("http"):
                url = "https://" + url

            r = requests.get(url, timeout=10)
            soup = BeautifulSoup(r.text, "html.parser")

            js_files = []
            endpoints = set()
            secrets = set()

            # -----------------------------
            # 1. FIND JS FILES
            # -----------------------------
            scripts = soup.find_all("script")

            for s in scripts:
                src = s.get("src")
                if src:
                    if src.startswith("http"):
                        js_url = src
                    else:
                        js_url = url.rstrip("/") + "/" + src.lstrip("/")

                    js_files.append(js_url)

            # -----------------------------
            # 2. ANALYZE JS CONTENT
            # -----------------------------
            for js in js_files:
                try:
                    res = requests.get(js, timeout=5)
                    content = res.text

                    # API endpoints
                    api_matches = re.findall(r"/api/[a-zA-Z0-9_/.-]+", content)
                    endpoints.update(api_matches)

                    # common params
                    param_matches = re.findall(r"[?&]([a-zA-Z0-9_]{2,20})=", content)
                    endpoints.update(param_matches)

                    # possible secrets / tokens
                    token_matches = re.findall(
                        r"(token|apikey|api_key|secret|auth)[\"'\s:=]+[a-zA-Z0-9_\-]{10,}",
                        content,
                        re.IGNORECASE
                    )
                    secrets.update(token_matches)

                except:
                    continue

            result = {
                "url": url,
                "js_files": js_files,
                "endpoints": list(endpoints),
                "secrets": list(secrets)
            }

        except Exception as e:
            result = {"error": str(e)}

    return render_template("js.html", result=result)

if __name__ == '__main__':
    app.run(debug=True)