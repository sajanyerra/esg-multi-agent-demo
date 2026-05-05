import os
import requests
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langchain.agents import create_agent

load_dotenv()

PI_BASE = "http://localhost:8000/piwebapi"


@tool
def list_sensors() -> str:
    """Returns a list of all available sensor tags with their WebIds. ALWAYS call this FIRST to find the correct WebId before fetching values."""
    points = requests.get(f"{PI_BASE}/points").json()["Items"]
    return "\n".join([f"Name={p['Name']} | WebId={p['WebId']} | Desc={p['Descriptor']}" for p in points])


@tool
def get_current_value(webid: str) -> str:
    """Get the current real-time value of a sensor. You MUST use a real WebId obtained from list_sensors first."""
    data = requests.get(f"{PI_BASE}/streams/{webid}/value").json()
    return f"Value: {data['Value']} {data['UnitsAbbreviation']} at {data['Timestamp']}"


llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"))

agent = create_agent(
    model=llm,
    tools=[list_sensors, get_current_value],
    system_prompt=(
        "You are an industrial data assistant. "
        "To answer any question about a sensor, you MUST first call list_sensors "
        "to find the exact WebId, then call get_current_value with that real WebId. "
        "NEVER make up or guess a WebId."
    )
)

result = agent.invoke({
    "messages": [{"role": "user", "content": "What is the current Boiler A Temperature?"}]
})

print("\n=== FINAL ANSWER ===")
print(result["messages"][-1].content)