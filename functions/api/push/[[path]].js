/* Cloudflare Pages Function: every /api/push/* request (alerts by
   notification). The code lives in push/api.mjs; see README.md. */
import { handle } from '../../../push/api.mjs';

export const onRequest = (context) => handle(context);
