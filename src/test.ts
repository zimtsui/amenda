import test from 'ava';
import { Draft, Controlflow, Upwards, Finalized, Downwards, resume } from './exports.ts';

// Test Exception Classes
test('Upwards extends Error', t => {
	const upwards = new Upwards('test message');
	t.true(upwards instanceof Error);
	t.true(upwards instanceof Upwards);
	t.is(upwards.message, 'test message');
});

test('Finalized extends Error', t => {
	const finalized = new Finalized('test message');
	t.true(finalized instanceof Error);
	t.true(finalized instanceof Finalized);
	t.is(finalized.message, 'test message');
});

test('Downwards extends Error', t => {
	const downwards = new Downwards('test message');
	t.true(downwards instanceof Error);
	t.true(downwards instanceof Downwards);
	t.is(downwards.message, 'test message');
});

// Test Draft.eta
test('Draft.eta creates a draft that yields the input value', async t => {
	const value = 'test value';
	const draft = Draft.eta(value);
	
	const result = await draft.next();
	t.false(result.done);
	t.is(result.value, value);
	
	// Should throw when trying to finalize
	await t.throwsAsync(async () => {
		await draft.throw(new Finalized());
	});
});

// Test Draft.from
test('Draft.from converts Promise to Draft', async t => {
	const value = 'promised value';
	const promise = Promise.resolve(value);
	const draft = Draft.from(promise);
	
	const result = await draft.next();
	t.false(result.done);
	// The draft yields the promise itself, not the resolved value
	const resolvedValue = await result.value;
	t.is(resolvedValue, value);
});

// Test Draft.to
test('Draft.to converts Draft to Promise', async t => {
	const value = 'test value';
	const draft = Draft.eta(value);
	
	const promise = Draft.to(draft);
	const result = await promise;
	t.is(result, value);
});

// Test Draft.map
test('Draft.map transforms draft values', async t => {
	const initialValue = 5;
	const draft = Draft.eta(initialValue);
	const mapper = (x: number) => x * 2;
	const mappedDraft = Draft.map(mapper)(draft);
	
	const result = await mappedDraft.next();
	t.false(result.done);
	t.is(result.value, 10);
});

// Test Draft.mu (flattening nested drafts)
test('Draft.mu flattens nested drafts', async t => {
	const innerValue = 'inner';
	const innerDraft = Draft.eta(innerValue);
	const outerDraft = Draft.eta(innerDraft);
	const flattened = Draft.mu(outerDraft);
	
	const result = await flattened.next();
	t.false(result.done);
	t.is(result.value, innerValue);
});

// Test Controlflow.from
test('Controlflow.from creates controlflow from value', async t => {
	const value = 'test';
	const cf = Controlflow.from(value);
	
	const result = await cf.first();
	t.is(result, value);
});

// Test Controlflow.of
test('Controlflow.of creates controlflow from draft', async t => {
	const value = 'test from draft';
	const draft = Draft.eta(value);
	const cf = Controlflow.of(draft);
	
	const result = await cf.first();
	t.is(result, value);
});

// Test Controlflow.create
test('Controlflow.create creates empty controlflow', async t => {
	const cf = Controlflow.create();
	
	const result = await cf.first();
	t.is(result, undefined);
});

// Test Controlflow.map
test('Controlflow.map transforms values', async t => {
	const value = 5;
	const cf = Controlflow.from(value);
	const mapped = cf.map(x => x * 3);
	
	const result = await mapped.first();
	t.is(result, 15);
});

// Test Controlflow.transform
test('Controlflow.transform with async function', async t => {
	const value = 'hello';
	const cf = Controlflow.from(value);
	const transformed = cf.transform(async x => x.toUpperCase());
	
	const result = await transformed.first();
	t.is(result, 'HELLO');
});

// Test Controlflow.then
test('Controlflow.then chains draft functions', async t => {
	const value = 'test';
	const cf = Controlflow.from(value);
	const chained = cf.then(x => Draft.eta(x + ' chained'));
	
	const result = await chained.first();
	t.is(result, 'test chained');
});

