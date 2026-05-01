import hashlib
from typing import Dict, List, Optional
from models import PIPoint
from data_generator import TagSimulator


def generate_webid(name: str) -> str:
    hash_obj = hashlib.md5(name.encode())
    return f"F1DP{hash_obj.hexdigest()[:28].upper()}"


TAG_DEFINITIONS = [
    {"name": "SINUSOID", "desc": "12 Hour Sine Wave", "units": "",
     "min": 0, "max": 100, "pattern": "sine", "type": "Float32"},
    {"name": "CDT158", "desc": "Atmospheric Tower OH Vapor", "units": "DEGF",
     "min": 50, "max": 250, "pattern": "sine", "type": "Float32"},
    {"name": "BA:TEMP.1", "desc": "Boiler A Temperature", "units": "DEGF",
     "min": 200, "max": 800, "pattern": "random_walk", "type": "Float32"},
    {"name": "BA:CONC.1", "desc": "Boiler A Concentration", "units": "%",
     "min": 0, "max": 100, "pattern": "sine", "type": "Float32"},
    {"name": "BA:LEVEL.1", "desc": "Boiler A Level", "units": "FT",
     "min": 0, "max": 50, "pattern": "random_walk", "type": "Float32"},
    {"name": "BA:PHASE.1", "desc": "Boiler A Phase Status", "units": "",
     "min": 0, "max": 4, "pattern": "step", "type": "Int32"},
    {"name": "FIC101.PV", "desc": "Feed Flow Controller PV", "units": "GPM",
     "min": 0, "max": 500, "pattern": "random_walk", "type": "Float32"},
    {"name": "PIC201.PV", "desc": "Reactor Pressure", "units": "PSI",
     "min": 100, "max": 300, "pattern": "sine", "type": "Float32"},
    {"name": "TIC301.PV", "desc": "Reactor Temperature", "units": "DEGC",
     "min": 150, "max": 350, "pattern": "random_walk", "type": "Float32"},
    {"name": "LIC401.PV", "desc": "Tank Level", "units": "%",
     "min": 10, "max": 95, "pattern": "ramp", "type": "Float32"},
    {"name": "FT-001", "desc": "Crude Oil Inlet Flow", "units": "BBL/HR",
     "min": 1000, "max": 5000, "pattern": "random_walk", "type": "Float32"},
    {"name": "FT-002", "desc": "Naphtha Outlet Flow", "units": "BBL/HR",
     "min": 200, "max": 1500, "pattern": "sine", "type": "Float32"},
    {"name": "PWR.MAIN.MW", "desc": "Main Generator Output", "units": "MW",
     "min": 50, "max": 500, "pattern": "random_walk", "type": "Float32"},
    {"name": "PWR.MAIN.KV", "desc": "Main Bus Voltage", "units": "kV",
     "min": 13.0, "max": 14.5, "pattern": "sine", "type": "Float32"},
    {"name": "PUMP.P101.STATUS", "desc": "Pump P-101 Status", "units": "",
     "min": 0, "max": 1, "pattern": "step", "type": "Digital"},
    {"name": "VALVE.V201.POS", "desc": "Valve V-201 Position", "units": "%",
     "min": 0, "max": 100, "pattern": "step", "type": "Float32"},
]


class PIDatabase:
    def __init__(self):
        self.points: Dict[str, PIPoint] = {}
        self.simulators: Dict[str, TagSimulator] = {}
        self.points_by_webid: Dict[str, PIPoint] = {}
        self._initialize()

    def _initialize(self):
        for idx, tag_def in enumerate(TAG_DEFINITIONS, start=1):
            name = tag_def["name"]
            webid = generate_webid(name)

            point = PIPoint(
                WebId=webid,
                Id=idx,
                Name=name,
                Path=f"\\\\MOCK-PI-SERVER\\{name}",
                Descriptor=tag_def["desc"],
                PointType=tag_def["type"],
                EngineeringUnits=tag_def["units"],
                Step=(tag_def["pattern"] == "step"),
                Links={
                    "Self": f"/piwebapi/points/{webid}",
                    "Value": f"/piwebapi/streams/{webid}/value",
                    "RecordedData": f"/piwebapi/streams/{webid}/recorded",
                    "InterpolatedData": f"/piwebapi/streams/{webid}/interpolated",
                }
            )

            simulator = TagSimulator(
                name=name,
                min_val=tag_def["min"],
                max_val=tag_def["max"],
                units=tag_def["units"],
                pattern=tag_def["pattern"]
            )

            self.points[name] = point
            self.points_by_webid[webid] = point
            self.simulators[webid] = simulator

    def get_point_by_webid(self, webid):
        return self.points_by_webid.get(webid)

    def get_simulator_by_webid(self, webid):
        return self.simulators.get(webid)

    def search_points(self, name_filter="*"):
        if name_filter == "*" or not name_filter:
            return list(self.points.values())
        pattern = name_filter.replace("*", "").upper()
        return [p for p in self.points.values() if pattern in p.Name.upper()]


pi_db = PIDatabase()