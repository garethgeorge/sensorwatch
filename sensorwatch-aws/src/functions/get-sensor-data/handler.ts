import 'source-map-support/register';

import { formatJSONResponse } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';
import { DynamoDB } from 'aws-sdk';
import { env } from "process";
import * as createError from "http-errors";

import type { APIGatewayProxyHandler } from 'aws-lambda';

const dynamoDb = new DynamoDB.DocumentClient();

const reportSensorData: APIGatewayProxyHandler = async (event) => {
  let params
  try {
    params = {
      TableName: env.SENSOR_DATA_TABLE,
      FilterExpression: "#t between :start_t and :end_t",
      ExpressionAttributeNames: {
        "#t": "epoch_time_sec",
      },
      ExpressionAttributeValues: {
        ":start_t": parseInt(event.queryStringParameters.start_time),
        ":end_t": parseInt(event.queryStringParameters.end_time),
      },
      Limit: 24 * 365,
      ReturnConsumedCapacity: "TOTAL",
    }

    const result = await dynamoDb.scan(params).promise()

    result.LastEvaluatedKey

    const sensors = {};
    for (const item of result.Items) {
      const sensorId = item["sensor_id"];
      if (!sensors[sensorId]) {
        sensors[sensorId] = {
          "data_epoch_timestamps": [],
          "data_values": []
        }
      }

      const dataEpochTimestamps = sensors[sensorId]["data_epoch_timestamps"];
      const dataValues = sensors[sensorId]["data_values"];

      for (let i = 0; i < item["data_epoch_timestamps"].length; ++i) {
        dataEpochTimestamps.push(item["data_epoch_timestamps"][i]);
        dataValues.push(item["data_values"][i]);
      }
    }

    return formatJSONResponse({
      sensor_data: sensors,
      cost: result.ConsumedCapacity,
    });
  } catch (e) {
    return formatJSONResponse({
      error: '' + e,
      event,
      params
    })
  }
}

export const main = middyfy(reportSensorData);
