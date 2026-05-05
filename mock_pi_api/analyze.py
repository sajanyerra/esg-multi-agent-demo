import requests
import pandas as pd
import matplotlib.pyplot as plt

BASE_URL = "http://localhost:8000/piwebapi"

# 1. Get list of all tags
print("Fetching tag list...")
points = requests.get(f"{BASE_URL}/points").json()["Items"]
print(f"Found {len(points)} tags:\n")
for p in points:
    print(f"  - {p['Name']}: {p['Descriptor']}")

# 2. Pick the SINUSOID tag and get last 6 hours of data
sinusoid = next(p for p in points if p["Name"] == "SINUSOID")
webid = sinusoid["WebId"]

print("\nFetching 6 hours of SINUSOID data...")
data = requests.get(
    f"{BASE_URL}/streams/{webid}/interpolated",
    params={"startTime": "*-6h", "endTime": "*", "interval": "1m"}
).json()["Items"]

# 3. Convert to a table
df = pd.DataFrame(data)
df["Timestamp"] = pd.to_datetime(df["Timestamp"])
df = df.set_index("Timestamp")

print(f"\nGot {len(df)} data points")
print("\nFirst 5 rows:")
print(df.head())

print("\nStatistics:")
print(df["Value"].describe())

# 4. Save to CSV
df.to_csv("sinusoid_data.csv")
print("\nSaved to sinusoid_data.csv")

# 5. Make a chart
df["Value"].plot(figsize=(12, 5), title="SINUSOID - Last 6 Hours")
plt.ylabel("Value")
plt.grid(True)
plt.tight_layout()
plt.savefig("sinusoid_plot.png")
plt.show()
print("Chart saved as sinusoid_plot.png")