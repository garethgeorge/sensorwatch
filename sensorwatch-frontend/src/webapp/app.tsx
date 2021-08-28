import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./sass/app.sass";
import axios from "axios";

import {
  AnimatedAxis, // any of these can be non-animated equivalents
  AnimatedGrid,
  AnimatedLineSeries,
  XYChart,
  Tooltip,
} from "@visx/xychart";

const LAMBDA_URL = "https://3e2jlccb1k.execute-api.us-east-1.amazonaws.com/dev/get-sensor-data"

const sensorNameMap = {
  "aq_ds80_0.5um_per_1L_air": "aq_ds80_0.5um_per_1L_air",
  "aq_ds80_1.0um_per_1L_air": "aq_ds80_1.0um_per_1L_air",
  "aq_ds80_2.5um_per_1L_air": "aq_ds80_2.5um_per_1L_air",
  "aq_ds80_0.3um_per_1L_air": "aq_ds80_0.3um_per_1L_air",
  "hydro_temp_01193a651085": "temperature probe 1",
  "hydro_temp_01193a5b6f21": "temperature probe 2",
  "hydro_temp_01193a42d661": "temperature probe 3",  
}

interface Datapoint {
  x: string;
  y: number;
}

interface Dataset {
  name: string;
  sensorId: string;
  datapoints: Datapoint[];
}

const App = () => {
  const [data, setData] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const nowEpoch = Math.round(Date.now() / 1000);
      const result = await axios.get(
        LAMBDA_URL +
          `?start_time=${nowEpoch - 5 * 24 * 3600}&end_time=${nowEpoch}`
      );
      if (result.status != 200) {
        setError(() => result.statusText);
        return;
      }

      setData(() => result.data);
    })();
  }, []);

  if (error) {
    return <h1>{error}</h1>;
  }

  if (!data) {
    return <h1>Loading...</h1>;
  }

  const ungraphedSensorIds = [];
  const datasets: Dataset[] = [];
  for (const sensorId of Object.keys(data["sensor_data"])) {
    if (!sensorNameMap[sensorId]){
      ungraphedSensorIds.push(sensorId);
      continue;
    }

    const sensorData = data["sensor_data"][sensorId];
    const timestamps = sensorData["data_epoch_timestamps"];
    const values = sensorData["data_values"];
    const datapoints: Datapoint[] = [];

    if (timestamps.length != values.length) {
      throw new Error("UH OH. THERE IS A MISMATCH :(");
    }

    for (let i = 0; i < timestamps.length; ++i) {
      datapoints.push({
        x: new Date(timestamps[i] * 1000).toLocaleString(),
        y: parseFloat(values[i]),
      });
    }

    datasets.push({
      name: sensorNameMap[sensorId],
      datapoints,
      sensorId,
    });
  }

  datasets.sort((a, b) => {
    return a.name > b.name ? 1 : -1;
  });

  const accessors = {
    xAccessor: (d) => d.x,
    yAccessor: (d) => d.y,
  };

  return (
    <div>
      <h1>
        SensorWatch <small>data monitoring platform</small>
      </h1>
      {datasets.map((dataset) => {
        return (
          <div>
            <h2>{dataset.name}</h2>
            <XYChart
              height={300}
              xScale={{ type: "band" }}
              yScale={{ type: "linear" }}
            >
              <AnimatedAxis orientation="bottom" />
              <AnimatedGrid columns={false} numTicks={2} />
              <AnimatedLineSeries
                dataKey={dataset.name}
                data={dataset.datapoints}
                {...accessors}
                strokeWidth={3}
              />
              <Tooltip
                snapTooltipToDatumX
                snapTooltipToDatumY
                showVerticalCrosshair
                showSeriesGlyphs
                renderTooltip={({ tooltipData, colorScale }) => (
                  <div>
                    <div
                      style={{
                        color: colorScale(tooltipData.nearestDatum.key),
                      }}
                    >
                      {tooltipData.nearestDatum.key}
                    </div>
                    {accessors.xAccessor(tooltipData.nearestDatum.datum)}
                    {", "}
                    {accessors.yAccessor(tooltipData.nearestDatum.datum)}
                  </div>
                )}
              />
            </XYChart>
          </div>
        );
      })}
      <p>Available extra sensorIds (ungraphed)</p>
      <ul>
        {ungraphedSensorIds.map((sensorId) => {
          return <ul>{sensorId}</ul>;
        })}
      </ul>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("app"));
