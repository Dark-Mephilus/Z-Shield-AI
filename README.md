# 🛡️ Z-Shield AI 
## Analyze Before You Trust

## Made for SerpAPI hackathon 

**AI-Powered Scam Detection, Document Intelligence & Web Verification**  
**Powered by Gemini 2.5 Flash + SerpApi | FastAPI | Vanilla JavaScript PWA**

Z-Shield AI is an AI-powered security intelligence platform that helps users analyze suspicious messages, job offers, contracts, documents, and images before they trust, sign, pay, or share sensitive information.

Gemini 2.5 Flash performs the primary contextual analysis. SerpApi adds live public-web search to help verify relevant companies, job listings, news claims, addresses, and other checkable details. Together, they produce a structured report with risk indicators, explanations, source links, and practical next steps.

**Developed by Syed Zidaan Ahmad**

---

## 🌐 Live Demo

🚀 **Try Z-Shield AI:**  
https://z-shield-ai.onrender.com/

⭐ If you find this project useful, consider giving it a star on GitHub.

---

## 📖 About the Project

Online scams often use convincing language, fake opportunities, urgent payment requests, misleading claims, and complicated contract terms. It can be difficult to tell what deserves closer inspection—especially when the information appears genuine at first glance.

Z-Shield AI brings document analysis and evidence discovery into one workflow. It examines the supplied content, highlights potential risks, explains suspicious clauses or tactics in plain language, and searches for relevant public information that may help the user check important claims.

The goal is to make security and document review easier to understand, even for users without specialist legal or cybersecurity knowledge.

---

## 🚀 Features

### 🛡️ AI Scam & Risk Detection
Analyzes suspicious messages, emails, job offers, payment requests, and other content for possible scam indicators, phishing signals, misleading promises, and unusual requests.

### 📄 Smart Document Intelligence
Extracts and analyzes supported document content, helping users understand important details and identify potential risks.

Supported input and document handling may include:
- Pasted text and messages
- PDF documents with selectable text
- DOCX documents
- TXT, CSV, and JSON files
- Images and screenshots

### 🖼️ Intelligent Image Analysis
Analyze supported images, screenshots, advertisements, suspicious messages, and other visual content for contextual warning signs and potentially misleading information.

### ⚖️ Clause-by-Clause Contract Intelligence
Reviews contract content and highlights clauses that may deserve closer attention, with:
- Risk level
- Clause summary
- Plain-language explanation
- Suggested next steps

### 📊 Security Intelligence Dashboard
Presents key findings in a structured report, including indicators such as:
- Safety score
- Trust score
- Estimated scam probability
- Risk category
- Verification difficulty
- Missing information
- Critical red flags and recommendations

### 🚩 Critical Risk Detection
Surfaces potentially suspicious payment requests, hidden or unclear terms, misleading statements, financial risks, and other warning signs found in the supplied content.

### 🧠 Psychological Manipulation Detection
Identifies possible social-engineering techniques such as urgency, fear, scarcity, authority pressure, emotional manipulation, and attempts to exploit trust.

### 🌐 Live Web Verification with SerpApi
Z-Shield AI uses SerpApi to search public web results for relevant details identified during analysis. This adds an evidence-discovery step beyond the original document review.

Depending on the verification target, the backend selects a suitable search engine:

| Verification target | SerpApi engine | Purpose |
|---|---|---|
| Company, domain, or general claim | `google` | Find relevant public pages and references |
| News-related claim | `google_news` | Find related news coverage |
| Job offer or listing | `google_jobs` | Look for matching job listings |
| Address or business location | `google_maps` | Find relevant places and business results |

The workflow can identify up to three verification targets and retrieve up to five normalized results per target. Source links are included so users can inspect the underlying pages.

### 🧾 Evidence-Assisted Assessment
Gemini can compare retrieved search evidence with the original findings and categorize the comparison as:
- **Supported** — retrieved evidence appears consistent with the claim
- **Contradicted** — retrieved evidence appears to conflict with the claim
- **Mixed** — evidence points in different directions
- **Inconclusive** — available evidence is insufficient to make a clear comparison

These labels help organize the findings; users should open the source links and assess the context themselves.

### 📈 Verification Coverage
The report shows which requested checks completed and how many targets returned source results. Coverage describes the search process, not whether a claim is true.

### 💬 AI Follow-up Assistant
Continue asking questions about the current analysis, for example:
- Is this job offer suspicious?
- Why is this clause risky?
- What should I verify before paying?
- Which details need independent confirmation?

### 📑 PDF Report Export
Export the analysis report as a PDF for later review or sharing.

### 📱 Progressive Web App (PWA)
Use the installable web interface on compatible mobile and desktop devices for an app-like experience.

### 🗂️ Browser-Local Scan History
Review previous scans saved in the browser, where supported by the current app interface.

---

## 🔄 How It Works

