import { Draft } from './draft.ts';



export type Amenda<value, state = void> = Draft<[value, state]>;
export type Workflow<i, o, is, os> = (amenda: Amenda<i, is>) => Amenda<o, os>;

export namespace Workflow {
	export function sthen<i, o, is, os>(f: StatefulAsyncGeneratorFunction<i, o, is, os>): Workflow<i, o, is, os> {
		return amenda => Draft.mu(Draft.map<[i, is], Amenda<o, os>>(([i, is]) => f(i, is))(amenda));
	}

	export function stransform<i, o, is, os>(f: StatefulAsyncFunction<i, o, is, os>): Workflow<i, o, is, os> {
		return sthen<i, o, is, os>((i, is) => Draft.from(f(i, is)));
	}

	export function smap<i, o, is, os>(f: StatefulSyncFunction<i, o, is, os>): Workflow<i, o, is, os> {
		return stransform((i, is) => Promise.resolve(f(i, is)));
	}

	export function then<i, o, is>(f: StatelessAsyncGeneratorFunction<i, o, is>): Workflow<i, o, is, is> {
		return sthen((i, is) => Draft.map<o, [o, is]>(o => [o, is])(f(i, is)));
	}

	export function transform<i, o, is>(f: StatelessAsyncFunction<i, o, is>): Workflow<i, o, is, is> {
		return then((i, is) => Draft.from(f(i, is)));
	}

	export function map<i, o, is>(f: StatelessSyncFunction<i, o, is>): Workflow<i, o, is, is> {
		return transform((i, is) => Promise.resolve(f(i, is)));
	}

	export type StatefulAsyncGeneratorFunction<i, o, is, os> = (i: i, is: is) => Amenda<o, os>;
	export type StatelessAsyncGeneratorFunction<i, o, is> = (i: i, is: is) => Draft<o>;

	export type StatefulAsyncFunction<i, o, is, os> = (i: i, is: is) => Promise<[o, os]>;
	export type StatelessAsyncFunction<i, o, is> = (i: i, is: is) => Promise<o>;

	export type StatefulSyncFunction<i, o, is, os> = (i: i, is: is) => [o, os];
	export type StatelessSyncFunction<i, o, is> = (i: i, is: is) => o;
}
