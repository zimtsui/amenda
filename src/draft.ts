import { Finalized, Downstream, Upstream } from './exceptions.ts';


/**
 * Draft functor
 */
export type Draft<t> = AsyncGenerator<t, never, Upstream>;
export namespace Draft {

	/**
	 * Natural transformation from Identity to Draft
	 */
	export async function *eta<t>(x: t): Draft<t> {
		throw yield x;
	}

	/**
	 * Natural transformation from Draft^2 to Draft
	 */
	export async function *mu<t>(draftdraft: Draft<Draft<t>>): Draft<t> {
		for (let pp = draftdraft.next();;) try {
			const draft = await pp.then(rr => rr.value);
			try {
				for (let p = draft.next();;) try {
					p = draft.next(yield await p.then(r => r.value));
				} catch (e) {
					if (e instanceof Downstream) p = draft.next(yield Promise.reject(e));
					else throw await draft.throw(e).then(() => e);
				}
			} catch (e) {
				if (e instanceof Upstream) pp = draftdraft.next(e);
				else throw e;
			}
		} catch (e) {
			if (e instanceof Downstream) pp = draftdraft.next(yield Promise.reject(e));
			else throw await draftdraft.throw(e).then(() => e);
		}
	}

	/**
	 * Map a morphism to Draft Category
	 */
	export function map<i, o>(f: (i: i) => o): (draft: Draft<i>) => Draft<o> {
		return async function *morphism(draft: Draft<i>) {
			for (let p = draft.next();;) try {
				const i = await p.then(r => r.value);
				try {
					p = draft.next(yield f(i as i));
				} catch (e) {
					if (e instanceof Upstream) p = draft.next(e);
					else throw e;
				}
			} catch (e) {
				if (e instanceof Downstream) p = draft.next(yield Promise.reject(e));
				else throw await draft.throw(e).then(() => e);
			}
		}
	}

	/**
	 * Natural transformation from Promise to Draft
	 */
	export async function *from<t>(promise: Promise<t>): Draft<t> {
		throw yield promise;
	}

	/**
	 * Natural transformation from Draft to Promise
	 */
	export async function to<t>(draft: Draft<t>): Promise<t> {
		const r = await draft.next();
		await draft.throw(new Finalized()).catch(e => e instanceof Finalized ? Promise.resolve() : Promise.reject(e));
		return Promise.resolve(r.value) as Promise<t>;
	}

}
