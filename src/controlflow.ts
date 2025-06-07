import { Draft } from './draft.ts';
import { Rejected } from './exceptions.ts';
import { Workflow, type StatefulValue } from "./workflow.ts";



export class Controlflow<i, o, is = void, os = is> {
	private constructor(private workflow: Workflow<i, o, is, os>) {}

	public callback = (i: i, is: is): Promise<o> => Draft.to(this.workflow([i, is])).then(([o, os]) => o);

	private append<nexto, nextos>(next: Workflow<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return new Controlflow(si => Draft.mu(Draft.map(next)(this.workflow(si))));
	}
	private static append<i, o, is, os>(workflow: Workflow<i, o, is, os>): Controlflow<i, o, is, os> {
		return new Controlflow(workflow);
	}

	public then<nexto, nextos>(f: Controlflow.StatefulGeneratorFunction<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.append(Workflow.then(f));
	}
	public static then<i, o, is = void, os = is>(f: Controlflow.StatefulGeneratorFunction<i, o, is, os>): Controlflow<i, o, is, os> {
		return Controlflow.append(Workflow.then(f));
	}

	public thenaf<nexto, nextos>(f: Controlflow.StatefulAsyncFunction<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.append(Workflow.thenaf(f));
	}
	public static thenaf<i, o, is = void, os = is>(f: Controlflow.StatefulAsyncFunction<i, o, is, os>): Controlflow<i, o, is, os> {
		return Controlflow.append(Workflow.thenaf(f));
	}

	public thenf<nexto, nextos>(f: Controlflow.StatefulSyncFunction<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.append(Workflow.thenf(f));
	}
	public static thenf<i, o, is = void, os = is>(f: Controlflow.StatefulSyncFunction<i, o, is, os>): Controlflow<i, o, is, os> {
		return Controlflow.append(Workflow.thenf(f));
	}

	public by<nexto, nextos>(f: Draft.Morphism<StatefulValue<o, os>, StatefulValue<nexto, nextos>>): Controlflow<i, nexto, is, nextos> {
		return new Controlflow(si => f(this.workflow(si)));
	}
	public static by<i, o, is = void, os = is>(f: Draft.Morphism<StatefulValue<i, is>, StatefulValue<o, os>>): Controlflow<i, o, is, os> {
		return new Controlflow(si => f(Draft.eta(si)));
	}

	public pipe<nexto>(f: Controlflow.StatelessGeneratorFunction<o, nexto, os>): Controlflow<i, nexto, is, os> {
		return this.append(Workflow.pipe(f));
	}
	public static pipe<i, o, is = void>(f: Controlflow.StatelessGeneratorFunction<i, o, is>): Controlflow<i, o, is> {
		return Controlflow.append(Workflow.pipe(f));
	}

	public pipeaf<nexto>(f: Controlflow.StatelessAsyncFunction<o, nexto, os>): Controlflow<i, nexto, is, os> {
		return this.append(Workflow.pipeaf(f));
	}
	public static pipeaf<i, o, is = void>(f: Controlflow.StatelessAsyncFunction<i, o, is>): Controlflow<i, o, is> {
		return Controlflow.append(Workflow.pipeaf(f));
	}

	public pipef<nexto>(f: Controlflow.StatelessSyncFunction<o, nexto, os>): Controlflow<i, nexto, is, os> {
		return this.append(Workflow.pipef(f));
	}
	public static pipef<i, o, is = void>(f: Controlflow.StatelessSyncFunction<i, o, is>): Controlflow<i, o, is> {
		return Controlflow.append(Workflow.pipef(f));
	}
}

export namespace Controlflow {
	export type StatefulGeneratorFunction<i, o, is = void, os = is> = (i: i, is: is) => AsyncGenerator<StatefulValue<o, os>, never, Rejected>;
	export type StatefulAsyncFunction<i, o, is = void, os = is> = (i: i, is: is) => Promise<StatefulValue<o, os>>;
	export type StatefulSyncFunction<i, o, is = void, os = is> = (i: i, is: is) => StatefulValue<o, os>;
	export type StatelessGeneratorFunction<i, o, is = void> = (i: i, is: is) => AsyncGenerator<o, never, Rejected>;
	export type StatelessAsyncFunction<i, o, is = void> = (i: i, is: is) => Promise<o>;
	export type StatelessSyncFunction<i, o, is = void> = (i: i, is: is) => o;
	export type EvaluatorFunction<i, o, is = void, os = is> = (draft: Draft<StatefulValue<i, is>>) => Draft<StatefulValue<o, os>>;
}
