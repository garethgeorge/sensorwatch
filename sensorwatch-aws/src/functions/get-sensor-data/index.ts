import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'get-sensor-data',
        private: false,
        cors: true,
        request: {
        }
      }
    }
  ]
}
