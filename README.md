# 🌱 ESG Intelligence — Multi-Agent AI Demo

A demo of agentic AI for industrial ESG compliance. Three AI agents work together to analyze sensor data from a simulated PI server and generate carbon emissions compliance reports.

**🔗 [Live Demo](https://your-streamlit-url.streamlit.app)** · **🖥️ [PI Server](https://pi-server-demo.onrender.com)**

---

## What It Does

Pulls live data from a mock industrial sensor system, calculates Scope 1 carbon emissions, and produces a CSRD compliance report — all autonomously.

### The 3 Agents

| Agent | Role | Tools |
|-------|------|-------|
| 🔍 **Data Agent** | Fetches sensor readings from PI server | `list_sensors`, `get_historical_summary` |
| 🌱 **ESG Agent** | Calculates emissions & checks compliance | `calculate_scope1_emissions`, `check_csrd_compliance` |
| 📝 **Reporter Agent** | Writes executive report | (LLM only) |

---

## Tech Stack

- **FastAPI** — Mock PI Web API serving simulated industrial sensor data
- **LangGraph** — Multi-agent orchestration
- **LangChain** — Agent tooling and abstractions
- **Groq + Llama 3.3 70B** — Fast, free LLM inference
- **Streamlit** — Web UI
- **Render + Streamlit Cloud** — Hosting

---

## Architecture

```text
Streamlit UI  ──>  LangGraph Multi-Agent  ──>  Mock PI Server
(user input)       Data → ESG → Reporter        (FastAPI)
                          │
                          ▼
                       Groq LLM
```

---

## Run Locally

### 1. Clone & install

```bash
git clone https://github.com/sajanyerra/esg-multi-agent-demo.git
cd esg-multi-agent-demo
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Add your Groq API key

Create a `.env` file in the project root:

```
GROQ_API_KEY=gsk_your_key_here
```

Get a free key at https://console.groq.com.

### 3. Start the PI server

```bash
python main.py
```

Visit http://localhost:8000 to see the dashboard.

### 4. Start the Streamlit app

In a new terminal:

```bash
streamlit run app.py
```

Visit http://localhost:8501.

---

## Project Structure

```text
.
├── main.py              FastAPI mock PI server
├── models.py            Pydantic schemas
├── pi_database.py       Tag definitions & in-memory store
├── data_generator.py    Realistic time-series simulation
├── config.py            Server config
├── multi_agent.py       LangGraph 3-agent workflow
├── app.py               Streamlit UI
├── requirements.txt
└── README.md
```

---

## Features

- 🏭 **16 simulated industrial sensors** across boilers, reactors, tanks, power systems
- 📡 **PI Web API endpoints** — `/points`, `/streams/{id}/value`, `/recorded`, `/interpolated`
- 🤖 **Autonomous tool calling** — agents pick the right tool based on the question
- 🎯 **Guided UI** — dropdown-based query builder + custom mode with validation
- 📥 **Downloadable reports** — markdown format
- 🔍 **Agent conversation log** — see how the agents talked to each other

---

## Roadmap

- [ ] Persistent SQLite storage for historical data
- [ ] Real-time data streaming via WebSockets
- [ ] Scope 2 & 3 emissions calculations
- [ ] Multi-facility support

---

## Built By

**Sajan Yerra**

[![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white)](https://github.com/sajanyerra)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sajanyerra/)

---

## License

MIT — feel free to fork and build on top.
