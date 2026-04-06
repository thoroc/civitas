import { cachedGet } from './cache';
import type { MemberCore } from './schemas';

type CacheCfg = { dir: string; forceRefresh: boolean };

interface SearchPage {
  items?: unknown[];
  totalResults?: number;
}

const extractPage = (data: unknown): SearchPage => {
  const d = data as Record<string, unknown>;
  // Parliament API returns { items: [...], totalResults: N, take: N, skip: N }
  // The API caps page size at 20 regardless of the take parameter.
  if (Array.isArray(d?.items)) return d as SearchPage;
  // Fallback: some endpoints nest under value
  const v = d?.value as Record<string, unknown> | undefined;
  return Array.isArray(v?.items) ? (v as SearchPage) : {};
};

const parseMember = (it: unknown): MemberCore | null => {
  const i = it as Record<string, unknown>;
  const v = i?.value as Record<string, unknown> | undefined;
  const id = (v?.id ?? i?.id ?? i?.MemberId ?? i?.Id) as number | undefined;
  const name = String(
    v?.nameDisplayAs ?? i?.nameDisplayAs ?? i?.Name ?? i?.name ?? ''
  );
  return id ? { memberId: id, name } : null;
};

export const fetchMemberIds = async (
  base: string,
  cacheCfg: CacheCfg
): Promise<MemberCore[]> => {
  const members: MemberCore[] = [];
  let skip = 0;
  let totalResults = Number.MAX_SAFE_INTEGER;

  while (skip < totalResults) {
    // No IsCurrentMember filter — returns both current and former MPs.
    // API ignores take>20; use totalResults from response to drive pagination.
    const url = `${base}/api/Members/Search?House=Commons&skip=${skip}&take=20`;
    const data = await cachedGet(url, cacheCfg);
    const page = extractPage(data);
    const items = page.items ?? [];
    if (!items.length) break;

    totalResults = page.totalResults ?? totalResults;
    for (const it of items) {
      const member = parseMember(it);
      if (member) members.push(member);
    }
    skip += items.length;
  }

  return members;
};
