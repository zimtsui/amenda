import { Draft } from './draft.ts';
import { Scoped } from "./scoped.js";
import { type Amenda } from "./amenda.js";


export type Workflow<i, o, is = void, os = void> = (i: i, si: is) => Amenda<o, os>;


export class Controlflow<i, o, is = void, os = void> {
	private constructor(public kleisli: (si: Scoped<is, i>) => Amenda<o, os>) {}

	public callback(is: is): (i: i) => Promise<o> {
		return async i => Draft.to(this.kleisli(Scoped.of(i, is))).then(Scoped.epsilon);
	}


	public append<nexto, nextos = void>(nextworkflow: Workflow<o, nexto, os, nextos>): Controlflow<i, nexto, is, nextos> {
		const kleisli = Draft.map((so: Scoped<os, o>) => nextworkflow(so.value, so.state));
		return new Controlflow(si => Draft.mu(kleisli(this.kleisli(si))));
	}

	public static append<i, o, is, os>(workflow: Workflow<i, o, is, os>): Controlflow<i, o, is, os> {
		return new Controlflow(si => workflow(si.value, si.state));
	}

	public pipe<nexto, nextos>(f: (o: o, os: os) => Promise<Scoped<nextos, nexto>>): Controlflow<i, nexto, is, nextos> {
		return this.append((o, os) => Draft.from(f(o, os)));
	}

	public static pipe<i, o, is, os>(f: (i: i, is: is) => Promise<Scoped<os, o>>): Controlflow<i, o, is, os> {
		return Controlflow.append((i, is) => Draft.from(f(i, is)));
	}

	public by<nexto, nextos>(evaluate: Draft.Morphism<Scoped<os, o>, Scoped<nextos, nexto>>): Controlflow<i, nexto, is, nextos> {
		return new Controlflow(si => evaluate(this.kleisli(si)));
	}

	public static by<input, output, is, os>(evaluate: Draft.Morphism<Scoped<is, input>, Scoped<os, output>>): Controlflow<input, output, is, os> {
		return new Controlflow(si => evaluate(Draft.eta(si)));
	}

	public map<nexto, nextos>(f: (o: o, os: os) => Scoped<nextos, nexto>): Controlflow<i, nexto, is, nextos> {
		return this.by(Draft.map(so => f(so.value, so.state)));
	}

	public static map<i, o, is, os>(f: (i: i, is: is) => Scoped<os, o>): Controlflow<i, o, is, os> {
		return Controlflow.by(Draft.map(si => f(si.value, si.state)));
	}
}
