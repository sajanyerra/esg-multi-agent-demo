from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from multi_agent import app as agent_app
import requests
import os
from dotenv import load_dotenv

load_dotenv()

PI_BASE = os.getenv("PI_BASE", "http://localhost:8000") + "/piwebapi"

api = FastAPI(title="ESG Agent API")

api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalysisRequest(BaseModel):
    asset_name: str
    asset_descriptor: str
    webid: str
    fuel_type: str
    fuel_amount: float
    hours: int


class FacilityRequest(BaseModel):
    hours: int
    fuel_assumptions: dict  # category -> {fuel_type, amount}


@api.get("/sensors")
def get_sensors():
    """Get all sensors from PI server"""
    try:
        r = requests.get(f"{PI_BASE}/points", timeout=10)
        return r.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"PI Server unreachable: {e}")


@api.get("/sensors/{webid}/value")
def get_sensor_value(webid: str):
    """Get current value of a sensor"""
    try:
        r = requests.get(f"{PI_BASE}/streams/{webid}/value", timeout=10)
        return r.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
    
@api.get("/sensors/values")
def get_all_sensor_values():
    """Get current values for all sensors in one call"""
    try:
        points = requests.get(f"{PI_BASE}/points", timeout=10).json()["Items"]
        values = {}
        for point in points:
            try:
                r = requests.get(f"{PI_BASE}/streams/{point['WebId']}/value", timeout=5)
                data = r.json()
                values[point['WebId']] = {
                    "Value": data.get("Value"),
                    "Timestamp": data.get("Timestamp"),
                    "UnitsAbbreviation": data.get("UnitsAbbreviation", ""),
                }
            except:
                values[point['WebId']] = {"Value": "N/A"}
        return values
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@api.post("/analyze")
def run_analysis(req: AnalysisRequest):
    """Run single asset ESG analysis"""
    unit_map = {"natural_gas": "m³", "diesel": "liters", "coal": "kg"}
    question = (
        f"Analyze {req.asset_descriptor} (sensor {req.asset_name}) "
        f"over the last {req.hours} hours. "
        f"Assume {req.fuel_amount} {unit_map.get(req.fuel_type, 'units')} "
        f"of {req.fuel_type.replace('_', ' ')} was consumed. "
        f"Calculate Scope 1 emissions and check CSRD compliance."
    )
    try:
        result = agent_app.invoke({"messages": [HumanMessage(content=question)]})
        messages = []
        for msg in result["messages"]:
            role = type(msg).__name__.replace("Message", "")
            messages.append({
                "role": role,
                "content": msg.content or "(tool call)"
            })
        return {
            "report": result["messages"][-1].content,
            "messages": messages
        }
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=str(e) + "\n" + traceback.format_exc())


@api.post("/analyze/facility")
def run_facility_analysis(req: FacilityRequest):
    """Run full facility ESG analysis across all sensors"""
    try:
        sensors = requests.get(f"{PI_BASE}/points", timeout=10).json()["Items"]
        
        # Categorize sensors
        def categorize(name):
            n = name.upper()
            if "BA:" in n or "BOILER" in n: return "Boilers"
            if "REACTOR" in n or "PIC" in n or "TIC" in n: return "Reactors"
            if "TANK" in n or "LIC" in n or "LEVEL" in n: return "Tanks"
            if "FT-" in n or "FIC" in n or "FLOW" in n: return "Flow Meters"
            if "PWR" in n or "POWER" in n or "GEN" in n: return "Power Systems"
            if "PUMP" in n or "VALVE" in n: return "Equipment"
            return "Other"

        categories = {}
        for s in sensors:
            cat = categorize(s["Name"])
            categories.setdefault(cat, []).append(s)

        # Build facility-wide question
        lines = [f"Run a full facility ESG audit for the last {req.hours} hours.\n"]
        lines.append("Here are the fuel consumption assumptions per category:\n")
        
        for cat, assumption in req.fuel_assumptions.items():
            lines.append(
                f"- {cat}: {assumption['amount']} "
                f"{assumption['fuel_type'].replace('_', ' ')} consumed"
            )
        
        lines.append(f"\nThe facility has these sensor categories: {list(categories.keys())}")
        lines.append(
            "\nFor each category, calculate Scope 1 emissions using the fuel "
            "assumptions above. Sum all emissions for a facility total. "
            "Check if the TOTAL exceeds the CSRD threshold of 100 metric tons CO2. "
            "Report each category separately then give a facility-wide verdict."
        )

        question = "\n".join(lines)
        result = agent_app.invoke({"messages": [HumanMessage(content=question)]})
        
        messages = []
        for msg in result["messages"]:
            role = type(msg).__name__.replace("Message", "")
            messages.append({
                "role": role,
                "content": msg.content or "(tool call)"
            })

        return {
            "report": result["messages"][-1].content,
            "messages": messages,
            "categories": list(categories.keys())
        }
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=str(e) + "\n" + traceback.format_exc())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("agent_api:api", host="0.0.0.0", port=8001, reload=True)