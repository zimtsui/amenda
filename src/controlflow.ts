import { Draft } from './draft.ts';
import { Rejected } from './exceptions.ts';
import { Workflow, type StatefulValue } from "./workflow.ts";



export class Controlflow<i = void, o = void, is = void, os = void> {
	private constructor(private workflow: Workflow<i, o, is, os>) {}

	public callback = (i: i, is: is): Promise<o> => Draft.to(this.workflow([i, is])).then(([o, os]) => o);

	private append<nexto, nextos>(next: Workflow<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return new Controlflow(si => Draft.mu(Draft.map(next)(this.workflow(si))));
	}
	private static append<i = void, o = void, is = void, os = void>(workflow: Workflow<i, o, is, os>): Controlflow<i, o, is, os> {
		return new Controlflow(workflow);
	}

	/**
	 * Appends a stateful async generator function to the workflow
	 * @returns A new Controlflow instance
	 */
	public then<nexto, nextos>(f: Controlflow.StatefulGeneratorFunction<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.append(Workflow.then(f));
	}
	/**
	 * Appends a stateful async generator function to the workflow
	 * @returns A new Controlflow instance
	 */
	public static then<i = void, o = void, is = void, os = void>(f: Controlflow.StatefulGeneratorFunction<i, o, is, os>): Controlflow<i, o, is, os> {
		return Controlflow.append(Workflow.then(f));
	}

	/**
	 * Appends a stateful async function to the workflow
	 * @returns A new Controlflow instance
	 */
	public thenaf<nexto, nextos>(f: Controlflow.StatefulAsyncFunction<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.append(Workflow.thenaf(f));
	}
	/**
	 * Appends a stateful async function to the workflow
	 * @returns A new Controlflow instance
	 */
	public static thenaf<i = void, o = void, is = void, os = void>(f: Controlflow.StatefulAsyncFunction<i, o, is, os>): Controlflow<i, o, is, os> {
		return Controlflow.append(Workflow.thenaf(f));
	}

	/**
	 * Appends a stateful sync function to the workflow
	 * @returns A new Controlflow instance
	 */
	public thenf<nexto, nextos>(f: Controlflow.StatefulSyncFunction<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.append(Workflow.thenf(f));
	}
	/**
	 * Appends a stateful sync function to the workflow
	 * @returns A new Controlflow instance
	 */
	public static thenf<i = void, o = void, is = void, os = void>(f: Controlflow.StatefulSyncFunction<i, o, is, os>): Controlflow<i, o, is, os> {
		return Controlflow.append(Workflow.thenf(f));
	}

	/**
	 * Appends an evaluator function to the workflow
	 * @returns A new Controlflow instance
	 */
	public by<nexto, nextos>(f: Controlflow.EvaluatorFunction<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return new Controlflow(si => f(this.workflow(si)));
	}
	/**
	 * Appends an evaluator function to the workflow
	 * @returns A new Controlflow instance
	 */
	public static by<i = void, o = void, is = void, os = void>(f: Controlflow.EvaluatorFunction<i, o, is, os>): Controlflow<i, o, is, os> {
		return new Controlflow(si => f(Draft.eta(si)));
	}

	/**
	 * Appends a stateless generator function to the workflow
	 * @returns A new Controlflow instance
	 */
	public pipe<nexto>(f: Controlflow.StatelessGeneratorFunction<o, nexto, os>): Controlflow<i, nexto, is, os> {
		return this.append(Workflow.pipe(f));
	}
	/**
	 * Appends a stateless generator function to the workflow
	 * @returns A new Controlflow instance
	 */
	public static pipe<i = void, o = void, is = void>(f: Controlflow.StatelessGeneratorFunction<i, o, is>): Controlflow<i, o, is, is> {
		return Controlflow.append(Workflow.pipe(f));
	}

	/**
	 * Appends a stateless async generator function to the workflow
	 * @returns A new Controlflow instance
	 */
	public pipeaf<nexto>(f: Controlflow.StatelessAsyncFunction<o, nexto, os>): Controlflow<i, nexto, is, os> {
		return this.append(Workflow.pipeaf(f));
	}
	/**
	 * Appends a stateless async generator function to the workflow
	 * @returns A new Controlflow instance
	 */
	public static pipeaf<i = void, o = void, is = void>(f: Controlflow.StatelessAsyncFunction<i, o, is>): Controlflow<i, o, is, is> {
		return Controlflow.append(Workflow.pipeaf(f));
	}

	/**
	 * Appends a stateless sync function to the workflow
	 * @returns A new Controlflow instance
	 */
	public pipef<nexto>(f: Controlflow.StatelessSyncFunction<o, nexto, os>): Controlflow<i, nexto, is, os> {
		return this.append(Workflow.pipef(f));
	}
	/**
	 * Appends a stateless sync function to the workflow
	 * @returns A new Controlflow instance
	 */
	public static pipef<i = void, o = void, is = void>(f: Controlflow.StatelessSyncFunction<i, o, is>): Controlflow<i, o, is, is> {
		return Controlflow.append(Workflow.pipef(f));
	}
}

export namespace Controlflow {
	export type StatefulGeneratorFunction<i, o, is, os> = (i: i, is: is) => AsyncGenerator<StatefulValue<o, os>, never, Rejected>;
	export type StatefulAsyncFunction<i, o, is, os> = (i: i, is: is) => Promise<StatefulValue<o, os>>;
	export type StatefulSyncFunction<i, o, is, os> = (i: i, is: is) => StatefulValue<o, os>;
	export type StatelessGeneratorFunction<i, o, is> = (i: i, is: is) => AsyncGenerator<o, never, Rejected>;
	export type StatelessAsyncFunction<i, o, is> = (i: i, is: is) => Promise<o>;
	export type StatelessSyncFunction<i, o, is> = (i: i, is: is) => o;
	export type EvaluatorFunction<i, o, is, os> = Draft.Morphism<StatefulValue<i, is>, StatefulValue<o, os>>;
}
