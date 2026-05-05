import os
import requests
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.tools import tool
from langchain.agents import create_agent
from langgraph.graph import StateGraph, END, MessagesState
from langchain_core.messages import HumanMessage

load_dotenv()

PI_BASE = os.getenv("PI_BASE", "http://localhost:8000") + "/piwebapi"
llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"))


# ============================================================
# TOOLS FOR DATA AGENT
# ============================================================
@tool
def list_sensors() -> str:
    """Returns all sensor tags with WebIds."""
    points = requests.get(f"{PI_BASE}/points").json()["Items"]
    return "\n".join([f"Name={p['Name']} | WebId={p['WebId']} | Desc={p['Descriptor']} | Units={p['EngineeringUnits']}" for p in points])


@tool
def get_historical_summary(webid: str, hours: int = 24) -> str:
    """Get min/max/avg for a sensor over the last N hours."""
    r = requests.get(
        f"{PI_BASE}/streams/{webid}/interpolated",
        params={"startTime": f"*-{hours}h", "endTime": "*", "interval": "5m"}
    )
    items = r.json().get("Items", [])
    values = [d["Value"] for d in items if isinstance(d.get("Value"), (int, float))]
    if not values:
        return "No data."
    units = items[0].get("UnitsAbbreviation", "")
    avg = sum(values)/len(values)
    return f"Min={min(values):.2f} | Max={max(values):.2f} | Avg={avg:.2f} {units} | Readings={len(values)}"


# ============================================================
# TOOLS FOR ESG AGENT
# ============================================================
@tool
def calculate_scope1_emissions(fuel_type: str, consumption: float) -> str:
    """Calculate Scope 1 CO2 emissions. fuel_type: 'natural_gas' (units: m³) or 'diesel' (units: liters). consumption: amount used."""
    factors = {
        "natural_gas": 2.02,  # kg CO2 per m³
        "diesel": 2.68,       # kg CO2 per liter
        "coal": 2.42,         # kg CO2 per kg
    }
    if fuel_type not in factors:
        return f"Unknown fuel. Available: {list(factors.keys())}"
    co2_kg = consumption * factors[fuel_type]
    return f"Scope 1 CO2 emissions: {co2_kg:.2f} kg CO2 ({co2_kg/1000:.3f} metric tons) from {consumption} units of {fuel_type}"


@tool
def check_csrd_compliance(co2_metric_tons: float, context: str = "asset") -> str:
    """Check CO2 emissions against a context-appropriate demo threshold.
    context: 'asset' for single asset analysis (threshold: 100 tCO2)
             'facility' for full facility audit (threshold: 500 tCO2)
    These are internal demo baselines, NOT official CSRD limits.
    Real CSRD applies at the company level for organisations with
    1,000+ employees or €450M+ turnover — not per asset or tonnage cutoff.
    """
    threshold = 500.0 if context == "facility" else 100.0
    label = "facility-wide demo baseline" if context == "facility" else "per-asset demo baseline"

    if co2_metric_tons > threshold:
        return (
            f"⚠️ EXCEEDS THRESHOLD: {co2_metric_tons:.2f} tCO2 is above the {label} of "
            f"{threshold} tCO2. This warrants internal review. "
            f"NOTE: This is not an official CSRD verdict. CSRD compliance is assessed at "
            f"the organisational level, not per asset or emissions total."
        )
    return (
        f"✅ WITHIN THRESHOLD: {co2_metric_tons:.2f} tCO2 is below the {label} of "
        f"{threshold} tCO2. "
        f"NOTE: This is not an official CSRD verdict. CSRD compliance is assessed at "
        f"the organisational level, not per asset or emissions total."
    )


# ============================================================
# CREATE THE 3 SPECIALIST AGENTS
# ============================================================
data_agent = create_agent(
    model=llm,
    tools=[list_sensors, get_historical_summary],
    system_prompt="ou are a Data Retrieval Agent. The WebId is provided in the request — do NOT call list_sensors. Only call get_historical_summary with the provided WebId. Return a concise one-line data summary."
)

