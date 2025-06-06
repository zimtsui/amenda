import { Draft } from './draft.ts';


export type Workflow<input, output> = (input: input) => Draft<output>;

export class Controlflow<input, output> {
	public get callback(): (input: input) => Promise<output> {
		return (input) => Draft.to(this.workflow(input));
	}

	private constructor(public workflow: Workflow<input, output>) {}

	public append<nextOutput>(nextworkflow: Workflow<output, nextOutput>): Controlflow<input, nextOutput> {
		const kleisli = Draft.map(nextworkflow);
		return new Controlflow(input => Draft.mu(kleisli(this.workflow(input))));
	}

	public static append<input, output>(workflow: Workflow<input, output>) {
		return new Controlflow(workflow);
	}

	public pipe<nextOutput>(f: (output: output) => Promise<nextOutput>): Controlflow<input, nextOutput> {
		return this.append(output => Draft.from(f(output)));
	}

	public static pipe<input, output>(f: (input: input) => Promise<output>): Controlflow<input, output> {
		return new Controlflow(input => Draft.from(f(input)));
	}

	public by<nextOutput>(evaluate: Draft.Morphism<output, nextOutput>): Controlflow<input, nextOutput> {
		return new Controlflow(input => evaluate(this.workflow(input)));
	}

	public static by<input, output>(evaluate: Draft.Morphism<input, output>): Controlflow<input, output> {
		return new Controlflow(input => evaluate(Draft.eta(input)));
	}

	public map<nextOutput>(f: (output: output) => nextOutput): Controlflow<input, nextOutput> {
		return this.by(Draft.map(f));
	}

	public static map<input, output>(f: (output: input) => output): Controlflow<input, output> {
		return Controlflow.by(Draft.map(f));
	}
}
