import { Draft } from './draft.ts';
import { Rejected } from './exceptions.ts';
import { resume } from './resume.ts';



export type StatefulValue<value, state = void> = [value, state];
export type Amenda<value, state = void> = Draft<StatefulValue<value, state>>;
export type Workflow<i, o, is = void, os = is> = (amenda: Amenda<i, is>) => Amenda<o, os>;

export namespace Workflow {
	export function sthen<i, o, is = void, os = is>(f: StatefulAsyncGeneratorFunction<i, o, is, os>): Workflow<i, o, is, os> {
		return amenda => Draft.mu(Draft.map<StatefulValue<i, is>, Amenda<o, os>>(([i, is]) => f(i, is))(amenda));
	}

	export function stransform<i, o, is = void, os = is>(f: StatefulAsyncFunction<i, o, is, os>): Workflow<i, o, is, os> {
		return sthen<i, o, is, os>((i, is) => Draft.from(f(i, is)));
	}

	export function smap<i, o, is = void, os = is>(f: StatefulSyncFunction<i, o, is, os>): Workflow<i, o, is, os> {
		return stransform(async (i, is) => f(i, is));
	}

	export function then<i, o, is = void>(f: StatelessAsyncGeneratorFunction<i, o, is>): Workflow<i, o, is> {
		return sthen((i, is) => Draft.map<o, StatefulValue<o, is>>(o => [o, is])(f(i, is)));
	}

	export function transform<i, o, is = void>(f: StatelessAsyncFunction<i, o, is>): Workflow<i, o, is> {
		return then((i, is) => Draft.from(f(i, is)));
	}

	export function map<i, o, is = void>(f: StatelessSyncFunction<i, o, is>): Workflow<i, o, is> {
		return transform(async (i, is) => f(i, is));
	}

	export type StatefulAsyncGeneratorFunction<i, o, is, os> = (i: i, is: is) => Amenda<o, os>;
	export type StatefulAsyncFunction<i, o, is, os> = (i: i, is: is) => Promise<StatefulValue<o, os>>;
	export type StatefulSyncFunction<i, o, is, os> = (i: i, is: is) => StatefulValue<o, os>;
	export type StatelessAsyncGeneratorFunction<i, o, is> = (i: i, is: is) => AsyncGenerator<o, never, Rejected>;
	export type StatelessAsyncFunction<i, o, is> = (i: i, is: is) => Promise<o>;
	export type StatelessSyncFunction<i, o, is> = (i: i, is: is) => o;
}
