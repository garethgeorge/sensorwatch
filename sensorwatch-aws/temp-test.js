const AWS = require("aws-sdk");
AWS.config.update({ region: 'us-east-1' });
var ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
var ddbdc = new AWS.DynamoDB.DocumentClient();

const getEpochHour = () => {
  return Math.floor(Date.now() / (3600 * 1000)) * 3600 * 1000;
}

(async () => {
  /*
  console.log(JSON.stringify(await ddbdc.update({
    TableName: "sensor-data-sensorwatch-aws-dev",
    Key: {
      sensor_id: "test",
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
      ':newdata': [Math.random()],
      ':newtimestamps': [Math.round(Date.now() / 1000)],
      ':empty_list': []
    }
  }).promise(), false, 2));

  
  var params = {
    RequestItems: {
      "sensor-data-sensorwatch-aws-dev": [
        {
          PutRequest: {
            Item: {
              "sensor_id": { "S": "test2" },
              "epoch_time_sec": { "N": "14" },
              "value": { "S": "1239" },
            }
          }
        }
      ]
    }
  }

  // Call DynamoDB to add the item to the table
  console.log(await ddb.batchWriteItem(params).promise())
  */

  params = {
    TableName: "sensor-data-sensorwatch-aws-dev",
    FilterExpression: "#t between :start_t and :end_t",
    ExpressionAttributeNames: {
      "#t": "epoch_time_sec",
    },
    ExpressionAttributeValues: {
      ":start_t": 0,
      ":end_t": Date.now() / 1000,
    }
  }

  console.log(await ddbdc.scan(params).promise())
})()