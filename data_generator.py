import numpy as np
import math
from datetime import datetime, timedelta
from typing import List
from models import PIValue


class TagSimulator:
    def __init__(self, name, min_val, max_val, units, pattern="sine", noise=0.02):
        self.name = name
        self.min_val = min_val
        self.max_val = max_val
        self.units = units
        self.pattern = pattern
        self.noise = noise
        self.range = max_val - min_val
        self.midpoint = (max_val + min_val) / 2
        self._last_value = self.midpoint

    def generate_value(self, timestamp: datetime) -> float:
        t = timestamp.timestamp()

        if self.pattern == "sine":
            value = self.midpoint + (self.range / 2) * 0.7 * math.sin(t / 600)
            value += np.random.normal(0, self.range * self.noise)
        elif self.pattern == "random_walk":
            delta = np.random.normal(0, self.range * 0.01)
            value = self._last_value + delta
            value = max(self.min_val, min(self.max_val, value))
            self._last_value = value
        elif self.pattern == "step":
            step_index = int(t / 600) % 5
            steps = [0.2, 0.4, 0.6, 0.8, 0.5]
            value = self.min_val + self.range * steps[step_index]
            value += np.random.normal(0, self.range * self.noise)
        elif self.pattern == "ramp":
            phase = (t % 3600) / 3600
            value = self.min_val + self.range * phase
            value += np.random.normal(0, self.range * self.noise)
        else:
            value = self.midpoint + np.random.normal(0, self.range * self.noise)

        return round(max(self.min_val, min(self.max_val, value)), 4)

    def generate_series(self, start_time, end_time, interval_seconds=60) -> List[PIValue]:
        values = []
        current = start_time
        while current <= end_time:
            val = self.generate_value(current)
            values.append(PIValue(
                Timestamp=current.isoformat() + "Z",
                Value=val,
                UnitsAbbreviation=self.units,
                Good=True
            ))
            current += timedelta(seconds=interval_seconds)
        return values

    def get_current_value(self) -> PIValue:
        now = datetime.utcnow()
        val = self.generate_value(now)
        return PIValue(
            Timestamp=now.isoformat() + "Z",
            Value=val,
            UnitsAbbreviation=self.units,
            Good=True
        )