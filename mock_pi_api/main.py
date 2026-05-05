from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from datetime import datetime, timedelta
from dateutil import parser as date_parser
from typing import List
import re

from models import DataServer
from pi_database import pi_db
import config

app = FastAPI(
    title="Mock PI Web API",
    version=config.PI_WEB_API_VERSION,
    docs_url="/piwebapi/docs",
)

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)


def parse_pi_time(time_str):
    if not time_str or time_str == "*":
        return datetime.utcnow()
    match = re.match(r"\*\s*-\s*(\d+)\s*([smhdwy])", time_str.lower())
    if match:
        amount = int(match.group(1))
        unit = match.group(2)
        unit_map = {"s": "seconds", "m": "minutes", "h": "hours", "d": "days", "w": "weeks"}
        if unit == "y":
            return datetime.utcnow() - timedelta(days=amount * 365)
        return datetime.utcnow() - timedelta(**{unit_map[unit]: amount})
    try:
        return date_parser.parse(time_str).replace(tzinfo=None)
    except Exception:
        return datetime.utcnow()


# ============================================================
# LANDING PAGE
# ============================================================
@app.get("/", response_class=HTMLResponse)
def landing_page():
    """Professional landing page for the PI Server"""
    sensor_count = len(pi_db.points)

    sensor_rows = ""
    for point in list(pi_db.points.values())[:50]:
        sim = pi_db.get_simulator_by_webid(point.WebId)
        current = sim.get_current_value() if sim else None
        value_str = f"{current.Value:.2f} {point.EngineeringUnits}" if current else "—"
        sensor_rows += f"""
        <tr>
            <td><code>{point.Name}</code></td>
            <td>{point.Descriptor}</td>
            <td>{point.PointType}</td>
            <td>{point.EngineeringUnits or '—'}</td>
            <td class="value-cell">{value_str}</td>
            <td><code class="webid">{point.WebId[:16]}…</code></td>
        </tr>
        """

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta http-equiv="refresh" content="5">
        <meta charset="UTF-8">
        <title>PI Server — Web API</title>
        <style>
            * {{ box-sizing: border-box; margin: 0; padding: 0; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: #f4f6f8; color: #1a1a1a; line-height: 1.5;
            }}
            .header {{
                background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
                color: white; padding: 2.5rem 2rem;
                border-bottom: 4px solid #4a90c2;
            }}
            .header-content {{ max-width: 1200px; margin: 0 auto; }}
            .header h1 {{ font-size: 2rem; font-weight: 600; letter-spacing: -0.5px; }}
            .header p {{ opacity: 0.85; margin-top: 0.5rem; font-size: 0.95rem; }}
            .status-badge {{
                display: inline-block; background: #48bb78; color: white;
                padding: 0.25rem 0.75rem; border-radius: 12px;
                font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem;
                text-transform: uppercase; letter-spacing: 0.5px;
            }}
            .container {{ max-width: 1200px; margin: 0 auto; padding: 2rem; }}
            .stats {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem; margin-bottom: 2rem;
            }}
            .stat-card {{
                background: white; padding: 1.25rem 1.5rem;
                border-radius: 8px; border-left: 4px solid #4a90c2;
                box-shadow: 0 1px 3px rgba(0,0,0,0.06);
            }}
            .stat-label {{
                font-size: 0.75rem; color: #718096;
                text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;
            }}
            .stat-value {{
                font-size: 1.75rem; font-weight: 700;
                color: #1a1a1a; margin-top: 0.25rem;
            }}
            .section {{
                background: white; padding: 1.5rem;
                border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
                margin-bottom: 1.5rem;
            }}
            .section h2 {{
                font-size: 1.15rem; font-weight: 600;
                margin-bottom: 1rem; color: #2d3748;
            }}
            .endpoints {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 0.75rem;
            }}
            .endpoint {{
                padding: 0.75rem 1rem; background: #f7fafc;
                border-radius: 6px; border: 1px solid #e2e8f0;
                font-family: 'SF Mono', Consolas, monospace;
                font-size: 0.85rem; transition: all 0.2s;
                text-decoration: none; color: #2c5282; display: block;
            }}
            .endpoint:hover {{
                background: #edf2f7; border-color: #4a90c2;
                transform: translateX(2px);
            }}
            .endpoint .method {{
                display: inline-block; background: #4a90c2; color: white;
                padding: 0.1rem 0.5rem; border-radius: 3px;
                font-size: 0.7rem; font-weight: 700; margin-right: 0.5rem;
            }}
            table {{ width: 100%; border-collapse: collapse; font-size: 0.875rem; }}
            th {{
                text-align: left; padding: 0.6rem 0.75rem;
                background: #f7fafc; color: #4a5568; font-weight: 600;
                font-size: 0.75rem; text-transform: uppercase;
                letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;
            }}
            td {{ padding: 0.6rem 0.75rem; border-bottom: 1px solid #edf2f7; }}
            tr:hover td {{ background: #f7fafc; }}
            code {{
                background: #edf2f7; padding: 0.1rem 0.4rem;
                border-radius: 3px; font-family: 'SF Mono', Consolas, monospace;
                font-size: 0.85em; color: #2c5282;
            }}
            .webid {{ color: #718096; font-size: 0.75rem; }}
            .value-cell {{ font-weight: 600; color: #2f855a; }}
            .footer {{
                text-align: center; padding: 2rem;
                color: #a0aec0; font-size: 0.85rem;
            }}
            .pulse {{
                display: inline-block; width: 8px; height: 8px;
                background: #48bb78; border-radius: 50%;
                margin-right: 0.4rem; animation: pulse 2s infinite;
            }}
            @keyframes pulse {{
                0%, 100% {{ opacity: 1; }}
                50% {{ opacity: 0.4; }}
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="header-content">
                <h1>PI Server <span class="status-badge"><span class="pulse"></span>Online</span></h1>
                <p>Industrial Data Archive · Web API v{config.PI_WEB_API_VERSION}</p>
            </div>
        </div>
        <div class="container">
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-label">Server Name</div>
                    <div class="stat-value" style="font-size:1.1rem;">{config.PI_SERVER_NAME}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Active Tags</div>
                    <div class="stat-value">{sensor_count}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">API Version</div>
                    <div class="stat-value">{config.PI_WEB_API_VERSION}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Uptime</div>
                    <div class="stat-value" style="color:#48bb78;">●  Live</div>
                </div>
            </div>
            <div class="section">
                <h2>📡 API Endpoints</h2>
                <div class="endpoints">
                    <a href="/piwebapi/docs" class="endpoint"><span class="method">GET</span>/piwebapi/docs (Interactive)</a>
                    <a href="/piwebapi/dataservers" class="endpoint"><span class="method">GET</span>/piwebapi/dataservers</a>
                    <a href="/piwebapi/points" class="endpoint"><span class="method">GET</span>/piwebapi/points</a>
                    <a href="/piwebapi" class="endpoint"><span class="method">GET</span>/piwebapi (System root)</a>
                </div>
            </div>
            <div class="section">
                <h2>🏷️ Tag Database — Live Snapshot</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Tag Name</th><th>Descriptor</th><th>Type</th>
                            <th>Units</th><th>Current Value</th><th>WebID</th>
                        </tr>
                    </thead>
                    <tbody>{sensor_rows}</tbody>
                </table>
            </div>
        </div>
        <div class="footer">
            PI Server Mock · Built for ESG Multi-Agent Demo · 
            <a href="/piwebapi/docs" style="color:#4a90c2;">View API Documentation →</a>
        </div>
    </body>
    </html>
    """


# ============================================================
# API ENDPOINTS
# ============================================================
@app.get("/piwebapi")
def root():
    return {
        "Links": {
            "Self": "/piwebapi/",
            "DataServers": "/piwebapi/dataservers",
            "Points": "/piwebapi/points",
        },
        "ProductTitle": "Mock PI Web API",
        "ProductVersion": config.PI_WEB_API_VERSION,
    }


@app.get("/piwebapi/dataservers")
def list_data_servers():
    return {
        "Items": [
            DataServer(
                WebId=config.PI_SERVER_WEBID,
                Id="abcd1234-5678-90ab-cdef-1234567890ab",
                Name=config.PI_SERVER_NAME,
                Path=f"\\\\{config.PI_SERVER_NAME}",
                IsConnected=True,
                ServerTime=datetime.utcnow().isoformat() + "Z",
            ).dict()
        ]
    }


@app.get("/piwebapi/points")
def list_points(nameFilter: str = Query("*"), maxCount: int = Query(1000)):
    points = pi_db.search_points(nameFilter)[:maxCount]
    return {"Items": [p.dict() for p in points]}


@app.get("/piwebapi/points/{webid}")
def get_point(webid: str):
    point = pi_db.get_point_by_webid(webid)
    if not point:
        raise HTTPException(status_code=404, detail="PI Point not found")
    return point.dict()


@app.get("/piwebapi/streams/{webid}/value")
def get_current_value(webid: str):
    sim = pi_db.get_simulator_by_webid(webid)
    if not sim:
        raise HTTPException(status_code=404, detail="Stream not found")
    return sim.get_current_value().dict()


@app.get("/piwebapi/streams/{webid}/recorded")
def get_recorded_values(
    webid: str,
    startTime: str = Query("*-1h"),
    endTime: str = Query("*"),
    maxCount: int = Query(1000),
):
    sim = pi_db.get_simulator_by_webid(webid)
    if not sim:
        raise HTTPException(status_code=404, detail="Stream not found")
    start = parse_pi_time(startTime)
    end = parse_pi_time(endTime)
    duration = (end - start).total_seconds()
    interval = max(30, int(duration / min(maxCount, 200)))
    values = sim.generate_series(start, end, interval)[:maxCount]
    return {"Items": [v.dict() for v in values]}


@app.get("/piwebapi/streams/{webid}/interpolated")
def get_interpolated_values(
    webid: str,
    startTime: str = Query("*-1h"),
    endTime: str = Query("*"),
    interval: str = Query("1m"),
):
    sim = pi_db.get_simulator_by_webid(webid)
    if not sim:
        raise HTTPException(status_code=404, detail="Stream not found")
    start = parse_pi_time(startTime)
    end = parse_pi_time(endTime)
    match = re.match(r"(\d+)\s*([smhd])", interval.lower())
    if match:
        amount = int(match.group(1))
        unit = match.group(2)
        unit_seconds = {"s": 1, "m": 60, "h": 3600, "d": 86400}
        interval_sec = amount * unit_seconds[unit]
    else:
        interval_sec = 60
    values = sim.generate_series(start, end, interval_sec)
    return {"Items": [v.dict() for v in values]}


if __name__ == "__main__":
    import uvicorn
    print(f"Starting Mock PI Web API on http://localhost:{config.PORT}")
    print(f"Landing: http://localhost:{config.PORT}/")
    print(f"Docs: http://localhost:{config.PORT}/piwebapi/docs")
    print(f"Loaded {len(pi_db.points)} PI Points")
    uvicorn.run("main:app", host=config.HOST, port=config.PORT, reload=True)