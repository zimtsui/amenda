import { Draft } from './draft.ts';
import { Workflow } from './workflow.ts';


export class Controlflow<i = void, o = void, is = void, os = void> {
	private constructor(private workflow: Workflow<i, o, is, os>) {}

	public callback = (i: i, is: is): Promise<o> => Draft.to(this.workflow(Draft.eta([i, is]))).then(([o]) => o);

	/**
	 * Appends a workflow
	 * @returns A new Controlflow instance
	 */
	public pipe<nexto, nextos>(f: Workflow<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return new Controlflow(amenda => f(this.workflow(amenda)));
	}
	/**
	 * Appends a workflow
	 * @returns A new Controlflow instance
	 */
	public static pipe<i = void, o = void, is = void, os = void>(f: Workflow<i, o, is, os>): Controlflow<i, o, is, os> {
		return new Controlflow(f);
	}

	/**
	 * Appends a Controlflow
	 * @returns A new Controlflow instance
	 */
	public append<nexto, nextos>(cf: Controlflow<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.pipe(cf.workflow);
	}
	/**
	 * Appends a Controlflow
	 * @returns A new Controlflow instance
	 */
	public static append<i = void, o = void, is = void, os = void>(cf: Controlflow<i, o, is, os>): Controlflow<i, o, is, os> {
		return cf;
	}

	/**
	 * Appends a stateful async generator function
	 * @returns A new Controlflow instance
	 */
	public sthen<nexto, nextos>(f: Workflow.StatefulAsyncGeneratorFunction<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.pipe(Workflow.sthen(f));
	}
	/**
	 * Appends a stateful async generator function
	 * @returns A new Controlflow instance
	 */
	public static sthen<i = void, o = void, is = void, os = void>(f: Workflow.StatefulAsyncGeneratorFunction<i, o, is, os>): Controlflow<i, o, is, os> {
		return Controlflow.pipe(Workflow.sthen(f));
	}

	/**
	 * Appends a stateful async function
	 * @returns A new Controlflow instance
	 */
	public stransform<nexto, nextos>(f: Workflow.StatefulAsyncFunction<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.pipe(Workflow.stransform(f));
	}
	/**
	 * Appends a stateful async function
	 * @returns A new Controlflow instance
	 */
	public static stransform<i = void, o = void, is = void, os = void>(f: Workflow.StatefulAsyncFunction<i, o, is, os>): Controlflow<i, o, is, os> {
		return Controlflow.pipe(Workflow.stransform(f));
	}

	/**
	 * Appends a stateful sync function
	 * @returns A new Controlflow instance
	 */
	public smap<nexto, nextos>(f: Workflow.StatefulSyncFunction<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.pipe(Workflow.smap(f));
	}
	/**
	 * Appends a stateful sync function
	 * @returns A new Controlflow instance
	 */
	public static smap<i = void, o = void, is = void, os = void>(f: Workflow.StatefulSyncFunction<i, o, is, os>): Controlflow<i, o, is, os> {
		return Controlflow.pipe(Workflow.smap(f));
	}


	/**
	 * Appends a stateless generator function
	 * @returns A new Controlflow instance
	 */
	public then<nexto>(f: Workflow.StatelessAsyncGeneratorFunction<o, nexto, os>): Controlflow<i, nexto, is, os> {
		return this.pipe(Workflow.then(f));
	}
	/**
	 * Appends a stateless generator function
	 * @returns A new Controlflow instance
	 */
	public static then<i = void, o = void, is = void>(f: Workflow.StatelessAsyncGeneratorFunction<i, o, is>): Controlflow<i, o, is, is> {
		return Controlflow.pipe(Workflow.then(f));
	}

	/**
	 * Appends a stateless async function
	 * @returns A new Controlflow instance
	 */
	public transform<nexto>(f: Workflow.StatelessAsyncFunction<o, nexto, os>): Controlflow<i, nexto, is, os> {
		return this.pipe(Workflow.transform(f));
	}
	/**
	 * Appends a stateless async function
	 * @returns A new Controlflow instance
	 */
	public static transform<i = void, o = void, is = void>(f: Workflow.StatelessAsyncFunction<i, o, is>): Controlflow<i, o, is, is> {
		return Controlflow.pipe(Workflow.transform(f));
	}

	/**
	 * Appends a stateless sync function
	 * @returns A new Controlflow instance
	 */
	public map<nexto>(f: Workflow.StatelessSyncFunction<o, nexto, os>): Controlflow<i, nexto, is, os> {
		return this.pipe(Workflow.map(f));
	}
	/**
	 * Appends a stateless sync function
	 * @returns A new Controlflow instance
	 */
	public static map<i = void, o = void, is = void>(f: Workflow.StatelessSyncFunction<i, o, is>): Controlflow<i, o, is, is> {
		return Controlflow.pipe(Workflow.map(f));
	}

}
