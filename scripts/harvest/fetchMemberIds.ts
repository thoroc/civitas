import { cachedGet } from './cache';
import type { MemberCore } from './schemas';

type CacheCfg = { dir: string; forceRefresh: boolean };

const extractItems = (data: unknown): unknown[] => {
  const d = data as Record<string, unknown>;
  const v = d?.value as Record<string, unknown> | undefined;
  const items = v?.items ?? d?.items ?? d?.results;
  return Array.isArray(items) ? items : [];
};

export const fetchMemberIds = async (
  base: string,
  pageSize: number,
  cacheCfg: CacheCfg
): Promise<MemberCore[]> => {
  let skip = 0;
  const members: MemberCore[] = [];

  while (true) {
    const url = `${base}/api/Members/Search?House=Commons&IsCurrentMember=false&skip=${skip}&take=${pageSize}`;
    const data = await cachedGet(url, cacheCfg);
    const rawItems = extractItems(data);
    const batch = rawItems.map(it => {
      const i = it as Record<string, unknown>;
      const v = i?.value as Record<string, unknown> | undefined;
      return {
        MemberId: (v?.id ?? i?.MemberId ?? i?.Id ?? i?.id) as number,
        Name: (v?.nameDisplayAs ??
          i?.Name ??
          i?.DisplayAs ??
          i?.name ??
          '') as string,
      };
    });
    if (!batch.length) break;
    for (const m of batch) {
      if (m.MemberId) members.push({ memberId: m.MemberId, name: m.Name });
    }
    if (batch.length < pageSize) break;
    skip += pageSize;
  }

  return members;
};
