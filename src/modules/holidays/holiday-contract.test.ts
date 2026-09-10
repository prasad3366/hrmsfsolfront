import { describe, expectTypeOf, it } from 'vitest';
import { Holiday } from '../../services/api';

describe('Holiday API contract', () => {
  it('does not require an updatedAt field from the backend', () => {
    expectTypeOf<Holiday>().not.toHaveProperty('updatedAt');
    expectTypeOf<Holiday>().toMatchTypeOf<{
      id: number;
      name: string;
      date: string;
      createdAt: string;
    }>();
  });
});