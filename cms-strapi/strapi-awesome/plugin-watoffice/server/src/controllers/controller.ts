import type { Core } from '@strapi/types';

export const exportController = ({ strapi }: { strapi: Core.Strapi }) => ({
  async exportCSV(ctx) {
    const { contentType } = ctx.params;

    try {
      strapi.contentType(contentType);
    } catch (err) {
      ctx.badRequest(null, [
        { messages: [{ id: 'Content type does not exist' }] },
      ]);
    }

    const { headers, content } = await strapi
      .plugin('watoffice')
      .service('csvExport')
      .exportCSVData(contentType);

    ctx.send({ data: `${headers.join()}\n${content}` });
  },
});

export default exportController;
