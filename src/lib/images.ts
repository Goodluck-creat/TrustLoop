export const avatarSrc = (u: { id: string; avatarAt: Date | null }) =>
  u.avatarAt ? `/img/${u.id}/avatar?v=${u.avatarAt.getTime()}` : null;

export const coverSrc = (u: { id: string; coverAt: Date | null }) =>
  u.coverAt ? `/img/${u.id}/cover?v=${u.coverAt.getTime()}` : null;