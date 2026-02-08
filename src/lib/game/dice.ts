/**
 * Core dice-rolling logic.
 * All randomness lives here so the server can call the same functions later.
 */

export interface DiceRoll {
	value: number; // 1–6
	timestamp: number;
}

/** Roll a single d6. */
export function rollDie(): DiceRoll {
	return {
		value: Math.floor(Math.random() * 6) + 1,
		timestamp: Date.now()
	};
}

export function rollMultiple(count: number): DiceRoll[] {
	return Array.from({ length: count }, () => rollDie());
}
