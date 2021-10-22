import "source-map-support/register";

import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import { DynamoDB } from "aws-sdk";
import { env } from "process";
import * as createError from "http-errors";
import { ScheduledHandler } from "aws-lambda";

const dynamoDb = new DynamoDB.DocumentClient();

const reportSensorData: ScheduledHandler = async (event, context) => {
  let params;
  params = {
    TableName: env.SENSOR_DATA_TABLE,
    FilterExpression: "#t <= :end_t",
    ExpressionAttributeNames: {
      "#t": "epoch_time_sec",
    },
    ExpressionAttributeValues: {
      ":end_t": Date.now() / 1000 - 3600 * 24 * 30, // data is retained for 30 days
    },
    Limit: 24 * 365,
    ReturnConsumedCapacity: "TOTAL",
  };

  const result = await dynamoDb.scan(params).promise();
  console.log("found " + result.Items.length + " items to delete.");


  const dispatchRequests = async (requests) => {
    let params = {
      RequestItems: {
        [env.SENSOR_DATA_TABLE]: requests
      },
      ReturnConsumedCapacity: "TOTAL",
    };
  
    const result = await dynamoDb.batchWrite(params).promise();
    console.log(result);
  }

  let requests = [];

  for (const item of result.Items) {
    if (requests.length >= 25) {
      await dispatchRequests(requests);
      requests = [];
    }
    console.log(`requesting ${item.sensor_id} at ${item.epoch_time_sec} be deleted`);
    requests.push({
      DeleteRequest: {
        Key: {
          sensor_id: item.sensor_id,
          epoch_time_sec: item.epoch_time_sec,
        },
      },
    });
  }
  if (requests.length > 0) {
    await dispatchRequests(requests);
  }


};

export const main = middyfy(reportSensorData);
