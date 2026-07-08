/**
 * Spiral Interleaving — "Addictive" sequence generator
 *
 * Divides items into groups of `groupSize`, then interleaves them so that
 * every new group is immediately followed by a review of the previous group.
 *
 * Pattern: [0, 1, 2, 1, 3, 2, 4, 3, ..., N-1, N, N-1, N]
 *
 * Example with 100 words, groupSize=5:
 *   20 groups → 40 group presentations → 200 card presentations
 *   Each group (except first & last) appears twice: once as "new", once as "review"
 */

export interface AddictiveSequenceResult<T> {
  /** Flattened interleaved sequence of all items */
  ordered: T[];
  /** Number of groups the original items were split into */
  totalGroups: number;
  /** Number of group presentations in the sequence (includes repeats) */
  totalGroupRounds: number;
  /** Number of individual item presentations */
  totalItemRounds: number;
  /** The group index (into the original groups array) for each position in `ordered` */
  groupMap: number[];
  /** Start index (in `ordered`) for each group presentation */
  groupBoundaries: number[];
}

export function generateAddictiveSequence<T>(
  items: T[],
  groupSize: number,
): AddictiveSequenceResult<T> {
  if (items.length === 0) {
    return {
      ordered: [],
      totalGroups: 0,
      totalGroupRounds: 0,
      totalItemRounds: 0,
      groupMap: [],
      groupBoundaries: [],
    };
  }

  if (groupSize < 1) groupSize = 5;

  // 1. Split into groups
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += groupSize) {
    groups.push(items.slice(i, i + groupSize));
  }

  const totalGroups = groups.length;

  // 2. Generate interleaved group order
  // Pattern: [0, 1, 2, 1, 3, 2, 4, 3, ..., N-1, N, N-1, N]
  const groupOrder: number[] = [0];

  for (let n = 1; n < totalGroups; n++) {
    groupOrder.push(n); // new group
    groupOrder.push(n - 1); // review previous
  }
  // Repeat the last group so it also appears twice
  groupOrder.push(totalGroups - 1);

  // 3. Flatten groups into ordered items
  const ordered: T[] = [];
  const groupMap: number[] = [];
  const groupBoundaries: number[] = [];

  for (const groupIdx of groupOrder) {
    groupBoundaries.push(ordered.length);
    const group = groups[groupIdx];
    for (const item of group) {
      ordered.push(item);
      groupMap.push(groupIdx);
    }
  }

  return {
    ordered,
    totalGroups,
    totalGroupRounds: groupOrder.length,
    totalItemRounds: ordered.length,
    groupMap,
    groupBoundaries,
  };
}
