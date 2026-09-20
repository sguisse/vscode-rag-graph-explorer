import { z } from 'zod';

export const BookmarkSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL"),
  description: z.string().optional(),
  icon: z.string(),
  iconType: z.enum(['lucide', 'emoji', 'url', 'base64']),
  tags: z.array(z.string()),
  isPrivate: z.boolean(),
  isLocked: z.boolean(),
  owner: z.string(),
  healthStatus: z.enum(['healthy', 'broken', 'unreachable', 'ssl_error', 'checking']),
  clickCount: z.number().int().nonnegative(),
  lastCheckedAt: z.number().optional(),
  createdAt: z.number(),
});

export const CardLockMatrixSchema = z.object({
  cardLocks: z.object({
    lockedPosition: z.boolean(),
    lockedSize: z.boolean(),
    lockedName: z.boolean(),
    lockedDeletion: z.boolean()
  }),
  bookmarkLocks: z.object({
    editable: z.boolean(),
    reorderable: z.boolean(),
    urlEditableOnly: z.boolean(),
    removable: z.boolean(),
    addable: z.boolean()
  })
});

export const BookmarkCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  tabId: z.string(),
  description: z.string().optional(),
  isPrivate: z.boolean(),
  owner: z.string(),
  position: z.object({
    x: z.number(), y: z.number(), w: z.number(), h: z.number()
  }),
  locks: CardLockMatrixSchema,
  bookmarks: z.array(BookmarkSchema)
});

export type ValidatedBookmark = z.infer<typeof BookmarkSchema>;
export type ValidatedCard = z.infer<typeof BookmarkCardSchema>;
