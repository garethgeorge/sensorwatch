export default {
  type: 'object',
  properties: {
    records: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          sensor_id: { type: 'string' },
          value: { type: 'string' },
        }
      }
    },
  },
} as const;
