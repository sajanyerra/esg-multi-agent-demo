from pydantic import BaseModel
from typing import List, Any, Dict


class PIValue(BaseModel):
    Timestamp: str
    Value: Any
    UnitsAbbreviation: str = ""
    Good: bool = True
    Questionable: bool = False
    Substituted: bool = False
    Annotated: bool = False


class PIPoint(BaseModel):
    WebId: str
    Id: int
    Name: str
    Path: str
    Descriptor: str = ""
    PointClass: str = "classic"
    PointType: str = "Float32"
    DigitalSetName: str = ""
    EngineeringUnits: str = ""
    Step: bool = False
    Future: bool = False
    DisplayDigits: int = -5
    Links: Dict[str, str] = {}


class DataServer(BaseModel):
    WebId: str
    Id: str
    Name: str
    Path: str
    IsConnected: bool = True
    ServerVersion: str = "3.4.445.688"
    ServerTime: str
    Links: Dict[str, str] = {}