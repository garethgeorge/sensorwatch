import { computeAqi } from "airnow-aqi";
import { GENERATED_CHART_RESOLUTION } from "./constants";

interface Datapoint {
  timestamp: number;
  value: number;
}

interface Dataset {
  sensorId: string;
  datapoints: Datapoint[];
}

interface Chart {
  name: string;
  datapoints: Datapoint[];
  showByDefault: boolean;
}

type ChartGenerator = (datasets: { [sensorId: string]: Dataset }) => Chart[];

const chartGenerators: ChartGenerator[] = [
  /**
   * generate AQI charts, these show by default
   */
  (datasets) => {
    const sensorNameMap = {
      "aq_ds80_PM2.5_atmos_env": {
        type: "pm2.5",
        name: "AQI based 2.5um particulate matter",
      },
      aq_ds80_PM10_atmos_env: {
        type: "pm10",
        name: "AQI based on 10um particulate matter",
      },
    };

    const charts: Chart[] = [];
    for (const dataset of Object.values(datasets)) {
      const cfg = sensorNameMap[dataset.sensorId];
      if (!cfg) {
        continue;
      }

      charts.push({
        name: cfg.name,
        showByDefault: true,
        datapoints: dataset.datapoints.map((datapoint) => {
          return {
            timestamp: datapoint.timestamp,
            value: computeAqi([
              {
                type: cfg.type,
                ppm: datapoint.value,
              },
            ]),
          };
        }),
      });
    }

    return charts;
  },

  (datasets) => {
    const sensorNameMap = {
      // "aq_ds80_0.5um_per_1L_air": "aq_ds80_0.5um_per_1L_air",
      // "aq_ds80_1.0um_per_1L_air": "aq_ds80_1.0um_per_1L_air",
      "aq_ds80_PM2.5_atmos_env": "aq_ds80_PM2.5_atmos_env",
      aq_ds80_PM10_atmos_env: "aq_ds80_PM10_atmos_env",
      "aq_ds80_2.5um_per_1L_air": "aq_ds80_2.5um_per_1L_air",
      aq_ds80_10um_per_1L_air: "aq_ds80_10um_per_1L_air",
      // "aq_ds80_0.3um_per_1L_air": "aq_ds80_0.3um_per_1L_air",
      solar_voltage: "solar voltage",
    };

    const chartsToShowByDefault = {
      solar_voltage: true,
    };

    const charts: Chart[] = [];
    for (const dataset of Object.values(datasets)) {
      const name = sensorNameMap[dataset.sensorId] || dataset.sensorId;

      charts.push({
        showByDefault: chartsToShowByDefault[dataset.sensorId],
        name: name + " (raw)",
        datapoints: dataset.datapoints,
      });
    }

    return charts;
  },

  (datasets) => {
    const sensorNameMap = {
      hydro_temp_01193a651085: "temperature probe solar enclosure (F)",
      hydro_temp_01193a5b6f21: "temperature probe ambient air (F)",
      hydro_temp_01193a42d661: "temperature probe water tank (F)",
    };

    const charts: Chart[] = [];
    for (const dataset of Object.values(datasets)) {
      const name = sensorNameMap[dataset.sensorId];
      if (!name) {
        continue;
      }

      charts.push({
        showByDefault: true,
        name,
        datapoints: dataset.datapoints.map((datapoint) => {
          return {
            timestamp: datapoint.timestamp,
            value: datapoint.value * 1.8 + 32, // to farenheight
          };
        }),
      });
    }

    return charts;
  },
];

export const buildCharts = (data: any) => {
  const datasets: { [sensorId: string]: Dataset } = {};
  for (const sensorId of Object.keys(data["sensor_data"])) {
    const sensorData = data["sensor_data"][sensorId];
    const timestamps = sensorData["data_epoch_timestamps"];
    const values = sensorData["data_values"];
    const datapoints: Datapoint[] = [];

    if (timestamps.length != values.length) {
      throw new Error("UH OH. THERE IS A MISMATCH :(");
    }

    for (let i = 0; i < timestamps.length; ++i) {
      datapoints.push({
        timestamp: timestamps[i],
        value: parseFloat(values[i]),
      });
    }

    datapoints.sort((a, b) => {
      return a.timestamp - b.timestamp;
    });

    datasets[sensorId] = {
      datapoints,
      sensorId,
    };
  }

  const charts: Chart[] = [];
  for (const gen of chartGenerators) {
    for (const chart of gen(datasets)) {
      charts.push(chart);
    }
  }

  charts.sort((a, b) => {
    return a.name > b.name ? 1 : -1;
  });

  return {
    datasets,
    charts,
  };
};
