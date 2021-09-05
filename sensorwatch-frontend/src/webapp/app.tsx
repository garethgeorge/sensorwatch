import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./sass/app.sass";
import axios from "axios";
import Select from "react-select";

import {
  AnimatedAxis, // any of these can be non-animated equivalents
  AnimatedGrid,
  AnimatedLineSeries,
  XYChart,
  Tooltip,
} from "@visx/xychart";
import { LAMBDA_URL } from "./constants";
import { buildCharts } from "./data";

const options = [
  { value: "chocolate", label: "Chocolate" },
  { value: "strawberry", label: "Strawberry" },
  { value: "vanilla", label: "Vanilla" },
];

interface Option<T> {
  value: T;
  label: string;
}

const App = () => {
  const [durationOpt, setDurationOpt] = useState<Option<number>>({
    value: 24 * 3600,
    label: "1 day",
  });
  const [selectedSensors, setSelectedSensors] = useState<Option<string>[]>([]);
  const [data, setData] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(() => null);
    setError(() => null);
    (async () => {
      const nowEpoch = Math.round(Date.now() / 1000);
      const result = await axios.get(
        LAMBDA_URL +
          `?start_time=${nowEpoch - durationOpt.value}&end_time=${nowEpoch}`
      );
      if (result.status != 200) {
        setError(() => result.statusText);
        return;
      }

      setData(() => result.data);
    })();
  }, [durationOpt.value]);

  if (error) {
    return <h1>{error}</h1>;
  }

  if (!data) {
    return <h1>Loading...</h1>;
  }

  const { datasets, charts } = buildCharts(data);

  const availableChartOptions = charts.map((chart) => {
    return {
      label: chart.name,
      value: chart.name,
    };
  });

  if (selectedSensors.length === 0) {
    setSelectedSensors(
      charts
        .filter((chart) => chart.showByDefault)
        .map((chart) => {
          return {
            label: chart.name,
            value: chart.name,
          };
        })
    );
  }

  const accessors = {
    xAccessor: (d) => new Date(d.timestamp * 1000).toLocaleString(),
    yAccessor: (d) => d.value,
  };

  return (
    <div>
      <h1>
        SensorWatch <small>data monitoring platform</small>
      </h1>
      <div id="options" style={{ display: "flex", flexDirection: "row" }}>
        <div style={{ width: "30%" }}>
          <p>Select Duration</p>
          <Select
            options={[
              {
                value: 2 * 3600,
                label: "2 hours",
              },
              {
                value: 24 * 3600,
                label: "1 day",
              },
              {
                value: 7 * 24 * 3600,
                label: "1 week",
              },
              {
                value: 2 * 7 * 24 * 3600,
                label: "2 weeks",
              },
            ]}
            value={durationOpt}
            onChange={(selectedOption) => {
              setDurationOpt(selectedOption);
            }}
          ></Select>
        </div>
        <div style={{ width: "70%"}}>
          <p>Select Sensors (not used yet)</p>
          <Select
            isMulti
            options={availableChartOptions}
            value={selectedSensors}
            onChange={(sensor, action) => {
              setSelectedSensors(sensor as any);
            }}
          ></Select>
        </div>
      </div>

      {charts.map((chart) => {
        if (!selectedSensors.find((sensor) => sensor.label === chart.name)) {
          return null;
        }

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
