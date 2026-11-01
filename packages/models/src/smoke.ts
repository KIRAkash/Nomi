// npm run smoke -w @nomi/models: one cheap call to prove the key and base URL work.
import { MODELS, metaClient } from './client.ts';

const res = await metaClient().responses.create({ model: MODELS.spark, input: 'Reply with the single word: ready' });
console.log(MODELS.spark, '→', res.output_text);
