import { Draft } from './draft.ts';



export type StatefulValue<value, state = void> = [value, state];
export type Workflow<i, o, is = void, os = is> = Draft.Kleisli<StatefulValue<i, is>, StatefulValue<o, os>>;

export namespace Workflow {
	export function then<i, o, is = void, os = is>(f: (i: i, is: is) => Draft<StatefulValue<o, os>>): Workflow<i, o, is, os> {
		return ([i, is]) => f(i, is);
	}

	export function thenaf<i, o, is = void, os = is>(f: (i: i, is: is) => Promise<StatefulValue<o, os>>): Workflow<i, o, is, os> {
		return ([i, is]) => Draft.from(f(i, is));
	}

	export function thenf<i, o, is = void, os = is>(f: (i: i, is: is) => StatefulValue<o, os>): Workflow<i, o, is, os> {
		return thenaf(async (i, is) => f(i, is));
	}

	export function pipe<i, o, is = void>(f: (i: i, is: is) => Draft<o>): Workflow<i, o, is> {
		return ([i, is]) => Draft.map<o, StatefulValue<o, is>>(o => [o, is])(f(i, is));
	}

	export function pipeaf<i, o, is = void>(f: (i: i, is: is) => Promise<o>): Workflow<i, o, is> {
		return pipe((i, is) => Draft.from(f(i, is)));
	}

	export function pipef<i, o, is = void>(f: (i: i, is: is) => o): Workflow<i, o, is> {
		return pipeaf(async (i, is) => f(i, is));
	}
}
