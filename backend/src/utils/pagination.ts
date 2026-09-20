export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export function getPaginationParams(query: PaginationQuery) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(query.limit || '10', 10)));
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || 'createdAt';
  const order = query.order?.toLowerCase() === 'asc' ? 'asc' : 'desc';

  return { page, limit, skip, sortBy, order, search: query.search?.trim() };
}