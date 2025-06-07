# Amenda

[![Npm package version](https://img.shields.io/npm/v/@zimtsui/amenda?style=flat-square)](https://www.npmjs.com/package/@zimtsui/amenda)

Amenda is another AI workflow orchestrator, which leverages the most native power of TypeScript.

## Rationale

AI workflows have pipelines, and so do traditional workflows. AI workflow nodes can retry, and so can traditional workflow nodes. AI workflow nodes can run in parallel, and so can traditional workflow nodes. AI workflow nodes can run conditionally, and so can traditional workflow nodes.

Popular AI workflow orchestrators (e.g. LangChain) unify the APIs of all kinds of model suppliers. But in terms of orchestration, they are no different from traditional orchestrators.

So what is the key difference between AI workflow and traditional workflow in orchestration? Is there anything that traditional orchestrators cannot do in AI workflows?

The answer is about retrying. In traditional workflows, if a node fails, or if the output of a node does not satisfy the downstream, the node should completely retry, doing the same work again with the same accuracy as the last attempt. In AI workflows, when a stateful AI node should retry, it revises its former output.

## Concept

### Workflow Node

A node in a AI workflow can be represented as a function which returns an async generator which yields values to the caller. If the node is not satisfied with the input, a `Rejected` value can be thrown back to the caller.

If the caller is not satisfied with the yielded value, a `Rejected` value as feedback can be `next`ed back into the node and wait for the next revised yield. If the caller is satisfied with the value, a `Finalized` value should be thrown back into the node to inform the node of the termination.

```ts
import { Rejected } from '@zimtsui/amenda';
import OpenAI from 'openai';

declare const openai: OpenAI;

async function *solveMathProblem(mathProblem: string): AsyncGenerator<string, never, Rejected> {
	const messages = [
		{ role: 'system', content: 'Please solve a math problem for the user.' },
		{ role: 'user', content: `${mathProblem}` },
	];
	for (;;) {
		const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages });
		messages.push({ role: 'assistant', content: completion.choices[0].message.content });
		const feedback: Rejected = yield completion.choices[0].message.content;
		messages.push({ role: 'user', content: `Please revise your answer upon the feedback: ${feedback.message}` });
	}
}
```

### Controlflow

A `Controlflow` is the orchestrator of a workflow, which compose workflows into a new workflow.

```ts
import { Controlflow } from '@zimtsui/amenda';
import { writeFile } from 'fs/promises';
import { Console } from 'node:console';

declare const translateEnglishToChinese: (englishText: string) => AsyncGenerator<string, never, Rejected>;
declare const solveChineseMathProblem: (chineseMathProblem: string) => AsyncGenerator<string, never, Rejected>;
declare const translateChineseToEnglish: (chineseText: string) => AsyncGenerator<string, never, Rejected>;

const cf = Controlflow
	.pipesf((text: string) => text.trimStart())	// append a sync function
	.pipeaf(async (text: string) => text.trimEnd())	// append an async function
	.pipe(translateEnglishToChinese)	// append a workflow
	.pipe(solveChineseMathProblem)
	.pipe(translateChineseToEnglish);

const f = cf.callback({ console: new Console() });
export const solution: string = await f('what does 1+1 equal to?');
```

### Stateful Nodes

```ts
import { Controlflow, Rejected } from '@zimtsui/amenda';
import { writeFile } from 'fs/promises';
import { Console } from 'node:console';
import OpenAI from 'openai';
import { v4 as makeUuid } from 'uuid';

declare const openai: OpenAI;

async function *solveMathProblem(mathProblem: string, state: { console: Console, executionId: string }): AsyncGenerator<string, never, Rejected> {
	const messages = [
		{ role: 'system', content: 'Please solve a math problem for the user.' },
		{ role: 'user', content: `${mathProblem}` },
	];
	for (;;) {
		const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages });
		state.console.error(`Execution ${state.executionId}:\n${completion.usage}`);
		if (completion.choices[0].message.tool_calls[0]?.name === 'problemTooHard')
			throw new Rejected(completion.choices[0].message.tool_calls[0].arguments.reason);
		messages.push({ role: 'assistant', content: completion.choices[0].message.content });
		const feedback: Rejected = yield [completion.choices[0].message.content, state];	// [output, state]
		messages.push({ role: 'user', content: `Please revise your answer upon the feedback: ${feedback.message}` });
	}
}

const cf = Controlflow
	.thensf((mathProblem: string, state: { console: Console }) => [mathProblem, { ...state, executionId: makeUuid() }])	// append a stateful sync function
	.then(solveMathProblem)	// append a stateful generator function
	.pipeaf(async (solution: string) => {	// append a stateless async function
		await writeFile('solution.txt', solution);
		return solution;
	});

const f = cf.callback({ console: new Console() });
export const solution: string = await f('what does 1+1 equal to?');
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
	.pipe(async function *(mathProblem: string): AsyncGenerator<string, never, Rejected> {
		switch (await determineLanguage(mathProblem)) {
			case 'Chinese': throw yield *translateChineseToEnglish(mathProblem); break;
			case 'Russian': throw yield *translateRussianToEnglish(mathProblem); break;
			case 'English': throw yield mathProblem; break;
			default: throw new Rejected('Unsupported language'); break;
		}
	}).pipe(solveEnglishMathProblem);

const solution: string = await cf.callback('1+1 等于几？');

```

### [Design Pattern of Optimizer Evaluator](https://www.anthropic.com/engineering/building-effective-agents)

```ts
import { Rejected, Controlflow } from '@zimtsui/amenda';

declare const solveMathProblem: (mathProblem: string) => AsyncGenerator<string, never, Rejected>;

async function *evaluator(solutions: AsyncGenerator<string, never, Rejected>): AsyncGenerator<string, never, Rejected> {
	for (let r = await solutions.next();;) try {
		const messages = [
			{ role: 'system', content: 'Please check the solutions to a math problem.' },
			{ role: 'user', content: r.value },
		];
		const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages });
		const functionCall = completion.choices[0].message.tool_calls[0];
		if (functionCall?.name !== 'wrong') throw yield r.value;
		r = await solutions.next(new Rejected(functionCall.arguments.reason));
	} catch (e) {
		throw await solutions.throw(e).then(() => e);
	}
}

const cf = Controlflow
	.pipe(solveMathProblem)
	.by(evaluator);	// append an evaluator

const solution: string = await cf.callback('What does 1+1 equal to?');
```

### Parallel

```ts
import { Controlflow, Rejected } from '@zimtsui/amenda';

declare const translateChineseToEnglish: (chineseText: string) => AsyncGenerator<string, never, Rejected>;
declare const translateChineseToRussian: (chineseText: string) => AsyncGenerator<string, never, Rejected>;

const cf = Controlflow
	.pipeaf(async (chinese: string) => {
		const [english, russian] = await Promise.all([
			Controlflow.pipeaf(translateChineseToEnglish).callback(chinese),
			Controlflow.pipeaf(translateChineseToRussian).callback(chinese),
		]);
		return `# Chinese: ${chinese}\n\n# English: ${english}\n\n# Russian: ${russian}`;
	});

const solution: string = await cf.callback('1+1 等于几？');
```

## [Explanation of Amenda in Mathematics](./explanation.md)
