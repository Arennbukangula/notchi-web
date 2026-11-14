#!/usr/bin/env node

/**
 * Script to upload reward assets (expand & compact WebP) from rewards-src/ to Vercel Blob
 * and register the generated URLs to Upstash Redis (hash bg:{id}).
 *
 * Usage:
 *   node scripts/upload-rewards.mjs
 *
 * Requirements:
 *   - BLOB_READ_WRITE_TOKEN in env
 *   - UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in env
 */

import fs from 'node:fs';
import path from 'node:path';
import { put } from '@vercel/blob';
import { Redis } from '@upstash/redis';

const SOURCE_DIR = path.resolve(process.cwd(), 'rewards-src');

const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

if (!blobToken) {
  console.error('❌ Error: BLOB_READ_WRITE_TOKEN environment variable is missing.');
  process.exit(1);
}

if (!redisUrl || !redisToken) {
  console.error('❌ Error: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing.');
  process.exit(1);
}

if (!fs.existsSync(SOURCE_DIR)) {
  console.error(`❌ Error: Source directory "${SOURCE_DIR}" does not exist.`);
  console.log('   Create "rewards-src/" and place your WebP images (e.g. bg_01_expand.webp, bg_01_compact.webp).');
  process.exit(1);
}

const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

async function uploadFile(fileName) {
  const filePath = path.join(SOURCE_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileBuffer = fs.readFileSync(filePath);
  console.log(`📤 Uploading ${fileName} to Vercel Blob...`);

  const blob = await put(`rewards/${fileName}`, fileBuffer, {
    access: 'public',
    addRandomSuffix: true,
    token: blobToken,
  });

  return blob.url;
}

async function main() {
  console.log('🚀 Starting Notchi Rewards Assets Upload...\n');

  // Background items bg_01 through bg_07
  for (let i = 1; i <= 7; i++) {
    const bgId = `bg_0${i}`;
    const expandFile = `${bgId}_expand.webp`;
    const compactFile = `${bgId}_compact.webp`;

    console.log(`--- Processing [${bgId}] ---`);
    const urlExpand = await uploadFile(expandFile);
    const urlCompact = await uploadFile(compactFile);

    if (!urlExpand && !urlCompact) {
      console.log(`⚠️  Skipped ${bgId}: No files found in ${SOURCE_DIR}\n`);
      continue;
    }

    const payload = {};
    if (urlExpand) payload.url_expand = urlExpand;
    if (urlCompact) payload.url_compact = urlCompact;

    await redis.hset(`bg:${bgId}`, payload);
    console.log(`✅ Saved ${bgId} to Redis:`, payload, '\n');
  }

  console.log('🎉 Upload script finished successfully!');
}

main().catch((err) => {
  console.error('❌ Script failed with error:', err);
  process.exit(1);
});
