import { Upwards, Controlflow, type Draft } from '@zimtsui/amenda';

declare function generateCode(): Draft<string>;
declare function syntaxCheck(code: string): void;

async function *evaluator(optimization: Draft<string>): Draft<string> {
	for (let r = await optimization.next(), feedback: Upwards;; r = await optimization.next(feedback)) try {
		const code = r.value;
		syntaxCheck(code);
		throw yield code;
	} catch (e) {
		if (e instanceof SyntaxError) feedback = new Upwards(e.message);
		else if (e instanceof Upwards) feedback = e;
		else throw await optimization.throw(e).then(() => e);
	}
}

const cf = Controlflow.create()
	.then(generateCode)
	.pipe(evaluator)	// append an evaluator
;
export default await cf.first();
