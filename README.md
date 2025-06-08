# Amenda

[![Npm package version](https://img.shields.io/npm/v/@zimtsui/amenda?style=flat-square)](https://www.npmjs.com/package/@zimtsui/amenda)

Amenda is another AI workflow orchestrator, which leverages the most native power of TypeScript.

## Rationale

Traditional workflows have almost everything that AI workflows have, for example, pipelines, parallelism, conditionals, retries, etc. Popular AI workflow frameworks (e.g. LangChain) unify the APIs of various model suppliers. But in terms of orchestration, they are no different from traditional orchestrators.

So what is the key difference between AI workflows and traditional workflows in terms of orchestration? Is there anything that traditional orchestrators cannot do in AI workflows?

The answer is about the retry mechanism. In traditional workflows, if a node fails, or if the output of a node is rejected by the downstream, the node should typically retry by repeating the exact same operation with the same accuracy as the last attempt. While in AI workflows, when a stateful AI node should retry, it revises its former output.

## Concept

### Workflow Node

A node in a AI workflow can be represented as an async generator function which yields values to the caller. If the node is not satisfied with the input, a `Rejected` value can be thrown back to the caller.

If the caller is not satisfied with the yielded value, a `Rejected` value as feedback can be `next`ed back into the node and wait for the next revised yield. If the caller is satisfied with the value, a `Finalized` value should be thrown back into the node to inform the node of the termination.

```ts
import { Rejected } from '@zimtsui/amenda';
import OpenAI from 'openai';

declare const openai: OpenAI;

async function *solveMathProblem(mathProblem: string): AsyncGenerator<string, never, Rejected> {
	const messages = [
		{ role: 'system', content: 'Please solve a math problem for the user.' },
		{ role: 'user', content: mathProblem },
	];
	for (;;) {
		const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages });
		messages.push({ role: 'assistant', content: completion.choices[0].message.content });
		if (completion.choices[0].message.tool_calls[0]?.name === 'problemTooHard')
			throw new Rejected(completion.choices[0].message.tool_calls[0].arguments.reason);
		const feedback: Rejected = yield completion.choices[0].message.content;
		messages.push({ role: 'user', content: `Please revise your answer upon the feedback: ${feedback.message}` });
	}
}
```

### Controlflow

A `Controlflow` is the orchestrator of a workflow, which compose workflows into a new workflow.

```ts
import { Controlflow } from '@zimtsui/amenda';

declare const translateEnglishToChinese: (englishText: string) => AsyncGenerator<string, never, Rejected>;
declare const solveChineseMathProblem: Controlflow<string, string>;
declare const translateChineseToEnglish: (chineseText: string) => AsyncGenerator<string, never, Rejected>;

const cf = Controlflow
	.map((text: string) => text.trimStart())	// append a sync function
	.transform(async (text: string) => text.trimEnd())	// append an async function
	.then(translateEnglishToChinese)	// append an async generator function
	.append(solveChineseMathProblem)	// append another Controlflow
	.then(translateChineseToEnglish);

export default await cf.callback('what does 1+1 equal to?');
```

### Stateful Nodes

A stateful node should return a tuple of output and a new state.

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
import { Rejected, Controlflow } from '@zimtsui/amenda';

declare const determineLanguage: (text: string) => Promise<'Chinese' | 'Russian' | 'English'>;
declare const translateChineseToEnglish: (chineseText: string) => AsyncGenerator<string, never, Rejected>;
declare const translateRussianToEnglish: (russianText: string) => AsyncGenerator<string, never, Rejected>;
declare const solveEnglishMathProblem: (englishMathProblem: string) => AsyncGenerator<string, never, Rejected>;

const cf = Controlflow
	.then(async function *(mathProblem: string): AsyncGenerator<string, never, Rejected> {
		switch (await determineLanguage(mathProblem)) {
			case 'Chinese': throw yield *translateChineseToEnglish(mathProblem); break;
			case 'Russian': throw yield *translateRussianToEnglish(mathProblem); break;
			case 'English': throw yield mathProblem; break;
			default: throw new Rejected('Unsupported language'); break;
		}
	}).then(solveEnglishMathProblem);

export default await cf.callback('1+1 等于几？');

```

### [Design Pattern of Optimizer Evaluator](https://www.anthropic.com/engineering/building-effective-agents)

```ts
import { Rejected, Controlflow } from '@zimtsui/amenda';

declare async function *generateCode(): AsyncGenerator<string, never, Rejected>;
declare function syntaxCheck(code: string): void;

async function *evaluator(codes: AsyncGenerator<[string, state: void], never, Rejected>): AsyncGenerator<[string, state: void], never, Rejected> {
	for (let r = await codes.next();;) try {
		syntaxCheck(r.value[0]);
		throw yield r.value;
	} catch (e) {
		if (e instanceof SyntaxError) r = await codes.next(new Rejected(e.message));
		else if (e instanceof Rejected) r = await codes.next(e);
		else throw e;
	}
}

const cf = Controlflow
	.then(generateCode)
	.pipe(evaluator);	// append an evaluator

export default await cf.callback();
```

### Parallel

```ts
import { Controlflow, Rejected } from '@zimtsui/amenda';

declare const translateChineseToEnglish: (chineseText: string) => AsyncGenerator<string, never, Rejected>;
declare const translateChineseToRussian: (chineseText: string) => AsyncGenerator<string, never, Rejected>;

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
