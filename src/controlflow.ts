import { Draft } from './draft.ts';
import { Workflow, type StatefulValue } from "./workflow.ts";



export class Controlflow<i = void, o = void, is = void, os = void> {
	private constructor(private workflow: Workflow<i, o, is, os>) {}

	public callback = (i: i, is: is): Promise<o> => Draft.to(this.workflow([i, is])).then(([o, os]) => o);

	private use<nexto, nextos>(next: Workflow<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return new Controlflow(si => Draft.mu(Draft.map(next)(this.workflow(si))));
	}
	private static use<i = void, o = void, is = void, os = void>(workflow: Workflow<i, o, is, os>): Controlflow<i, o, is, os> {
		return new Controlflow(workflow);
	}

	/**
	 * Appends a Controlflow
	 * @returns A new Controlflow instance
	 */
	public append<nexto, nextos>(cf: Controlflow<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.use(cf.workflow);
	}

	/**
	 * Appends a stateful async generator function to the workflow
	 * @returns A new Controlflow instance
	 */
	public sthen<nexto, nextos>(f: Workflow.StatefulAsyncGeneratorFunction<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.use(Workflow.sthen(f));
	}
	/**
	 * Appends a stateful async generator function to the workflow
	 * @returns A new Controlflow instance
	 */
	public static sthen<i = void, o = void, is = void, os = void>(f: Workflow.StatefulAsyncGeneratorFunction<i, o, is, os>): Controlflow<i, o, is, os> {
		return Controlflow.use(Workflow.sthen(f));
	}

	/**
	 * Appends a stateful async function to the workflow
	 * @returns A new Controlflow instance
	 */
	public stransform<nexto, nextos>(f: Workflow.StatefulAsyncFunction<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.use(Workflow.stransform(f));
	}
	/**
	 * Appends a stateful async function to the workflow
	 * @returns A new Controlflow instance
	 */
	public static stransform<i = void, o = void, is = void, os = void>(f: Workflow.StatefulAsyncFunction<i, o, is, os>): Controlflow<i, o, is, os> {
		return Controlflow.use(Workflow.stransform(f));
	}

	/**
	 * Appends a stateful sync function to the workflow
	 * @returns A new Controlflow instance
	 */
	public smap<nexto, nextos>(f: Workflow.StatefulSyncFunction<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.use(Workflow.smap(f));
	}
	/**
	 * Appends a stateful sync function to the workflow
	 * @returns A new Controlflow instance
	 */
	public static smap<i = void, o = void, is = void, os = void>(f: Workflow.StatefulSyncFunction<i, o, is, os>): Controlflow<i, o, is, os> {
		return Controlflow.use(Workflow.smap(f));
	}

	/**
	 * Appends an evaluator function to the workflow
	 * @returns A new Controlflow instance
	 */
	public pipe<nexto, nextos>(f: Workflow.IterationFunction<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		async function *workflow(this: Controlflow<i, o, is, os>, si: StatefulValue<i, is>): Draft<StatefulValue<nexto, nextos>> {
			const draft = f(this.workflow(si));
			try {
				throw yield *draft;
			} catch (e) {
				throw await draft.throw(e).then(() => e);
			}
		}
		return new Controlflow(workflow.bind(this));
	}
	/**
	 * Appends an evaluator function to the workflow
	 * @returns A new Controlflow instance
	 */
	public static pipe<i = void, o = void, is = void, os = void>(f: Workflow.IterationFunction<i, o, is, os>): Controlflow<i, o, is, os> {
		return new Controlflow(si => f(Draft.eta(si)));
	}

	/**
	 * Appends a stateless generator function to the workflow
	 * @returns A new Controlflow instance
	 */
	public then<nexto>(f: Workflow.StatelessAsyncGeneratorFunction<o, nexto, os>): Controlflow<i, nexto, is, os> {
		return this.use(Workflow.then(f));
	}
	/**
	 * Appends a stateless generator function to the workflow
	 * @returns A new Controlflow instance
	 */
	public static then<i = void, o = void, is = void>(f: Workflow.StatelessAsyncGeneratorFunction<i, o, is>): Controlflow<i, o, is, is> {
		return Controlflow.use(Workflow.then(f));
	}

	/**
	 * Appends a stateless async generator function to the workflow
	 * @returns A new Controlflow instance
	 */
	public transform<nexto>(f: Workflow.StatelessAsyncFunction<o, nexto, os>): Controlflow<i, nexto, is, os> {
		return this.use(Workflow.transform(f));
	}
	/**
	 * Appends a stateless async generator function to the workflow
	 * @returns A new Controlflow instance
	 */
	public static transform<i = void, o = void, is = void>(f: Workflow.StatelessAsyncFunction<i, o, is>): Controlflow<i, o, is, is> {
		return Controlflow.use(Workflow.transform(f));
	}

	/**
	 * Appends a stateless sync function to the workflow
	 * @returns A new Controlflow instance
	 */
	public map<nexto>(f: Workflow.StatelessSyncFunction<o, nexto, os>): Controlflow<i, nexto, is, os> {
		return this.use(Workflow.map(f));
	}
	/**
	 * Appends a stateless sync function to the workflow
	 * @returns A new Controlflow instance
	 */
	public static map<i = void, o = void, is = void>(f: Workflow.StatelessSyncFunction<i, o, is>): Controlflow<i, o, is, is> {
		return Controlflow.use(Workflow.map(f));
	}
}
