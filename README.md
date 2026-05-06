# 🌱 ESG Intelligence — Industrial Emissions Analyzer

A full-stack AI application that analyzes industrial sensor data and generates ESG carbon emissions compliance reports using multi-agent LLM orchestration.

**Live:** esg-multi-agent-demo.vercel.app

---

## 📋 Features

- ✅ Single Asset Analysis — Analyze individual sensors for Scope 1 emissions
- ✅ Facility-Wide Audit — Comprehensive emissions analysis across all sensors
- ✅ Live Sensor Dashboard — Real-time sensor values with 5-second refresh
- ✅ AI-Powered Reports — Multi-agent LLM generates professional compliance reports
- ✅ Dark Theme UI — Modern glassmorphism design with emerald accents
- ✅ CSRD Compliance Checks — Demo-baseline emissions thresholds

---

## 🚀 Live Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Vercel | https://esg-intelligence.vercel.app |
| Agent API | Render | https://esg-multi-agent-demo-1.onrender.com |
| PI Server | Render | https://esg-multi-agent-demo.onrender.com |

---

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS v3
- Lucide React

### Backend
- FastAPI (Python)
- LangChain + LangGraph
- Groq Llama 3.3 70B

### Deployment
- Vercel (React)
- Render (FastAPI)

---

## 📊 The 3 Agents

### Data Agent
- **Role:** Fetches sensor historical data
- **Tools:** `get_historical_summary(webid, hours)`
- **Output:** Min/max/avg values

### ESG Agent
- **Role:** Calculates Scope 1 emissions
- **Tools:** `calculate_scope1_emissions` and `check_csrd_compliance`
- **Emission Factors:**
  - Natural gas: 2.02 kg CO₂/m³
  - Diesel: 2.68 kg CO₂/L
  - Coal: 2.42 kg CO₂/kg

### Reporter Agent
- **Role:** Generates professional markdown reports
- **Sections:** Executive Summary, Sensor Data, Emissions Calculation, Compliance Status, Recommendations, Disclaimer

---

## ⚡ Performance

| Action | Time | Tokens |
|--------|------|--------|
| Single asset analysis | 30-60s | ~2,000 |
| Facility audit | 60-120s | ~4,000-5,000 |
| Dashboard refresh | 5-10s | ~500 |

> **Note:** Groq free tier = 100k tokens/day (~20-30 runs/day)

---

## 🐛 Known Issues

| Issue | Solution |
|-------|----------|
| Render cold start slow | Wake-up ping on app load |
| Groq 100k token limit | Upgrade or wait 24h reset |
| LLM passes math expression | eval() fallback in tool |
| Facility audit slow | More sensors = more tokens |

---

## 📝 Compliance Disclaimer

The **100 tCO₂ (asset)** and **500 tCO₂ (facility)** thresholds are **demo baselines only**.

**Real CSRD compliance:**
- Assessed at **organizational level**
- Applies to **1,000+ employees** or **€450M+ turnover**
- Includes **Scope 1, 2, 3** (this tool covers Scope 1 only)

> This tool is for portfolio demonstration purposes only.

---

## 🔐 Security

- ✅ API keys in environment variables only
- ✅ `.env` in `.gitignore`
- ✅ CORS enabled on all endpoints
- ✅ No secrets committed to GitHub

---

## 📚 Resources

- [Groq Console](https://console.groq.com)
- [LangChain Docs](https://python.langchain.com)
- [LangGraph Docs](https://langchain-ai.github.io/langgraph)
- [CSRD Regulation](https://ec.europa.eu/info/business-economy-euro/corporate-governance-and-capital-markets-union/corporate-sustainability-reporting_en)

---

## 👤 Author

**Sajan Yerra**

- GitHub: [@sajanyerra](https://github.com/sajanyerra)
- LinkedIn: [Sajan Yerra](https://www.linkedin.com/in/sajanyerra)
- Targeting: AI Engineer / AVEVA PI / ESG Data roles

---

## 📄 License

Open source for portfolio purposes. Last updated May 2026.

# 🛠️ Setup Guide

## Prerequisites

- Python 3.11+
- Node.js 18+
- Groq API Key — get free at https://console.groq.com

---

## Local Development

### Step 1 — Python Backend

    cd mock_pi_api
    python -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt

### Step 2 — Create mock_pi_api/.env

    GROQ_API_KEY=your_key_here
    PI_BASE=http://localhost:8000

### Step 3 — Frontend

    cd esg-frontend
    npm install

### Step 4 — Create esg-frontend/.env

    VITE_API_URL=http://localhost:8001
    VITE_PI_URL=http://localhost:8000

### Step 5 — Start All Services

**Terminal 1 — PI Server**

    cd mock_pi_api
    venv\Scripts\activate
    python main.py

**Terminal 2 — Agent API**

    cd mock_pi_api
    venv\Scripts\activate
    python agent_api.py

**Terminal 3 — Frontend**

    cd esg-frontend
    npm run dev

Open http://localhost:5174

---

## Production Environment Variables

### Render — PI Server

    GROQ_API_KEY=your_key
    PI_BASE=http://localhost:8000

### Render — Agent API

    GROQ_API_KEY=your_key
    PI_BASE=https://esg-multi-agent-demo.onrender.com

### Vercel — Frontend

    VITE_API_URL=https://esg-multi-agent-demo-1.onrender.com
    VITE_PI_URL=https://esg-multi-agent-demo.onrender.com

---

## Deployment

### Push to GitHub

    cd D:\Projects\PI
    git add -A
    git status
    git commit -m "Your message"
    git push origin main

### Render

1. Go to Render Dashboard
2. PI Server → Manual Deploy → Deploy Latest Commit
3. Agent API → Manual Deploy → Deploy Latest Commit
4. Wait 3-5 minutes

### Vercel

Auto-deploys on push to main. No manual action needed.

---

## Project Structure

    esg-multi-agent-demo/
    ├── mock_pi_api/
    │   ├── main.py
    │   ├── agent_api.py
    │   ├── multi_agent.py
    │   ├── pi_database.py
    │   ├── data_generator.py
    │   ├── models.py
    │   └── requirements.txt
    │
    └── esg-frontend/
        ├── src/
        │   ├── api/
        │   │   └── client.js
        │   ├── components/
        │   │   ├── Navbar.jsx
        │   │   ├── ReportViewer.jsx
        │   │   ├── AgentPipeline.jsx
        │   │   ├── SensorCard.jsx
        │   │   ├── DismissibleBanner.jsx
        │   │   ├── LoadingSkeletons.jsx
        │   │   └── MetricCard.jsx
        │   ├── context/
        │   │   └── SensorContext.jsx
        │   ├── hooks/
        │   │   └── useAnalysis.js
        │   ├── pages/
        │   │   ├── ComparePage.jsx
        │   │   └── Dashboard.jsx
        │   └── App.jsx
        ├── tailwind.config.js
        └── package.json

git add README.md SETUP.md
git commit -m "Add README and SETUP docs"
git push origin main
