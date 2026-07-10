/**
 * Scoring engine.
 *
 * Pure functions with no randomness so the same logic can run on the client
 * (for hints / validation) and on the server (as the authority).
 *
 * Scoring rules used here:
 *   - Single 1                = 100
 *   - Single 5                = 50
 *   - Three 1s                = 1000
 *   - Three of a kind (2–6)   = face × 100
 *   - Four of a kind          = 1000
 *   - Five of a kind          = 2000
 *   - Six of a kind           = 3000
 *   - Straight (1-2-3-4-5-6)  = 1500
 *   - Three pairs             = 1500
 *   - Two triplets            = 2500
 *
 * A die value is always in the range 1–6.
 */

export interface SelectionResult {
	/** True when every die in the selection contributes to a scoring combo. */
	valid: boolean;
	/** Maximum points the selection is worth (0 when invalid). */
	points: number;
}

/** Tally how many of each face (1–6) appear in `values`. */
function faceCounts(values: number[]): number[] {
	const counts = [0, 0, 0, 0, 0, 0, 0]; // index 0 unused
	for (const v of values) counts[v]++;
	return counts;
}

/** Flat value of an n-of-a-kind group of size `k` (k ≥ 3) for face `f`. */
function nOfAKind(face: number, k: number): number {
	if (k >= 6) return 3000;
	if (k === 5) return 2000;
	if (k === 4) return 1000;
	// k === 3
	return face === 1 ? 1000 : face * 100;
}

/**
 * Best score obtainable while consuming *every* die of a single face.
 * Returns null when the dice cannot all be used (e.g. a lone 2, 3, 4 or 6).
 */
function scoreFaceComplete(face: number, count: number): number | null {
	if (count === 0) return 0;

	const single = face === 1 ? 100 : face === 5 ? 50 : null;
	let best: number | null = null;
	const consider = (points: number | null) => {
		if (points !== null && (best === null || points > best)) best = points;
	};

	// Option: score every die as a single (only 1s and 5s can).
	if (single !== null) consider(count * single);

	// Option: take one n-of-a-kind group of size k, score the rest as singles.
	for (let k = 3; k <= count; k++) {
		const rest = count - k;
		if (rest === 0) consider(nOfAKind(face, k));
		else if (single !== null) consider(nOfAKind(face, k) + rest * single);
		// If rest > 0 and the face has no single value, this split is infeasible.
	}

	return best;
}

/**
 * Maximum score when *all* provided dice must be used, or null if some die
 * cannot participate in any scoring combo (making the selection invalid).
 */
function scoreAllDice(values: number[]): number | null {
	if (values.length === 0) return null;

	const counts = faceCounts(values);
	let best: number | null = null;
	const consider = (points: number | null) => {
		if (points !== null && (best === null || points > best)) best = points;
	};

	// Whole-set combos (all six dice).
	if (values.length === 6) {
		const distinct = counts.filter((c) => c > 0).length;
		if (distinct === 6) consider(1500); // straight
		const pairs = counts.filter((c) => c === 2).length;
		if (pairs === 3) consider(1500); // three pairs
		const triplets = counts.filter((c) => c === 3).length;
		if (triplets === 2) consider(2500); // two triplets
	}

	// Per-face decomposition (valid for any number of dice).
	let sum = 0;
	let feasible = true;
	for (let face = 1; face <= 6; face++) {
		if (counts[face] === 0) continue;
		const faceScore = scoreFaceComplete(face, counts[face]);
		if (faceScore === null) {
			feasible = false;
			break;
		}
		sum += faceScore;
	}
	if (feasible) consider(sum);

	return best;
}

/**
 * Score an exact set of dice a player wants to set aside.
 * The selection is only valid when every die contributes to scoring.
 */
export function scoreSelection(values: number[]): SelectionResult {
	const points = scoreAllDice(values);
	return points === null ? { valid: false, points: 0 } : { valid: true, points };
}

/**
 * Highest score achievable from the best-scoring subset of `values`
 * (dice do not all have to be used). Returns 0 when nothing scores.
 */
export function bestScore(values: number[]): number {
	const n = values.length;
	let best = 0;
	for (let mask = 1; mask < 1 << n; mask++) {
		const subset: number[] = [];
		for (let i = 0; i < n; i++) {
			if (mask & (1 << i)) subset.push(values[i]);
		}
		const points = scoreAllDice(subset);
		if (points !== null && points > best) best = points;
	}
	return best;
}

/** True when a roll has no scoring dice at all (a "Farkle"). */
export function isFarkle(values: number[]): boolean {
	return bestScore(values) === 0;
}
