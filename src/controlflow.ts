import { Draft } from './draft.ts';
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

	public then<nexto, nextos>(f: (o: o, os: os) => Draft<StatefulValue<nexto, nextos>>): Controlflow<i, nexto, is, nextos> {
		return this.append(Workflow.then(f));
	}
	public static then<i, o, is, os>(f: (i: i, is: is) => Draft<StatefulValue<o, os>>): Controlflow<i, o, is, os> {
		return Controlflow.append(Workflow.then(f));
	}

	public thenaf<nexto, nextos>(f: (o: o, os: os) => Promise<StatefulValue<nexto, nextos>>): Controlflow<i, nexto, is, nextos> {
		return this.append(Workflow.thenaf(f));
	}
	public static thenaf<i, o, is, os>(f: (i: i, is: is) => Promise<StatefulValue<o, os>>): Controlflow<i, o, is, os> {
		return Controlflow.append(Workflow.thenaf(f));
	}

	public thensf<nexto, nextos>(f: (o: o, os: os) => StatefulValue<nexto, nextos>): Controlflow<i, nexto, is, nextos> {
		return this.append(Workflow.thensf(f));
	}
	public static thensf<i, o, is, os>(f: (i: i, is: is) => StatefulValue<o, os>): Controlflow<i, o, is, os> {
		return Controlflow.append(Workflow.thensf(f));
	}

	public by<nexto, nextos>(f: Draft.Morphism<StatefulValue<o, os>, StatefulValue<nexto, nextos>>): Controlflow<i, nexto, is, nextos> {
		return new Controlflow(si => f(this.workflow(si)));
	}
	public static by<i, o, is, os>(f: Draft.Morphism<StatefulValue<i, is>, StatefulValue<o, os>>): Controlflow<i, o, is, os> {
		return new Controlflow(si => f(Draft.eta(si)));
	}

	public pipe<nexto>(f: (o: o, os: os) => Draft<nexto>): Controlflow<i, nexto, is, os> {
		return this.append(Workflow.pipe(f));
	}
	public static pipe<i, o, is>(f: (i: i, is: is) => Draft<o>): Controlflow<i, o, is> {
		return Controlflow.append(Workflow.pipe(f));
	}

	public pipeaf<nexto>(f: (o: o, os: os) => Promise<nexto>): Controlflow<i, nexto, is, os> {
		return this.append(Workflow.pipeaf(f));
	}
	public static pipeaf<i, o, is>(f: (i: i, is: is) => Promise<o>): Controlflow<i, o, is, is> {
		return Controlflow.append(Workflow.pipeaf(f));
	}

	public pipesf<nexto>(f: (o: o, os: os) => nexto): Controlflow<i, nexto, is, os> {
		return this.append(Workflow.pipesf(f));
	}
	public static pipesf<i, o, is>(f: (i: i, is: is) => o): Controlflow<i, o, is> {
		return Controlflow.append(Workflow.pipesf(f));
	}
}
