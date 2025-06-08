import { Draft } from './draft.ts';
import { Rejected } from './exceptions.ts';



export type StatefulValue<value, state = void> = [value, state];
export type Workflow<i, o, is = void, os = is> = Draft.Kleisli<StatefulValue<i, is>, StatefulValue<o, os>>;

export namespace Workflow {
	export function sthen<i, o, is = void, os = is>(f: StatefulAsyncGeneratorFunction<i, o, is, os>): Workflow<i, o, is, os> {
		return ([i, is]) => f(i, is);
	}

	export function stransform<i, o, is = void, os = is>(f: StatefulAsyncFunction<i, o, is, os>): Workflow<i, o, is, os> {
		return ([i, is]) => Draft.from(f(i, is));
	}

	export function smap<i, o, is = void, os = is>(f: StatefulSyncFunction<i, o, is, os>): Workflow<i, o, is, os> {
		return stransform(async (i, is) => f(i, is));
	}

	export function then<i, o, is = void>(f: StatelessAsyncGeneratorFunction<i, o, is>): Workflow<i, o, is> {
		return ([i, is]) => Draft.map<o, StatefulValue<o, is>>(o => [o, is])(f(i, is));
	}

	export function transform<i, o, is = void>(f: StatelessAsyncFunction<i, o, is>): Workflow<i, o, is> {
		return then((i, is) => Draft.from(f(i, is)));
	}

	export function map<i, o, is = void>(f: StatelessSyncFunction<i, o, is>): Workflow<i, o, is> {
		return transform(async (i, is) => f(i, is));
	}

	export type StatefulAsyncGeneratorFunction<i, o, is, os> = (i: i, is: is) => AsyncGenerator<StatefulValue<o, os>, never, Rejected>;
	export type StatefulAsyncFunction<i, o, is, os> = (i: i, is: is) => Promise<StatefulValue<o, os>>;
	export type StatefulSyncFunction<i, o, is, os> = (i: i, is: is) => StatefulValue<o, os>;
	export type StatelessAsyncGeneratorFunction<i, o, is> = (i: i, is: is) => AsyncGenerator<o, never, Rejected>;
	export type StatelessAsyncFunction<i, o, is> = (i: i, is: is) => Promise<o>;
	export type StatelessSyncFunction<i, o, is> = (i: i, is: is) => o;
	export type IterationFunction<i, o, is, os> = Draft.Morphism<StatefulValue<i, is>, StatefulValue<o, os>>;
}
