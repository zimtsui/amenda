import { Draft } from './draft.ts';


export type Amenda<value, state = void> = Draft<[value, state]>;


export class Controlflow<o = void, os = void> {
	public constructor(public amenda: Amenda<o, os>) {}
	public static of<o, os>(o: o, os: os): Controlflow<o, os> {
		return new Controlflow(Draft.eta([o, os]));
	}
	public static from<o>(o: o): Controlflow<o, void> {
		return Controlflow.of<o, void>(o, undefined);
	}
	public static create(): Controlflow<void, void> {
		return Controlflow.from<void>(undefined);
	}
	public first(): Promise<o> {
		return Draft.to(this.amenda).then(([o]) => o);
	}

	/**
	 * Appends a workflow
	 * @returns A new Controlflow instance
	 */
	public pipe<nexto, nextos>(f: (amenda: Amenda<o, os>) => Amenda<nexto, nextos>): Controlflow<nexto, nextos> {
		return new Controlflow(f(this.amenda));
	}

	/**
	 * Appends a stateful async generator function
	 * @returns A new Controlflow instance
	 */
	public sthen<nexto, nextos>(f: (o: o, os: os) => Amenda<nexto, nextos>): Controlflow<nexto, nextos> {
		return new Controlflow(Draft.mu(Draft.map<[o, os], Amenda<nexto, nextos>>(([o, os]) => f(o, os))(this.amenda)));
	}

	/**
	 * Appends a stateful async function
	 * @returns A new Controlflow instance
	 */
	public stransform<nexto, nextos>(f: (o: o, os: os) => Promise<[nexto, nextos]>): Controlflow<nexto, nextos> {
		return this.sthen((o, os) => Draft.from(f(o, os)));
	}

	/**
	 * Appends a stateful sync function
	 * @returns A new Controlflow instance
	 */
	public smap<nexto, nextos>(f: (o: o, os: os) => [nexto, nextos]): Controlflow<nexto, nextos> {
		return this.stransform((o, os) => Promise.resolve(f(o, os)));
	}

	/**
	 * Appends a stateless generator function
	 * @returns A new Controlflow instance
	 */
	public then<nexto>(f: (o: o, os: os) => Draft<nexto>): Controlflow<nexto, os> {
		return this.sthen((o, os) => Draft.map<nexto, [nexto, os]>(nexto => [nexto, os])(f(o, os)));
	}

	/**
	 * Appends a stateless async function
	 * @returns A new Controlflow instance
	 */
	public transform<nexto>(f: (o: o, os: os) => Promise<nexto>): Controlflow<nexto, os> {
		return this.then((o, os) => Draft.from(f(o, os)));
	}

	/**
	 * Appends a stateless sync function
	 * @returns A new Controlflow instance
	 */
	public map<nexto>(f: (o: o, os: os) => nexto): Controlflow<nexto, os> {
		return this.transform((o, os) => Promise.resolve(f(o, os)));
	}
}
