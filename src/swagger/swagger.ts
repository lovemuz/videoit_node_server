const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const options = {
  info: {
    title: 'API description',
    description: '스웨거 자동생성',
  },
  servers: [
    {
      url: 'http://localhost:5050',
    },
  ],
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      in: 'header',
      bearerFormat: 'JWT',
    },
  },
};
const outputFile = './swagger-output.json';
const endpointsFiles = ['../api/routes/*.ts'];
swaggerAutogen(outputFile, endpointsFiles, options);