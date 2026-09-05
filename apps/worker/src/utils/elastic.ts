import { Client } from '@elastic/elasticsearch';
import { workerEnv } from '../config/env';

export const esClient = new Client({
  node: workerEnv.ELASTICSEARCH_URL,
});
