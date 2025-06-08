import { Finalized, Rejected } from './exceptions.ts';


/**
 * Draft functor
 */
export type Draft<output> = AsyncGenerator<output, never, Rejected>;
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
		for (let r = await draftdraft.next();;) try {
			yield *r.value;
		} catch (e) {
			if (e instanceof Rejected) r = await draftdraft.next(e);
			else throw await draftdraft.throw(e).then(() => e);
		}
	}

	/**
	 * Map a morphism to Draft Category
	 */
	export function map<i, o>(f: (i: i) => o): (draft: Draft<i>) => Draft<o> {
		return async function *morphism(draft: Draft<i>) {
			for (let r = await draft.next();;) try {
				throw yield f(r.value);
			} catch (e) {
				if (e instanceof Rejected) r = await draft.next(e);
				else throw await draft.throw(e).then(() => e);
			}
		}
	}

	/**
	 * Natural transformation from Promise to Draft
	 */
	export async function *from<t>(promise: Promise<t>): Draft<t> {
		throw yield await promise;
	}

	/**
	 * Natural transformation from Draft to Promise
	 */
	export async function to<t>(draft: Draft<t>): Promise<t> {
		const r = await draft.next();
		await draft.throw(new Finalized()).catch(e => e instanceof Finalized ? Promise.resolve() : Promise.reject(e));
		return r.value;
	}

}