// Test Controlflow.pipe
test('Controlflow.pipe applies draft transformation', async t => {
	const value = 10;
	const cf = Controlflow.from(value);
	const piped = cf.pipe(Draft.map(x => x / 2));
	
	const result = await piped.first();
	t.is(result, 5);
});

// Test resume function
test('resume function continues generator with first value', async t => {
	async function* testGenerator(): AsyncGenerator<string, string, string> {
		const input = yield 'original';
		return `got: ${input}`;
	}
	
	const gen = testGenerator();
	// Skip the first yield from the original generator
	await gen.next();
	
	// Resume with a new first value
	const resumed = resume(gen, 'injected');
	
	// The resume function yields the injected first value
	const result = await resumed.next();
	t.false(result.done);
	t.is(result.value, 'injected');
	
	// Continue the generator
	const finalResult = await resumed.next('final input');
	t.true(finalResult.done);
	t.is(finalResult.value, 'got: final input');
});

// Test error handling in drafts
test('Draft handles Upwards errors correctly', async t => {
	async function* testDraft(): Draft<string> {
		try {
			const feedback: Upwards = yield 'first attempt';
			throw yield `revised: ${feedback.message}`;
		} catch (e) {
			if (e instanceof Upwards) {
				throw yield `error handled: ${e.message}`;
			}
			throw e;
		}
	}
	
	const draft = testDraft();
	const firstResult = await draft.next();
	t.is(firstResult.value, 'first attempt');
	
	// Send feedback
	const feedback = new Upwards('needs revision');
	const secondResult = await draft.next(feedback);
	t.is(secondResult.value, 'revised: needs revision');
});

// Test complex workflow scenario
test('Complex workflow with multiple transformations', async t => {
	const cf = Controlflow.from('hello world')
		.map(text => text.split(' '))
		.transform(async words => words.map(w => w.toUpperCase()))
		.map(words => words.join('-'));
	
	const result = await cf.first();
	t.is(result, 'HELLO-WORLD');
});

// Test Draft.to with error handling
test('Draft.to handles finalization properly', async t => {
	async function* testDraft(): Draft<string> {
		try {
			throw yield 'test value';
		} catch (e) {
			if (e instanceof Finalized) {
				// Expected finalization - this should never return a value
				throw e;
			}
			throw e;
		}
	}
	
	const draft = testDraft();
	const result = await Draft.to(draft);
	t.is(result, 'test value');
});

// Test nested controlflow operations
test('Nested controlflow operations work correctly', async t => {
	const innerCf = Controlflow.from(5).map(x => x * 2);
	const outerCf = Controlflow.from(10)
		.transform(async x => {
			const innerResult = await innerCf.first();
			return x + innerResult;
		});
	
	const result = await outerCf.first();
	t.is(result, 20); // 10 + (5 * 2)
});

// Test error propagation in controlflow
test('Error propagation in controlflow', async t => {
	const cf = Controlflow.from('test')
		.transform(async () => {
			throw new Error('test error');
		});
	
	await t.throwsAsync(async () => {
		await cf.first();
	}, { message: 'test error' });
});

// Test Draft with Downwards error
test('Draft handles Downwards errors', async t => {
	async function* testDraft(): Draft<string> {
		try {
			const feedback: Upwards = yield 'initial';
			// Reject the feedback by yielding a Downwards error
			throw yield Promise.reject(new Downwards('Feedback rejected'));
		} catch (e) {
			if (e instanceof Upwards) {
				throw yield 'revised';
			}
			throw e;
		}
	}
	
	const draft = testDraft();
	const firstResult = await draft.next();
	t.is(firstResult.value, 'initial');
	
	// Send feedback
	const feedback = new Upwards('needs change');
	try {
		await draft.next(feedback);
		t.fail('Should have thrown Downwards error');
	} catch (e) {
		t.true(e instanceof Downwards);
		if (e instanceof Downwards) {
			t.is(e.message, 'Feedback rejected');
		}
	}
});

