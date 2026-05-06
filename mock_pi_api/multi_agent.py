import os
import requests
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.tools import tool
from langgraph.prebuilt import create_react_agent
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
        "natural_gas": 2.02,
        "diesel": 2.68,
        "coal": 2.42,
    }
    if fuel_type not in factors:
        return f"Unknown fuel. Available: {list(factors.keys())}"
    co2_kg = consumption * factors[fuel_type]
    return f"Scope 1 CO2 emissions: {co2_kg:.2f} kg CO2 ({co2_kg/1000:.3f} metric tons) from {consumption} units of {fuel_type}"

@tool
def check_csrd_compliance(co2_metric_tons, context: str = "asset") -> str:
    """Check CO2 emissions against threshold. co2_metric_tons must be a number."""
    if isinstance(co2_metric_tons, str):
        try:
            co2_metric_tons = eval(co2_metric_tons.replace(" ", ""))
        except:
            return f"Error: Could not parse '{co2_metric_tons}' as number"
    try:
        co2_metric_tons = float(co2_metric_tons)
    except:
        return f"Error: Value is not a number: {co2_metric_tons}"

    threshold = 500.0 if context == "facility" else 100.0
    label = "facility-wide" if context == "facility" else "asset"

    if co2_metric_tons > threshold:
        return f"⚠️ EXCEEDS: {co2_metric_tons:.2f} tCO2 exceeds {label} threshold of {threshold} tCO2"
    return f"✅ COMPLIANT: {co2_metric_tons:.2f} tCO2 is below {label} threshold of {threshold} tCO2"


# ============================================================
# CREATE THE 3 SPECIALIST AGENTS WITH create_react_agent
# ============================================================

# Data Agent
data_agent = create_react_agent(
    llm,
    [list_sensors, get_historical_summary],
    prompt=(
        "You are a Data Retrieval Agent. The WebId is provided in the request — "
        "do NOT call list_sensors. Only call get_historical_summary with the provided WebId. "
        "Return a concise one-line data summary."
    )
)

# ESG Agent
esg_agent = create_react_agent(
    llm,
    [calculate_scope1_emissions, check_csrd_compliance],
    prompt=(
        "You are an ESG Compliance Agent.\n"
        "CRITICAL: When calling check_csrd_compliance, you MUST pass a single float number, NOT a math expression.\n\n"
        "Steps:\n"
        "1. Call calculate_scope1_emissions for each category/fuel type\n"
        "2. WAIT for all results\n"
        "3. SUM the numbers yourself (do the math, get ONE final number)\n"
        "4. Call check_csrd_compliance with ONLY that final float number\n\n"
        "Example:\n"
        "- Calculate: 10.1 kg\n"
        "- Calculate: 4.04 kg\n"
        "- Calculate: 2.68 kg\n"
        "- YOUR SUM: 10.1 + 4.04 + 2.68 = 16.82\n"
        "- THEN call: check_csrd_compliance(16.82, 'facility')\n\n"
        "NEVER pass expressions like '10.1 + 4.04'. Always pass the computed float."
    )
)

# Reporter Agent
reporter_agent = create_react_agent(
    llm,
    [],
    prompt=(
        "You are a Reporting Agent. Write a professional ESG compliance report with these sections: "
        "Executive Summary, Sensor Data, Emissions Calculation, Compliance Status, Recommendations, "
        "Compliance Disclaimer. Keep it concise."
    )
)


# ============================================================
# SUPERVISOR WORKFLOW (LangGraph)
# ============================================================
def call_data_agent(state: MessagesState):
    print("\n🔍 [DATA AGENT] Fetching sensor data...")
    result = data_agent.invoke({"messages": state["messages"]})
    output = result["messages"][-1].content
    return {"messages": state["messages"] + [HumanMessage(content=output)]}


def call_esg_agent(state: MessagesState):
    print("\n🌱 [ESG AGENT] Calculating emissions...")
    result = esg_agent.invoke({"messages": state["messages"]})
    output = result["messages"][-1].content
    return {"messages": state["messages"] + [HumanMessage(content=output)]}


def call_reporter_agent(state: MessagesState):
    print("\n📝 [REPORTER AGENT] Writing report...")
    result = reporter_agent.invoke({"messages": state["messages"]})
    output = result["messages"][-1].content
    return {"messages": state["messages"] + [HumanMessage(content=output)]}


workflow = StateGraph(MessagesState)
workflow.add_node("data", call_data_agent)
workflow.add_node("esg", call_esg_agent)
workflow.add_node("reporter", call_reporter_agent)

workflow.set_entry_point("data")
workflow.add_edge("data", "esg")
workflow.add_edge("esg", "reporter")
workflow.add_edge("reporter", END)

app = workflow.compile()