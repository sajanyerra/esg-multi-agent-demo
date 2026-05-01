import streamlit as st
import streamlit.components.v1 as components
import requests
import time
from langchain_core.messages import HumanMessage
from multi_agent import app as agent_app
import os

st.set_page_config(page_title="ESG Intelligence", page_icon="🌱", layout="wide")

PI_BASE = os.getenv("PI_BASE", "http://localhost:8000") + "/piwebapi"

# ============================================================
# MINIMAL STYLING
# ============================================================
st.markdown("""
<style>
    .block-container { padding-top: 2rem; max-width: 1100px; }
    h1 { font-weight: 700; letter-spacing: -1px; }
    [data-testid="stMetricValue"] { font-size: 1.8rem; }
    .asset-pill {
        display: inline-block;
        padding: 0.4rem 0.9rem;
        margin: 0.2rem;
        background: #f0f2f6;
        border-radius: 20px;
        font-size: 0.85rem;
        color: #333;
    }
    .stage {
        text-align: center;
        padding: 1rem;
        border-radius: 8px;
        background: #fafafa;
        border: 1px solid #eee;
    }
    .stage-active { background: #fff3cd; border-color: #ffc107; }
    .stage-done { background: #d4edda; border-color: #28a745; }
</style>
""", unsafe_allow_html=True)


# ============================================================
# HELPERS
# ============================================================
@st.cache_data(ttl=60)
def load_sensors():
    try:
        return requests.get(f"{PI_BASE}/points", timeout=5).json()["Items"]
    except Exception:
        return None

def categorize(name):
    n = name.upper()
    if "BA:" in n or "BOILER" in n: return "Boilers"
    if "REACTOR" in n or "PIC" in n or "TIC" in n: return "Reactors"
    if "TANK" in n or "LIC" in n or "LEVEL" in n: return "Tanks"
    if "FT-" in n or "FIC" in n or "FLOW" in n: return "Flow Meters"
    if "PWR" in n or "POWER" in n or "GEN" in n: return "Power Systems"
    if "PUMP" in n or "VALVE" in n: return "Equipment"
    return "Other"

def is_relevant_query(q, sensors):
    q_lower = q.lower()
    sensor_match = any(s["Name"].lower() in q_lower or s["Descriptor"].lower() in q_lower for s in sensors)
    keywords = ["emission", "scope", "csrd", "carbon", "co2", "compliance", "fuel", "gas", "diesel", "coal", "boiler", "reactor", "tank", "sensor", "analyze", "audit"]
    keyword_match = any(k in q_lower for k in keywords)
    return sensor_match or keyword_match


# ============================================================
# LOAD DATA
# ============================================================
sensors = load_sensors()

if not sensors:
    st.error("⚠️ Cannot reach the PI server. Start it with `python main.py` in another terminal.")
    st.stop()

categories = {}
for s in sensors:
    cat = categorize(s["Name"])
    categories.setdefault(cat, []).append(s)


# ============================================================
# HEADER
# ============================================================
st.markdown("# 🌱 ESG Intelligence")
st.markdown("##### *Industrial carbon emissions, analyzed by AI agents.*")
st.write("")


# ============================================================
# WHAT IS THIS? (Explainer)
# ============================================================
with st.expander("👋 **First time here? Click to learn what this demo does**", expanded=False):
    st.markdown("""
    **What it does:** Analyzes industrial sensor data and generates an ESG compliance report — automatically.
    
    **How it works:** Three AI agents work in sequence:
    - 🔍 **Data Agent** pulls sensor readings from the PI server
    - 🌱 **ESG Agent** calculates Scope 1 carbon emissions and checks EU CSRD compliance
    - 📝 **Reporter Agent** writes a clean executive report
    
    **What you'll do:**
    1. Pick an asset, fuel type, amount, and time period below
    2. Click **Analyze**
    3. Get a professional compliance report in ~20 seconds
    
    **Tech:** FastAPI · LangGraph · Groq (Llama 3.3) · Streamlit
    """)


# ============================================================
# FACILITY OVERVIEW
# ============================================================
header_col1, header_col2 = st.columns([3, 1])
with header_col1:
    st.markdown("##### Your facility at a glance")
with header_col2:
    st.link_button("🖥️  Open PI Server", "http://localhost:8000", use_container_width=True)

m1, m2, m3, m4 = st.columns(4)
m1.metric("Sensors online", len(sensors))
m2.metric("Asset categories", len(categories))
m3.metric("Data source", "PI Server")
m4.metric("Status", "🟢 Live")


# ============================================================
# QUERY BUILDER (GUIDED)
# ============================================================
st.markdown("##### Build your analysis")
st.caption("Pick options below — we'll generate the right question for the AI agents.")

mode = st.radio(
    "Input mode",
    ["🎯 Guided (recommended)", "✏️ Custom question"],
    horizontal=True,
    label_visibility="collapsed"
)

question = ""

