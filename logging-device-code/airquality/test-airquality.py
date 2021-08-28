from pms5003 import PMS5003

# Configure the PMS5003 for Enviro+
pms5003 = PMS5003(
    device='/dev/ttyAMA0',
    baudrate=9600,
    pin_enable=22,
    pin_reset=27
)

try:
    while True:
        # TODO: convert with https://pypi.org/project/python-aqi/
        data = pms5003.read()
        print(data)
        print(data.data)

except KeyboardInterrupt:
    pass

