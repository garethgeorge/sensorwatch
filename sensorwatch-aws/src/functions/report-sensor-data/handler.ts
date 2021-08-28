import 'source-map-support/register';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { formatJSONResponse } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';
import { DynamoDB } from 'aws-sdk';
import { env } from "process";
import * as createError from "http-errors";

import schema from './schema';

const dynamoDb = new DynamoDB.DocumentClient();

// gets the time (rounded to the nearest hour) since the unix epoch in seconds
const getEpochHour = () => {
  return Math.floor(Date.now() / (3600 * 1000)) * 3600;
}

const reportSensorData: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  let params
  try {
    // TODO: accelerate the promises by running them concurrently
    const promises = [];
    for (const record of event.body.records) {
      const promise = await dynamoDb.update({
        TableName: "sensor-data-sensorwatch-aws-dev",
        Key: {
          sensor_id: record.sensor_id,
          epoch_time_sec: getEpochHour(),
        },
        ReturnValues: 'ALL_NEW',
        UpdateExpression: 'set #data_values = list_append(if_not_exists(#data_values, :empty_list), :newdata), ' +
          ' #ts = list_append(if_not_exists(#ts, :empty_list), :newtimestamps)',
        ExpressionAttributeNames: {
          '#ts': 'data_epoch_timestamps',
          '#data_values': 'data_values'
        },
        ExpressionAttributeValues: {
          ':newdata': [record.value],
          ':newtimestamps': [Math.round(Date.now() / 1000)],
          ':empty_list': []
        }
      }).promise();
      promises.push(promise);
    }
    const results = await Promise.all(promises);

    return formatJSONResponse({
      updatedRecords: results,
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
