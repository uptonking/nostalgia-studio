export const swaggerOption = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'realworld api docs using nodejs/sequelize',
      description: 'REST API for realworld app',
      version: '1.0.0',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8990}/api`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },

  apis: ['src/routes/v1/*.ts', 'src/app.ts'],
};
