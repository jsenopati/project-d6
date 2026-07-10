import { rollMultiple } from './dice';
import { isFarkle, scoreSelection } from './scoring';

export const FARKLE_CONFIG = {
	diceCount: 6,
	winScore: 10000,
	openingThreshold: 500
} as const;

export interface FarkleTurn {
	roll: number[];
	setAside: number[];
	turnScore: number;
	diceToRoll: number;
	farkled: boolean;
	hotDice: boolean;
}

export type Roller = (count: number) => number[];

const defaultRoller: Roller = (count) => rollMultiple(count).map((d) => d.value);

export function startTurn(): FarkleTurn {
	return {
		roll: [],
		setAside: [],
		turnScore: 0,
		diceToRoll: FARKLE_CONFIG.diceCount,
		farkled: false,
		hotDice: false
	};
}

export function rollTurn(turn: FarkleTurn, roller: Roller = defaultRoller): FarkleTurn {
	const roll = roller(turn.diceToRoll);
	const farkled = isFarkle(roll);
	return {
		...turn,
		roll,
		hotDice: false,
		farkled,
		turnScore: farkled ? 0 : turn.turnScore
	};
}

export interface SetAsideResult {
	turn: FarkleTurn;
	valid: boolean;
	points: number;
}

export function setAside(turn: FarkleTurn, indices: number[]): SetAsideResult {
	if (turn.farkled || indices.length === 0) {
		return { turn, valid: false, points: 0 };
	}

	const unique = [...new Set(indices)];
	if (unique.some((i) => i < 0 || i >= turn.roll.length)) {
		return { turn, valid: false, points: 0 };
	}

	const chosen = unique.map((i) => turn.roll[i]);
	const result = scoreSelection(chosen);
	if (!result.valid) {
		return { turn, valid: false, points: 0 };
	}

	const selected = new Set(unique);
	const remaining = turn.roll.filter((_, i) => !selected.has(i));

	let diceToRoll = remaining.length;
	let hotDice = false;
	if (diceToRoll === 0) {
		diceToRoll = FARKLE_CONFIG.diceCount;
		hotDice = true;
	}

	return {
		turn: {
			...turn,
			roll: [],
			setAside: [...turn.setAside, ...chosen],
			turnScore: turn.turnScore + result.points,
			diceToRoll,
			hotDice,
			farkled: false
		},
		valid: true,
		points: result.points
	};
}

export function canBank(turn: FarkleTurn, playerTotal: number): boolean {
	if (turn.farkled || turn.turnScore === 0) return false;
	if (playerTotal > 0) return true;
	return turn.turnScore >= FARKLE_CONFIG.openingThreshold;
}

export function bankableScore(turn: FarkleTurn): number {
	return turn.farkled ? 0 : turn.turnScore;
}

export function hasWon(total: number): boolean {
	return total >= FARKLE_CONFIG.winScore;
}
