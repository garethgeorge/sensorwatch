import type { AWS } from '@serverless/typescript';

import reportSensorData from '@functions/report-sensor-data';
import getSensorData from '@functions/get-sensor-data';

const serverlessConfiguration: AWS = {
  service: 'sensorwatch-aws',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true,
    },
  },
  plugins: ['serverless-webpack'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
      apiKeys: [
        "API_KEY",
      ]
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      SENSOR_DATA_TABLE: "sensor-data-${self:service}-${opt:stage, self:provider.stage}",
    },
    lambdaHashingVersion: '20201221',
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: [
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:UpdateItem",
          "dynamodb:BatchWriteItem",
        ],
        Resource: '*',
      }
    ],
    memorySize: 512,
    timeout: 10,
  },
  // import the function via paths
  functions: {
    "report-sensor-data": reportSensorData,
    "get-sensor-data": getSensorData,
  },
  resources: {
    Resources: {
      sensorwatchData: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.SENSOR_DATA_TABLE}',
          AttributeDefinitions: [
            {
              AttributeName: 'sensor_id',
              AttributeType: 'S',
            },
            {
              AttributeName: 'epoch_time_sec',
              AttributeType: 'N',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'sensor_id',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'epoch_time_sec',
              KeyType: 'RANGE',
            }
          ],
          BillingMode: "PAY_PER_REQUEST",
        },
      }
    }
  }
};

module.exports = serverlessConfiguration;
