import os
import requests
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.tools import tool
from langchain.agents import create_agent

load_dotenv()

PI_BASE = "http://localhost:8000/piwebapi"


@tool
def list_sensors() -> str:
    """Returns all sensor tags with WebIds. ALWAYS call this FIRST."""
    points = requests.get(f"{PI_BASE}/points").json()["Items"]
    return "\n".join([f"Name={p['Name']} | WebId={p['WebId']} | Desc={p['Descriptor']}" for p in points])


@tool
def get_current_value(webid: str) -> str:
    """Get the current real-time value of a sensor by WebId."""
    r = requests.get(f"{PI_BASE}/streams/{webid}/value")
    if r.status_code != 200:
        return f"Error: status {r.status_code}"
    d = r.json()
    return f"Value: {d['Value']} {d.get('UnitsAbbreviation','')} at {d['Timestamp']}"


@tool
def get_historical_summary(webid: str, hours: int = 1) -> str:
    """Get min/max/avg for a sensor over the last N hours."""
    r = requests.get(
        f"{PI_BASE}/streams/{webid}/interpolated",
        params={"startTime": f"*-{hours}h", "endTime": "*", "interval": "1m"}
    )
    if r.status_code != 200:
        return f"Error: status {r.status_code}"
    items = r.json().get("Items", [])
    values = [d["Value"] for d in items if isinstance(d.get("Value"), (int, float))]
    if not values:
        return "No numeric data."
    units = items[0].get("UnitsAbbreviation", "")
    return f"Last {hours}h: Min={min(values):.2f} | Max={max(values):.2f} | Avg={sum(values)/len(values):.2f} {units}"


llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"))

agent = create_agent(
    model=llm,
    tools=[list_sensors, get_current_value, get_historical_summary],
    system_prompt="You are an industrial data assistant. ALWAYS call list_sensors FIRST to get the correct WebId, then call other tools. NEVER guess a WebId."
)

question = "Which sensor has the highest value?"

result = agent.invoke({"messages": [{"role": "user", "content": question}]})

print("\n=== FINAL ANSWER ===")
print(result["messages"][-1].content)