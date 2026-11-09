import { fetchReleases, type Release } from './github';

const mobileOwner = process.env.MOBILE_GITHUB_OWNER ?? 'risuunava';
const mobileRepo = process.env.MOBILE_GITHUB_REPO ?? 'notchi-mobile';

export async function getMobileReleases(): Promise<Release[]> {
  return fetchReleases({ owner: mobileOwner, repo: mobileRepo });
}

export { type Release };
