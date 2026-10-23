import type { APIRoute } from 'astro';
import { createReleasesFeed } from '../../lib/feed';

export const GET: APIRoute = ({ site }) => createReleasesFeed(site, 'id');
