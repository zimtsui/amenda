import { Upwards, Controlflow, type Amenda } from '@zimtsui/amenda';

declare function generateCode(): AsyncGenerator<string, never, Upwards>;
declare function syntaxCheck(code: string): void;

async function *evaluator(optimization: Amenda<string, void>): Amenda<string, void> {
	for (let r = await optimization.next(), feedback: Upwards;; r = await optimization.next(feedback)) try {
		const [code, state] = r.value;
		syntaxCheck(code);
		throw yield [code, state];
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
