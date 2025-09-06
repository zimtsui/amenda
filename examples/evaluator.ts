import { Controlflow, type Draft } from '@zimtsui/amenda';

declare function generateCode(): Draft<string>;
declare function syntaxCheck(code: string): void;

async function *evaluator(optimization: Draft<string>): Draft<string> {
	for (let r = await optimization.next(), feedback: unknown;; r = await optimization.throw(feedback)) try {
		const code = r.value;
		syntaxCheck(code);
		return yield code;
	} catch (e) {
		feedback = e;
	}
}

const cf = Controlflow.create()
	.then(generateCode)
	.pipe(evaluator)	// append an evaluator
;
export default await cf.first();