if mode == "🎯 Guided (recommended)":
    c1, c2 = st.columns(2)
    
    with c1:
        sensor_options = {f"{s['Name']} — {s['Descriptor']}": s for s in sensors}
        picked_label = st.selectbox("**Asset to analyze**", list(sensor_options.keys()))
        picked_sensor = sensor_options[picked_label]
        
        fuel = st.selectbox("**Fuel type**", ["natural_gas", "diesel", "coal"], 
                           format_func=lambda x: {"natural_gas": "Natural gas (m³)", "diesel": "Diesel (liters)", "coal": "Coal (kg)"}[x])
    
    with c2:
        amount = st.number_input("**Fuel consumed**", min_value=0.0, value=5000.0, step=500.0)
        hours = st.selectbox("**Time period**", [6, 12, 24, 48], index=2, format_func=lambda x: f"Last {x} hours")
    
    unit_map = {"natural_gas": "m³", "diesel": "liters", "coal": "kg"}
    question = (
        f"Analyze {picked_sensor['Descriptor']} (sensor {picked_sensor['Name']}) over the last {hours} hours. "
        f"Assume {amount} {unit_map[fuel]} of {fuel.replace('_', ' ')} was consumed. "
        f"Calculate Scope 1 emissions and check CSRD compliance."
    )
    
    with st.expander("Preview generated question"):
        st.code(question, language=None)

else:
    question = st.text_area(
        "Custom question",
        placeholder="e.g. Analyze Boiler A Temperature over 24h with 5000 m³ of natural gas...",
        height=100,
        label_visibility="collapsed"
    )
    if question and not is_relevant_query(question, sensors):
        st.warning("⚠️ Your question doesn't mention any sensors or ESG topics. The agents may struggle. Please reference an asset from above or use Guided mode.")


# ============================================================
# RUN BUTTON
# ============================================================
st.write("")
ready = bool(question.strip()) and (mode == "🎯 Guided (recommended)" or is_relevant_query(question, sensors))

run = st.button("▶ Analyze", type="primary", use_container_width=True, disabled=not ready)

if not ready and question.strip() and mode == "✏️ Custom question":
    st.caption("🔒 Button disabled — your question must reference an asset or ESG topic.")


# ============================================================
# EXECUTION (runs once, stores result in session state)
# ============================================================
if run:
    with st.spinner("🤖 Agents working... this takes about 20 seconds"):
        try:
            start = time.time()
            result = agent_app.invoke({"messages": [HumanMessage(content=question)]})
            st.session_state.result = result
            st.session_state.elapsed = time.time() - start
            st.session_state.just_ran = True
            st.rerun()
        except Exception as e:
            st.error(f"Something went wrong: {e}")
            st.session_state.result = None


# ============================================================
# RESULTS (persists across reruns — download won't wipe it)
# ============================================================
if st.session_state.get("result"):
    result = st.session_state.result
    elapsed = st.session_state.elapsed
    
    st.divider()
    st.markdown('<div id="results"></div>', unsafe_allow_html=True)
    st.markdown("##### Agent pipeline")
    
    s1, s2, s3 = st.columns(3)
    s1.markdown('<div class="stage stage-done">🔍<br><b>Data Agent</b><br><small>✓ Complete</small></div>', unsafe_allow_html=True)
    s2.markdown('<div class="stage stage-done">🌱<br><b>ESG Agent</b><br><small>✓ Complete</small></div>', unsafe_allow_html=True)
    s3.markdown('<div class="stage stage-done">📝<br><b>Reporter</b><br><small>✓ Complete</small></div>', unsafe_allow_html=True)
    
    st.caption(f"⏱️ Completed in {elapsed:.1f}s")
    
    st.write("")
    st.markdown("##### Compliance report")
    with st.container(border=True):
        report = result["messages"][-1].content
        st.markdown(report)
    
    c1, c2 = st.columns(2)
    c1.download_button("⬇ Download report", report, file_name="esg_report.md", use_container_width=True)
    if c2.button("↻ Clear & start over", use_container_width=True):
        st.session_state.result = None
        st.rerun()
    
    with st.expander("🔬 View agent conversation log"):
        for i, msg in enumerate(result["messages"]):
            role = type(msg).__name__.replace("Message", "")
            emoji = {"Human": "👤", "AI": "🤖", "Tool": "🔧"}.get(role, "💬")
            st.markdown(f"**{emoji} {role}**")
            content = msg.content if msg.content else "*(tool call — see next message)*"
            st.text(content[:600] + ("..." if len(content) > 600 else ""))
            st.divider()
    
    # Auto-scroll only on first render after analysis
    if st.session_state.get("just_ran"):
        components.html("""
        <script>
            setTimeout(function() {
                const anchor = window.parent.document.getElementById('results');
                if (anchor) anchor.scrollIntoView({behavior: 'smooth', block: 'start'});
            }, 300);
        </script>
        """, height=0)
        st.session_state.just_ran = False


# ============================================================
# FOOTER
# ============================================================
st.write("")
st.write("")
st.divider()

f1, f2, f3 = st.columns([2, 1, 1])
with f1:
    st.caption("Built with FastAPI · LangGraph · Groq · Streamlit")
    st.caption("*A demo of agentic AI for industrial ESG compliance*")
with f2:
    st.markdown("**Built by Sajan Yerra**")
with f3:
    st.markdown(
        "[![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white)](https://github.com/sajanyerra) "
        "[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sajanyerra/)"
    )