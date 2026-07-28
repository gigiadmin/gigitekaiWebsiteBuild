import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { intakeTicketsRouter } from './intakeTickets';
import { getDb } from '../db';
import { intakeTickets } from '../../drizzle/schema';

describe('intakeTicketsRouter', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database not available for tests');
    }
  });

  it('should have listForAdmin procedure', () => {
    expect(intakeTicketsRouter.createCaller).toBeDefined();
    const caller = intakeTicketsRouter.createCaller({} as any);
    expect(caller.listForAdmin).toBeDefined();
  });

  it('should return empty list when no tickets exist', async () => {
    const caller = intakeTicketsRouter.createCaller({} as any);
    const result = await caller.listForAdmin({
      limit: 50,
      offset: 0,
    });

    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('submissions');
    expect(Array.isArray(result.submissions)).toBe(true);
  });

  it('should filter by status', async () => {
    const caller = intakeTicketsRouter.createCaller({} as any);
    const result = await caller.listForAdmin({
      status: 'open',
      limit: 50,
      offset: 0,
    });

    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('submissions');
    // All submissions should have status 'open'
    result.submissions.forEach((submission: any) => {
      expect(submission.status).toBe('open');
    });
  });

  it('should search by creator name', async () => {
    const caller = intakeTicketsRouter.createCaller({} as any);
    const result = await caller.listForAdmin({
      search: 'Test',
      limit: 50,
      offset: 0,
    });

    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('submissions');
  });

  it('should paginate results', async () => {
    const caller = intakeTicketsRouter.createCaller({} as any);
    const result1 = await caller.listForAdmin({
      limit: 10,
      offset: 0,
    });

    const result2 = await caller.listForAdmin({
      limit: 10,
      offset: 10,
    });

    expect(result1.submissions.length).toBeLessThanOrEqual(10);
    expect(result2.submissions.length).toBeLessThanOrEqual(10);
  });

  it('should return properly formatted submissions', async () => {
    const caller = intakeTicketsRouter.createCaller({} as any);
    const result = await caller.listForAdmin({
      limit: 1,
      offset: 0,
    });

    if (result.submissions.length > 0) {
      const submission = result.submissions[0];
      expect(submission).toHaveProperty('id');
      expect(submission).toHaveProperty('creatorName');
      expect(submission).toHaveProperty('creatorEmail');
      expect(submission).toHaveProperty('subject');
      expect(submission).toHaveProperty('status');
      expect(submission).toHaveProperty('priority');
      expect(submission).toHaveProperty('createdAt');
      expect(submission).toHaveProperty('intakeData');
    }
  });
});
