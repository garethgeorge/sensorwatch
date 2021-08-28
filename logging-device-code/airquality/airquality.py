import time 
import requests
import json
import os
from pms5003 import PMS5003

api_key = os.environ.get("API_KEY")

# Configure the PMS5003 for Enviro+
pms5003 = PMS5003(
    device='/dev/ttyAMA0',
    baudrate=9600,
    pin_enable=22,
    pin_reset=27
)

sensor_name_prefix = "aq_ds80_"
pms5003_sensor_names = [sensor_name_prefix + sn for sn in [
    "PM1.0_ultrafine"
    "PM2.5_combust_organ_metals",
    "PM10_allergens",
    "PM1.0_atmos_env",
    "PM2.5_atmos_env",
    "PM10_atmos_env",
    "0.3um_per_1L_air",
    "0.5um_per_1L_air",
    "1.0um_per_1L_air",
    "2.5um_per_1L_air",
    "5.0um_per_1L_air",
    "10um_per_1L_air",
]]

try:
    while True:
        # TODO: convert with https://pypi.org/project/python-aqi/
        data = pms5003.read()
        print(data)
        
        records = []
        for val, sensor_id in zip(data.data, pms5003_sensor_names):
            record = {
                "sensor_id": sensor_id,
                "value": str(val),
            }
            records.append(record)
        print(json.dumps(records, indent=2))
        print("issuing request to report data")
        headers = {
                'content-type': 'application/json',
                'X-Api-Key': api_key
        }
        r = requests.post("https://3e2jlccb1k.execute-api.us-east-1.amazonaws.com/dev/report-sensor-data", json={"records": records}, headers=headers)
        print("posted data, response: " + str(r))
        print("waiting 5 minutes to report airquality again")
        time.sleep(5 * 60)
except KeyboardInterrupt:
    pass