1. **Provide content** — paste text or upload a supported document or image.
2. **Gemini analyzes it** — the backend sends the content for contextual scam, document, and risk analysis.
3. **Verification targets are identified** — relevant companies, jobs, addresses, news claims, or other checkable details are selected.
4. **SerpApi searches public results** — the backend routes each target to Google Search, Google News, Google Jobs, or Google Maps as appropriate.
5. **Results are organized** — retrieved results are normalized into source records with links and source context.
6. **Evidence is assessed** — Gemini compares the available search evidence with the initial findings when evidence is available.
7. **The report is displayed** — review the risk dashboard, findings, verification results, and recommended next steps.

The core Gemini analysis can still run if SerpApi is not configured or a search request fails. In that case, live verification may be skipped or unavailable.

---

## 🧰 Technology Stack

| Component | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Python, FastAPI, Uvicorn |
| Primary AI model | Google Gemini 2.5 Flash |
| Live web search | SerpApi Search API |
| HTTP requests | `httpx` |
| PDF handling | PDF.js |
| DOCX handling | Mammoth.js |
| App experience | Progressive Web App (PWA), service worker |
| Deployment | Docker-compatible Python hosting |

---

## 🏗️ Architecture

```text
User text / document / image
            |
            v
   Vanilla JavaScript PWA
            |
            v
       FastAPI Backend
            |
            v
     Gemini 2.5 Flash
       /          \
      v            v
Risk analysis   Verification targets
                     |
                     v
              SerpApi Search API
          /        |        |        \
       Google    News      Jobs      Maps
                     |
                     v
          Normalized source results
                     |
                     v
         Gemini evidence assessment
                     |
                     v
       Dashboard + source links + report
```

---

## ⚙️ Run Locally

### 1. Requirements

Install or prepare:
- Python 3.11 or newer
- A Google Gemini API key
- A SerpApi API key for live web verification

The Gemini key is required for AI analysis. The SerpApi key is optional if you only want to use the base Gemini analysis.

### 2. Clone or download the project

Open a terminal in the project directory.

### 3. Configure environment variables

Create or update the `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
SERPAPI_KEY=your_serpapi_api_key
ALLOWED_ORIGINS=*
```

Replace the placeholders with your own keys. Keep the `.env` file private and never put API keys in frontend JavaScript or commit real keys to a public repository.

For deployment, configure these values using your hosting provider's environment-variable or secret settings. For a cross-origin deployment, set `ALLOWED_ORIGINS` to the appropriate frontend origin.

### 4. Create a virtual environment

```bash
python -m venv .venv
```

**Windows PowerShell**
```powershell
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

**macOS / Linux**
```bash
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 5. Start the backend

Run this command from the project root:

```bash
uvicorn backend.main:app --reload
```

Open the app at:

http://127.0.0.1:8000

Backend health endpoint:

http://127.0.0.1:8000/api/health

### 6. Try the analysis workflow

1. Open Z-Shield AI in your browser.
2. Paste a sample message or upload a supported document or image.
3. Run the analysis and review the dashboard.
4. If `SERPAPI_KEY` is configured, inspect the **Live Web Verification** section.
5. Open the source links to check the original pages.
6. Ask follow-up questions or export the report as a PDF.

For a quick verification test, use sample content containing a checkable company name, job title, public address, or news claim.

---

## 🚀 Deployment

Z-Shield AI can be deployed to a Python hosting platform that supports FastAPI, environment variables, and the included Docker setup.

Configure these environment variables in the hosting dashboard:

```env
GEMINI_API_KEY=your_gemini_api_key
SERPAPI_KEY=your_serpapi_api_key
ALLOWED_ORIGINS=your_frontend_origin
```

A typical Uvicorn start command is:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

Use the port configuration required by your hosting platform. Do not bake API keys into the Docker image.

---

## 📁 Project Structure

```text
.
├── .env
├── Dockerfile
├── README.md
├── backend/
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── style.css
    ├── script.js
    ├── manifest.json
    ├── service-worker.js
    ├── ZShield192.png
    └── ZShield512.png
```

---

## 💡 Why Z-Shield AI?

Z-Shield AI combines contextual AI analysis with targeted public-web evidence discovery in a single workflow. Instead of only returning a general answer, it helps users review risk indicators, understand why something may be suspicious, inspect relevant external sources, and decide what to verify next.

Its mission is simple:

> **Help people make safer decisions before they trust, sign, pay, or share sensitive information.**

---

## 👨‍💻 Developer

**Syed Zidaan Ahmad**  
AI • Machine Learning • Full Stack Development • Software Development

---

## ⭐ Support

If you find Z-Shield AI useful, please consider giving the project a ⭐ on GitHub. Your support helps the project reach more people.

---

# 🛡️ Analyze Before You Trust.
### Because one informed decision can prevent a costly mistake.
