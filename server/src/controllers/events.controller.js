import { subscribe } from '../services/eventBus.js';

export function subscribeToEvents(req, res) {
  subscribe(res, req.user._id);
}
