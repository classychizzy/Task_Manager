export function getPagination(page?: number, limit?: number) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

  const skip = (safePage - 1) * safeLimit;

  return { skip, take: safeLimit, page: safePage, limit: safeLimit };
}