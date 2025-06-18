# Amenda

[![Npm package version](https://img.shields.io/npm/v/@zimtsui/amenda?style=flat-square)](https://www.npmjs.com/package/@zimtsui/amenda)

Amenda is an AI workflow orchestrator powered by the most native capabilities of TypeScript.

**You may have to be very familiar with TypeScript type system to read this document.**

## Rationale

Traditional workflows have almost every capability that AI workflows have, e.g. pipeline, parallelism, conditional, retry, etc. Popular AI workflow frameworks, e.g. LangChain, unify the APIs of various model suppliers. But in terms of orchestration, they are no different from the traditional ones.

So what is the key difference between AI workflows and traditional workflows in terms of orchestration? Is there anything that traditional orchestrators cannot do in AI workflows?

The answer is about the mechanism of retry. In traditional workflows, if a node fails, or if the output of the node is rejected by the downstream, the node should typically retry by repeating the exact same operation with the same accuracy as the last attempt. While in AI workflows, when a stateful AI node should retry, it revises its former output with a much higher accuracy than the last attempt.

## Concept

### Output of a Workflow

The output of a workflow can be represented as an async generator which yields the result value to the downstream.

If the downstream accepts the yielded result, `.throw` of the generator will be called with a `Finalized` error.

```ts
import { Upwards } from '@zimtsui/amenda';
import OpenAI from 'openai';
declare const openai: OpenAI;

async function *solve(problem: string): AsyncGenerator<string, never, Upwards> {
	const messages = [
		{ role: 'system', content: 'Please solve math problems.' },
		{ role: 'user', content: problem },
	];
	const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages });
	// The `yield` will never return if the downstream accepts the yielded result.
	yield completion.choices[0].message.content;
	throw new Error();
}
```

If the downstream rejects the yielded result, the `.next` of the generator should be called with an `Upwards` as feedback. In this case, the workflow should revise its output and yield a new version.

`Upwards` is a subtype of `Error`. It's intended to represent an error from downstream to upstream.

```ts
import { Upwards } from '@zimtsui/amenda';
import OpenAI from 'openai';
declare const openai: OpenAI;

async function *solve(problem: string): AsyncGenerator<string, never, Upwards> {
	const messages = [
		{ role: 'system', content: 'Please solve math problems.' },
		{ role: 'user', content: problem },
	];
	for (;;) {
		const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages });
		const feedback: Upwards = yield completion.choices[0].message.content;
		messages.push({ role: 'assistant', content: completion.choices[0].message.content });
		messages.push({ role: 'user', content: `Please revise your answer upon the feedback: ${feedback.message}` });
	}
}
```

A workflow can reject the input by throwing an `Upwards` to the upstream.

```ts
import { Upwards } from '@zimtsui/amenda';
import OpenAI from 'openai';
declare const openai: OpenAI;

async function *solve(problem: string): AsyncGenerator<string, never, Upwards> {
	const messages = [
		{ role: 'system', content: 'Please solve math problems.' },
		{ role: 'user', content: problem },
	];
	const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages });
	if (completion.choices[0].message.tool_calls[0]?.name === 'fail') throw new Upwards('The problem is too hard.');
	// The `throw` propagates the feedback from downstream to upstream.
	throw yield completion.choices[0].message.content;
}
```

A workflow can also yield an `Downwards` to the downstream, for example, to reject the feedback.

`Downwards` is a subtype of `Error`. It's intended to represent an error from upstream to downstream.

```ts
import { Downwards, Upwards } from '@zimtsui/amenda';
import OpenAI from 'openai';
declare const openai: OpenAI;

async function *solve(problem: string): AsyncGenerator<string, never, Upwards> {
	const messages = [
		{ role: 'system', content: 'Please solve math problems.' },
		{ role: 'user', content: problem },
	];
	const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages });
	const feedback: Upwards = yield completion.choices[0].message.content;
	throw yield Promise.reject(new Downwards('My solution is correct, and your feedback is wrong.'));
}
```

The input of a workflow can be the output of a previous workflow.

```ts
import { Upwards } from '@zimtsui/amenda';
import OpenAI from 'openai';

declare const openai: OpenAI;

async function *review(solutions: AsyncGenerator<string, never, Upwards>): AsyncGenerator<string, never, Upwards> {
	for (let r = await solutions.next(), feedback: Upwards;; r = await solutions.next(feedback)) {
		const messages = [
			{ role: 'system', content: 'Please review the solution of math problems.' },
			{ role: 'user', content: r.value },
		];
		const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages });
		if (completion.choices[0].message.tool_calls[0]?.name === 'correct') throw yield r.value;
		feedback = new Upwards(completion.choices[0].message.content);
	}
}
```

### Controlflow

A `Controlflow` is the orchestrator of workflows, which composes workflows.

```ts
import { Controlflow } from '@zimtsui/amenda';

declare const translateEnglishToChinese: (englishText: string) => AsyncGenerator<string, never, Upwards>;
declare const solveChineseMathProblem: Controlflow<string, string>;
declare const translateChineseToEnglish: (chineseText: string) => AsyncGenerator<string, never, Upwards>;

const cf = Controlflow
	.map((text: string) => text.trimStart())	// append a sync function
	.transform(async (text: string) => text.trimEnd())	// append an async function
	.then(translateEnglishToChinese)	// append an async generator function
	.append(solveChineseMathProblem)	// append another Controlflow
	.then(translateChineseToEnglish);

export default await cf.callback('what does 1+1 equal to?');
```

### Stateful Workflows

A stateful workflow should return a tuple of the result and a new state.

```ts
import { Controlflow } from '@zimtsui/amenda';

const cf = Controlflow
	.smap((x: null, state: void) => [x, { a: 1 }])	// append a stateful sync function
	.sthen(async function *(x: null, state) {	// append a stateful async generator function
		throw yield [x, { ...state, b: 2 }];
	})
	.stransform(async (x: null, state) => [x, { ...state, c: 3 }])	// append a stateful async function
	.smap((x: null, state) => [x, { ...state, s: state.a + state.b + state.c }])
	.map((x: null, state) => state.s);

export default await cf.callback(null);	// 6
```

## Best Practices

### Conditional Workflow

```ts
import { Upwards, Controlflow } from '@zimtsui/amenda';

declare const determineLanguage: (text: string) => Promise<'Chinese' | 'Russian' | 'English'>;
declare const translateChineseToEnglish: (chineseText: string) => AsyncGenerator<string, never, Upwards>;
declare const translateRussianToEnglish: (russianText: string) => AsyncGenerator<string, never, Upwards>;
declare const solveEnglishMathProblem: (englishMathProblem: string) => AsyncGenerator<string, never, Upwards>;

const cf = Controlflow
	.then(async function *(mathProblem: string): AsyncGenerator<string, never, Upwards> {
		switch (await determineLanguage(mathProblem)) {
			case 'Chinese': yield *translateChineseToEnglish(mathProblem); break;
			case 'Russian': yield *translateRussianToEnglish(mathProblem); break;
			case 'English': throw yield mathProblem; break;
			default: throw new Upwards('Language Not Supported'); break;
		}
	}).then(solveEnglishMathProblem);

export default await cf.callback('1+1 等于几？');
```

### [Design Pattern of Optimizer Evaluator](https://www.anthropic.com/engineering/building-effective-agents)

```ts
import { Upwards, Controlflow } from '@zimtsui/amenda';

declare async function *generateCode(): AsyncGenerator<string, never, Upwards>;
declare function syntaxCheck(code: string): void;

async function *evaluator(optimization: AsyncGenerator<[string, state: void], never, Upwards>): AsyncGenerator<[string, state: void], never, Upwards> {
	for (let r = await optimization.next(), feedback: Upwards;; r = await optimization.next(feedback)) try {
		syntaxCheck(r.value[0]);
		throw yield r.value;
	} catch (e) {
		if (e instanceof SyntaxError) feedback = new Upwards(e.message);
		else if (e instanceof Upwards) feedback = e;
		else throw await optimization.throw(e).then(() => e);
	}
}

const cf = Controlflow
	.then(generateCode)
	.pipe(evaluator);	// append an evaluator

export default await cf.callback();
```

### Parallel

```ts
import { Controlflow, Upwards } from '@zimtsui/amenda';

declare const translateChineseToEnglish: (chineseText: string) => AsyncGenerator<string, never, Upwards>;
declare const translateChineseToRussian: (chineseText: string) => AsyncGenerator<string, never, Upwards>;

const cf = Controlflow
	.transform(async (chinese: string) => {
		const [english, russian] = await Promise.all([
			Controlflow.then(translateChineseToEnglish).callback(chinese),
			Controlflow.then(translateChineseToRussian).callback(chinese),
		]);
		return `# Chinese: ${chinese}\n\n# English: ${english}\n\n# Russian: ${russian}`;
	});

export default await cf.callback('1+1 等于几？');
```

## [Explanation of Amenda in Mathematics](./explanation.md)
