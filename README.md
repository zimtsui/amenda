# Amenda

[![Npm package version](https://img.shields.io/npm/v/@zimtsui/amenda?style=flat-square)](https://www.npmjs.com/package/@zimtsui/amenda)

Amenda is another AI workflow orchestrator, which leverage the most native power of TypeScript.

## Concepts

### Workflow

```ts
declare module '@zimtsui/amenda' {
	export type Workflow<input, output> = (input: input) => AsyncGenerator<output, never, Rejected>;
	export class Rejected extends Error {}
	export class Finalized extends Error {}
}
```

A `Workflow` is a node in a AI workflow graph. A `Workflow` is actually a function which returns an async generator which yields values to the caller. If the workflow is not satisfied with the input, a `Rejected` value can be thrown back to the caller.

If the caller is not satisfied with the value, a `Rejected` value as feedback can be `next`ed back into the workflow. If the caller is satisfied with the value, a `Finalized` value should be thrown back into the workflow.

```ts
import { Workflow, Rejected } from '@zimtsui/amenda';
import OpenAI from 'openai';

declare const openai: OpenAI;

const wf: Workflow<string, string> = async function *(mathProblem: string) {
	const messages = [
		{ role: 'system', content: 'Please solve a math problem for the user.' },
		{ role: 'user', content: `${mathProblem}` },
	];
	for (;;) {
		const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages });
		if (completion.choices[0].message.tool_calls[0]?.name === 'problemTooHard')
			throw new Rejected(completion.choices[0].message.tool_calls[0].arguments.reason);
		messages.push({ role: 'assistant', content: completion.choices[0].message.content });
		const feedback: Rejected = yield completion.choices[0].message.content;
		messages.push({ role: 'user', content: `Please revise your answer upon the feedback: ${feedback.message}` });
	}
}
```

### Controlflow

A `Controlflow` is the orchestrator of a workflow graph, which compose workflows into a new workflow.

```ts
import { Controlflow } from '@zimtsui/amenda';
import { writeFile } from 'fs/promises';

declare const translateEnglishToChinese: Workflow<string, string>;
declare const solveChineseMathProblem: Workflow<string, string>;
declare const translateChineseToEnglish: Workflow<string, string>;

const cf = Controlflow
	.map((text: string) => text.trimStart())	// append a sync function
	.pipe(async (text: string) => text.trimEnd())	// append an async function
	.append(translateEnglishToChinese)	// append a workflow
	.append(solveChineseMathProblem)
	.append(translateChineseToEnglish);

const solution: string = await cf.callback('what does 1+1 equal to?');
```

## Best Practices

### Conditional Workflow

```ts
import { Workflow, Rejected, Controlflow } from '@zimtsui/amenda';

declare const determineLanguage: (text: string) => Promise<'Chinese' | 'Russian' | 'English'>;
declare const translateChineseToEnglish: Workflow<string, string>;
declare const translateRussianToEnglish: Workflow<string, string>;
declare const solveEnglishMathProblem: Workflow<string, string>;

const cf = Controlflow
	.append(async function *(mathProblem: string): Workflow<string, string> {
		switch (await determineLanguage(mathProblem)) {
			case 'Chinese': throw yield *translateChineseToEnglish(mathProblem); break;
			case 'Russian': throw yield *translateRussianToEnglish(mathProblem); break;
			case 'English': throw yield mathProblem; break;
			default: throw new Rejected('Unsupported language'); break;
		}
	}).append(solveEnglishMathProblem);

const solution: string = await cf.callback('1+1 等于几？');

```

Or

```ts
import { Workflow, Rejected, Controlflow } from '@zimtsui/amenda';

declare const determineLanguage: (text: string) => Promise<'Chinese' | 'Russian' | 'English'>;
declare const translateChineseToEnglish: Workflow<string, string>;
declare const translateRussianToEnglish: Workflow<string, string>;
declare const solveEnglishMathProblem: Workflow<string, string>;

const cf = Controlflow
	.pipe(async function translate(mathProblem: string): Promise<string> {
		switch (await determineLanguage(mathProblem)) {
			case 'Chinese': return await Controlflow.append(translateChineseToEnglish).callback(mathProblem); break;
			case 'Russian': return await Controlflow.append(translateRussianToEnglish).callback(mathProblem); break;
			case 'English': return mathProblem; break;
			default: throw new Rejected('Unsupported language'); break;
		}
	}).append(solveEnglishMathProblem);

const solution: string = await cf.callback('1+1 等于几？');

```

### Design Pattern of Optimizer Evaluator

#### Stateful Evaluator

```ts
import { Workflow, Rejected, Controlflow } from '@zimtsui/amenda';

declare const solveMathProblem: Workflow<string, string>;

async function *evaluator(solutions: AsyncGenerator<string, never, Rejected>): Workflow<string, string> {
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
	.append(solveMathProblem)
	.by(evaluator);

const solution: string = await cf.callback('1+1 等于几？');
```

#### Stateless Evaluator

```ts
import { Workflow, Rejected, Controlflow } from '@zimtsui/amenda';

declare const solveMathProblem: Workflow<string, string>;

async function evaluator(solution: string): Promise<string> {
	const messages = [
		{ role: 'system', content: 'Please check the solutions to a math problem.' },
		{ role: 'user', content: solution },
	];
	const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages });
	const functionCall = completion.choices[0].message.tool_calls[0];
	if (functionCall?.name !== 'wrong') return solution;
	throw new Rejected(functionCall.arguments.reason);
}

const cf = Controlflow
	.append(solveMathProblem)
	.pipe(evaluator);

const solution: string = await cf.callback('1+1 等于几？');
```

### Parallel

```ts
import { Controlflow, Workflow, Rejected } from '@zimtsui/amenda';

declare const translateChineseToEnglish: Workflow<string, string>;
declare const translateChineseToRussian: Workflow<string, string>;

const cf = Controlflow
	.pipe(async (chinese: string) => {
		const [english, russian] = await Promise.all([
			Controlflow.append(translateChineseToEnglish).callback(chinese),
			Controlflow.append(translateChineseToRussian).callback(chinese),
		]);
		return `# Chinese: ${chinese}\n\n# English: ${english}\n\n# Russian: ${russian}`;
	});

const solution: string = await cf.callback('1+1 等于几？');
```

## Explanation of Amenda in Mathematics

[Explanation of Amenda in Mathematics](./explanation.md)
