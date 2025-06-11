export async function *resume<TYield, TReturn, TNext>(it: AsyncGenerator<TYield, TReturn, TNext>, first: TYield): AsyncGenerator<TYield, TReturn, TNext> {
	try {
		let r = await it.next(yield first);
		while (!r.done) r = await it.next(yield r.value);
		return r.value;
	} catch (e) {
		await it.throw(e);
		throw e;
	}
}