esg_agent = create_agent(
    model=llm,
    tools=[calculate_scope1_emissions, check_csrd_compliance],
system_prompt=(
    "You are an ESG Compliance Agent. You MUST call the calculate_scope1_emissions tool "
    "to calculate emissions — never do your own math or use your own emission factors. "
    "The tool handles all calculations. After getting the result from the tool, call "
    "check_csrd_compliance with the metric tons value. Be precise with the numbers "
    "returned by the tools only."
)
)

reporter_agent = create_agent(
    model=llm,
    tools=[],
    system_prompt=(
        "You are a Reporting Agent writing a professional ESG compliance report. "
        "Use ONLY the actual data from the conversation — do not add generic advice. "
        "\n\nFormat strictly as:\n"
        "## Executive Summary\n(2 sentences with the actual emission number and compliance status)\n\n"
        "## Sensor Data\n(bullet list of actual min/max/avg values fetched)\n\n"
        "## Emissions Calculation\n(show the math: fuel × factor = CO2)\n\n"
        "## Compliance Status\n(state COMPLIANT or NON-COMPLIANT with the actual threshold comparison)\n\n"
        "## Recommendations\n"
        "(Provide 2-3 SPECIFIC recommendations tied to the actual data — e.g., "
        "if avg temp was high, suggest temperature optimization; if emissions were borderline, "
        "suggest fuel switching with specific % reduction targets. NEVER write generic advice "
        "like 'monitor regularly' or 'consider reducing emissions'. "
        "Keep every section to 2-3 lines maximum. Never repeat numbers already stated elsewhere in the report.\n\n"
        "## Compliance Disclaimer\n"
        "Always end the report with this exact section: clarify that the 100 tCO2 threshold "
        "is a demo baseline for internal asset review only, that real CSRD compliance is "
        "assessed at the organizational level, and that this tool models Scope 1 emissions only. "
        "Be concise. Each section should be 2-3 lines maximum. Do not repeat data already stated."
    )
)


# ============================================================
# SUPERVISOR WORKFLOW (LangGraph)
# ============================================================
def call_data_agent(state: MessagesState):
    print("\n🔍 [DATA AGENT] Fetching sensor data...")
    result = data_agent.invoke({"messages": state["messages"]})
    return {"messages": [result["messages"][-1]]}


def call_esg_agent(state: MessagesState):
    print("\n🌱 [ESG AGENT] Calculating emissions...")
    result = esg_agent.invoke({"messages": state["messages"]})
    return {"messages": [result["messages"][-1]]}


def call_reporter_agent(state: MessagesState):
    print("\n📝 [REPORTER AGENT] Writing report...")
    result = reporter_agent.invoke({"messages": state["messages"]})
    return {"messages": [result["messages"][-1]]}


workflow = StateGraph(MessagesState)
workflow.add_node("data", call_data_agent)
workflow.add_node("esg", call_esg_agent)
workflow.add_node("reporter", call_reporter_agent)

workflow.set_entry_point("data")
workflow.add_edge("data", "esg")
workflow.add_edge("esg", "reporter")
workflow.add_edge("reporter", END)

app = workflow.compile()


# ============================================================
# RUN IT
# ============================================================
if __name__ == "__main__":
    question = (
        "Analyze Boiler A Temperature data over the last 24 hours. "
        "Assume the boiler consumed 5000 m³ of natural gas during this period. "
        "Calculate Scope 1 emissions and check CSRD compliance."
    )

    print(f"\n💬 USER QUESTION:\n{question}\n")
    print("=" * 60)

    result = app.invoke({"messages": [HumanMessage(content=question)]})

    print("\n" + "=" * 60)
    print("📊 FINAL REPORT")
    print("=" * 60)
    print(result["messages"][-1].content)