import { Draft } from './draft.ts';
import { Rejected } from './exceptions.ts';
import { Workflow, type StatefulValue } from "./workflow.ts";



export class Controlflow<i, o, is = void, os = is> {
	private constructor(public workflow: Workflow<i, o, is, os>) {}

	public callback(is: is): (i: i) => Promise<o> {
		return async i => Draft.to(this.workflow([i, is])).then(([o, os]) => o);
	}

	public append<nexto, nextos>(next: Workflow<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return new Controlflow(si => Draft.mu(Draft.map(next)(this.workflow(si))));
	}
	public static append<i, o, is, os>(workflow: Workflow<i, o, is, os>): Controlflow<i, o, is, os> {
		return new Controlflow(workflow);
	}

	public then<nexto, nextos>(f: Controlflow.StatefulGeneratorFunction<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.append(Workflow.then(f));
	}
	public static then<i, o, is, os>(f: Controlflow.StatefulGeneratorFunction<i, o, is, os>): Controlflow<i, o, is, os> {
		return Controlflow.append(Workflow.then(f));
	}

	public thenaf<nexto, nextos>(f: Controlflow.StatefulAsyncFunction<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.append(Workflow.thenaf(f));
	}
	public static thenaf<i, o, is, os>(f: Controlflow.StatefulAsyncFunction<i, o, is, os>): Controlflow<i, o, is, os> {
		return Controlflow.append(Workflow.thenaf(f));
	}

	public thensf<nexto, nextos>(f: Controlflow.StatefulSyncFunction<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.append(Workflow.thensf(f));
	}
	public static thensf<i, o, is, os>(f: Controlflow.StatefulSyncFunction<i, o, is, os>): Controlflow<i, o, is, os> {
		return Controlflow.append(Workflow.thensf(f));
	}

	public by<nexto, nextos>(f: Draft.Morphism<StatefulValue<o, os>, StatefulValue<nexto, nextos>>): Controlflow<i, nexto, is, nextos> {
		return new Controlflow(si => f(this.workflow(si)));
	}
	public static by<i, o, is, os>(f: Draft.Morphism<StatefulValue<i, is>, StatefulValue<o, os>>): Controlflow<i, o, is, os> {
		return new Controlflow(si => f(Draft.eta(si)));
	}

	public pipe<nexto>(f: Controlflow.StatelessGeneratorFunction<o, nexto, os>): Controlflow<i, nexto, is, os> {
		return this.append(Workflow.pipe(f));
	}
	public static pipe<i, o, is>(f: Controlflow.StatelessGeneratorFunction<i, o, is>): Controlflow<i, o, is> {
		return Controlflow.append(Workflow.pipe(f));
	}

	public pipeaf<nexto>(f: Controlflow.StatelessAsyncFunction<o, nexto, os>): Controlflow<i, nexto, is, os> {
		return this.append(Workflow.pipeaf(f));
	}
	public static pipeaf<i, o, is>(f: Controlflow.StatelessAsyncFunction<i, o, is>): Controlflow<i, o, is, is> {
		return Controlflow.append(Workflow.pipeaf(f));
	}

	public pipesf<nexto>(f: Controlflow.StatelessSyncFunction<o, nexto, os>): Controlflow<i, nexto, is, os> {
		return this.append(Workflow.pipesf(f));
	}
	public static pipesf<i, o, is>(f: Controlflow.StatelessSyncFunction<i, o, is>): Controlflow<i, o, is> {
		return Controlflow.append(Workflow.pipesf(f));
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
