/**
 * Apply pagination to a Mongoose query.
 *
 * Usage:
 *   const { data, pagination } = await paginate(Model.find(filter), req);
 *
 * Query params supported:
 *   ?page=1&limit=20   — offset-based pagination
 *   ?cursor=<id>&limit=20 — cursor-based pagination (uses _id)
 *   ?sort=-createdAt    — sort field (prefix with - for desc)
 */
export const paginate = async (query, req, defaultLimit = 20) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || defaultLimit));
  const sort = req.query.sort || '-createdAt';

  // Cursor-based pagination
  if (req.query.cursor) {
    query = query.where('_id').lt(req.query.cursor);
  } else {
    query = query.skip((page - 1) * limit);
  }

  const data = await query.sort(sort).limit(limit + 1).lean();
  const hasMore = data.length > limit;
  if (hasMore) data.pop();

  const nextCursor = hasMore && data.length > 0 ? data[data.length - 1]._id : null;

  return {
    data,
    pagination: {
      page,
      limit,
      hasMore,
      nextCursor,
    },
  };
};

/**
 * Count total documents matching a filter (for offset pagination).
 */
export const paginateWithCount = async (Model, filter, req, defaultLimit = 20) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || defaultLimit));
  const sort = req.query.sort || '-createdAt';

  const [data, total] = await Promise.all([
    Model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Model.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
};
