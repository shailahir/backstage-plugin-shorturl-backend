import { PluginDatabaseManager, errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { nanoid } from 'nanoid';
import { Logger } from 'winston';
import { DatabaseShortUrlStore } from '../database/DatabaseShorturlStore';
import { ShorturlStore } from '../database/ShorturlStore';

/**
 * @public
 */
export interface RouterOptions {
  logger: Logger;
  database: PluginDatabaseManager;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger } = options;

  const router = Router();
  router.use(express.json());

  const dbStore: ShorturlStore = await DatabaseShortUrlStore.create({
    database: options.database,
  });

  router.put('/create', async (_, response) => {
    const reqBody = _.body;
    if (
      !reqBody ||
      Object.keys(reqBody)?.length === 0 ||
      !reqBody.fullUrl ||
      reqBody.usageCount === undefined
    ) {
      response.status(400).json({ status: 'invalid request' });
      return;
    }
    try {
      const existing = await dbStore.getIdByUrl({ fullUrl: reqBody.fullUrl });
      if (existing && existing.shortId) {
        response.json({ status: 'ok', id: existing.shortId });
        return;
      }
    } catch (e) {}

    const id = nanoid();
    await dbStore.saveUrlMapping({
      shortId: id,
      fullUrl: reqBody.fullUrl,
      usageCount: reqBody.usageCount,
    });

    response.json({ status: 'ok', id });
  });

  router.get('/go/:id', async (_, response) => {
    const shortId = _.params?.id;
    if (!shortId) {
      response.status(400).json({ status: 'invalid request' });
      return;
    }

    const urlResponse = await dbStore.getUrlById({ shortId });
    if (urlResponse && urlResponse?.fullUrl) {
      response.redirect(urlResponse?.fullUrl);
    } else {
      response
        .status(500)
        .json({ status: 'error', message: 'Not able to redirect' });
    }
  });

  router.get('/getAll', async (_, response) => {
    const allRows = await dbStore.getAllRecords();
    if (allRows) {
      response.json({ status: 'ok', data: allRows });
    } else {
      response.json({ status: 'error', message: 'Not able to fetch' });
    }
  });

  router.get('/health', (_, response) => {
    response.json({ status: 'ok' });
  });
  router.use(errorHandler());
  return router;
}