// Test conditional workflow pattern from README
test('Conditional workflow pattern', async t => {
	const determineLanguage = async (text: string) => {
		if (text.includes('你好')) return 'Chinese';
		if (text.includes('привет')) return 'Russian';
		return 'English';
	};
	
	const translateChineseToEnglish = async function* (text: string): Draft<string> {
		throw yield `Translated from Chinese: ${text}`;
	};
	
	const translateRussianToEnglish = async function* (text: string): Draft<string> {
		throw yield `Translated from Russian: ${text}`;
	};
	
	const cf = Controlflow.from('你好世界')
		.then(async function* (mathProblem: string): Draft<string> {
			switch (await determineLanguage(mathProblem)) {
				case 'Chinese': return yield* translateChineseToEnglish(mathProblem);
				case 'Russian': return yield* translateRussianToEnglish(mathProblem);
				case 'English': throw yield mathProblem;
				default: throw new Upwards('Language Not Supported');
			}
		});
	
	const result = await cf.first();
	t.is(result, 'Translated from Chinese: 你好世界');
});

// Test optimizer-evaluator pattern from README
test('Optimizer-evaluator pattern', async t => {
	let attemptCount = 0;
	
	const generateCode = async function* (): Draft<string> {
		for (;;) {
			attemptCount++;
			const code = attemptCount === 1 ? 'invalid code' : 'function test() { return 42; }';
			const feedback: Upwards = yield code;
			// Use feedback to improve next attempt
		}
	};
	
	const syntaxCheck = (code: string): void => {
		if (!code.includes('function')) {
			throw new SyntaxError('Invalid syntax: missing function');
		}
	};
	
	const evaluator = async function* (optimization: Draft<string>): Draft<string> {
		for (let r = await optimization.next(), feedback: Upwards;; r = await optimization.next(feedback)) {
			try {
				const code = r.value;
				syntaxCheck(code);
				throw yield code;
			} catch (e) {
				if (e instanceof SyntaxError) {
					feedback = new Upwards(e.message);
				} else if (e instanceof Upwards) {
					feedback = e;
				} else {
					throw await optimization.throw(e).then(() => e);
				}
			}
		}
	};
	
	const cf = Controlflow.create()
		.then(generateCode)
		.pipe(evaluator);
	
	const result = await cf.first();
	t.is(result, 'function test() { return 42; }');
	t.is(attemptCount, 2); // Should have made 2 attempts
});

// Test parallel workflow pattern from README
test('Parallel workflow pattern', async t => {
	const translateChineseToEnglish = async function* (text: string): Draft<string> {
		throw yield `English: ${text}`;
	};
	
	const translateChineseToRussian = async function* (text: string): Draft<string> {
		throw yield `Russian: ${text}`;
	};
	
	const cf = Controlflow.from('中文')
		.transform(async (chinese: string) => {
			const [english, russian] = await Promise.all([
				Controlflow.from(chinese).then(translateChineseToEnglish).first(),
				Controlflow.from(chinese).then(translateChineseToRussian).first(),
			]);
			return `# Chinese: ${chinese}\n\n# English: ${english}\n\n# Russian: ${russian}`;
		});
	
	const result = await cf.first();
	const expected = '# Chinese: 中文\n\n# English: English: 中文\n\n# Russian: Russian: 中文';
	t.is(result, expected);
});

// Test Draft.mu with nested drafts
test('Draft.mu flattens nested drafts correctly', async t => {
	// Create a simple nested draft
	const innerDraft = Draft.eta('inner value');
	const outerDraft = Draft.eta(innerDraft);
	
	// Flatten the nested draft
	const flattened = Draft.mu(outerDraft);
	const result = await flattened.next();
	
	// Should get the inner value directly
	t.is(result.value, 'inner value');
	t.false(result.done);
});

// Test error handling in Draft.map
test('Error handling in Draft.map', async t => {
	const draft = Draft.eta(5);
	const mapper = (x: number) => {
		if (x > 3) throw new Error('Value too large');
		return x * 2;
	};
	
	const mappedDraft = Draft.map(mapper)(draft);
	
	await t.throwsAsync(async () => {
		await mappedDraft.next();
	}, { message: 'Value too large' });
});