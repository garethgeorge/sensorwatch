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
import { LAMBDA_URL } from "./constants";
import { buildCharts } from "./data";

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

  const {datasets, charts} = buildCharts(data);

  const accessors = {
    xAccessor: (d) => new Date(d.timestamp * 1000).toLocaleString(),
    yAccessor: (d) => d.value,
  };

  return (
    <div>
      <h1>
        SensorWatch <small>data monitoring platform</small>
      </h1>
      {charts.map((chart) => {
        return (
          <div>
            <h2>{chart.name}</h2>
            <XYChart
              height={300}
              xScale={{ type: "band" }}
              yScale={{ type: "linear" }}
            >
              <AnimatedAxis orientation="bottom" />
              <AnimatedGrid columns={false} numTicks={2} />
              <AnimatedLineSeries
                dataKey={chart.name}
                data={chart.datapoints}
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
      <p>All sensorIds (ungraphed)</p>
      <ul>
        {Object.keys(datasets).map((sensorId) => {
          return <ul>{sensorId}</ul>;
        })}
      </ul>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("app"));
