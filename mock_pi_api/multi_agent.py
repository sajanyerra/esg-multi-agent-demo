import os
import requests
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.tools import tool
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
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
def check_csrd_compliance(co2_metric_tons, context: str = "asset") -> str:
    """Check CO2 emissions against threshold. co2_metric_tons must be a number."""
    
    # Handle string expressions - EVALUATE THEM
    if isinstance(co2_metric_tons, str):
        # Remove spaces and evaluate
        try:
            co2_metric_tons = eval(co2_metric_tons.replace(" ", ""))
        except:
            return f"Error: Could not parse '{co2_metric_tons}' as number"
    
    # Convert to float
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
# CREATE THE 3 SPECIALIST AGENTS WITH AgentExecutor
# ============================================================

# Data Agent
data_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a Data Retrieval Agent. The WebId is provided in the request — do NOT call list_sensors. Only call get_historical_summary with the provided WebId. Return a concise one-line data summary."),
    MessagesPlaceholder(variable_name="messages"),
])
data_agent_runnable = create_tool_calling_agent(llm, [list_sensors, get_historical_summary], data_prompt)
data_agent = AgentExecutor(agent=data_agent_runnable, tools=[list_sensors, get_historical_summary], max_iterations=3, early_stopping_method="force")

# ESG Agent
esg_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an ESG Compliance Agent. 
CRITICAL: When calling check_csrd_compliance, you MUST pass a single float number, NOT a math expression.

Steps:
1. Call calculate_scope1_emissions for each category/fuel type
2. WAIT for all results
3. SUM the numbers yourself (do the math, get ONE final number)
4. Call check_csrd_compliance with ONLY that final float number

Example:
- Calculate: 10.1 kg
- Calculate: 4.04 kg  
- Calculate: 2.68 kg
- YOUR SUM: 10.1 + 4.04 + 2.68 = 16.82
- THEN call: check_csrd_compliance(16.82, "facility")

NEVER pass expressions like "10.1 + 4.04". Always pass the computed float."""),
    MessagesPlaceholder(variable_name="messages"),
])
esg_agent_runnable = create_tool_calling_agent(llm, [calculate_scope1_emissions, check_csrd_compliance], esg_prompt)
esg_agent = AgentExecutor(agent=esg_agent_runnable, tools=[calculate_scope1_emissions, check_csrd_compliance], max_iterations=8, early_stopping_method="force")

# Reporter Agent
reporter_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a Reporting Agent. Write a professional ESG compliance report with these sections: Executive Summary, Sensor Data, Emissions Calculation, Compliance Status, Recommendations, Compliance Disclaimer. Keep it concise."),
    MessagesPlaceholder(variable_name="messages"),
])
reporter_agent_runnable = create_tool_calling_agent(llm, [], reporter_prompt)
reporter_agent = AgentExecutor(agent=reporter_agent_runnable, tools=[], max_iterations=1, early_stopping_method="force")


# ============================================================
# SUPERVISOR WORKFLOW (LangGraph)
# ============================================================
def call_data_agent(state: MessagesState):
    print("\n🔍 [DATA AGENT] Fetching sensor data...")
    result = data_agent.invoke({"messages": state["messages"]})
    return {"messages": state["messages"] + [HumanMessage(content=result["output"])]}


def call_esg_agent(state: MessagesState):
    print("\n🌱 [ESG AGENT] Calculating emissions...")
    result = esg_agent.invoke({"messages": state["messages"]})
    return {"messages": state["messages"] + [HumanMessage(content=result["output"])]}


def call_reporter_agent(state: MessagesState):
    print("\n📝 [REPORTER AGENT] Writing report...")
    result = reporter_agent.invoke({"messages": state["messages"]})
    return {"messages": state["messages"] + [HumanMessage(content=result["output"])]}


workflow = StateGraph(MessagesState)
workflow.add_node("data", call_data_agent)
workflow.add_node("esg", call_esg_agent)
workflow.add_node("reporter", call_reporter_agent)

workflow.set_entry_point("data")
workflow.add_edge("data", "esg")
workflow.add_edge("esg", "reporter")
workflow.add_edge("reporter", END)

app = workflow.compile()