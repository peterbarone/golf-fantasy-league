import { z } from 'zod';

// Tournament schemas
export const tournamentSchema = z.object({
  name: z.string().min(1, 'Tournament name is required'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isMajor: z.boolean(),
  isWGC: z.boolean(),
  isMatchPlay: z.boolean(),
  isActive: z.boolean(),
});

export const tournamentUpdateSchema = tournamentSchema.partial();

// Tournament results schemas
export const golferResultSchema = z.object({
  golferId: z.string().uuid(),
  position: z.number().int().min(1),
  earnings: z.number().nonnegative().optional(),
  fedexPoints: z.number().nonnegative().optional(),
  matchPlayWins: z.number().int().min(0).optional(),
});

export const tournamentResultsSchema = z.object({
  results: z.array(golferResultSchema),
});

// Tournament skins schemas
export const skinsUpdateSchema = z.object({
  skinValue: z.number().nonnegative(),
  carryOver: z.boolean(),
  winningTeamIds: z.array(z.string().uuid()).optional(),
});

// Team schemas
export const teamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  ownerId: z.string().uuid(),
});

export const teamUpdateSchema = teamSchema.partial();

// Team roster schemas
export const rosterAddSchema = z.object({
  golferId: z.string().uuid(),
});

// Team lineup schemas
export const lineupSchema = z.object({
  tournamentId: z.string().uuid(),
  golferIds: z.array(z.string().uuid())
    .min(4, 'Must select exactly 4 golfers')
    .max(4, 'Must select exactly 4 golfers'),
});

// Query parameter schemas
export const yearQuerySchema = z.object({
  year: z.string().regex(/^\d{4}$/, 'Invalid year format').optional(),
});

export const weekQuerySchema = z.object({
  week: z.string().datetime().optional(),
  year: z.string().regex(/^\d{4}$/, 'Invalid year format').optional(),
});

// Utility function to validate query parameters
export function validateQuery<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T
): z.infer<T> {
  const queryObj: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    queryObj[key] = value;
  });
  return schema.parse(queryObj);
}

// Utility function to parse request body with schema
export async function validateBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  const body = await request.json();
  return schema.parse(body);
}
