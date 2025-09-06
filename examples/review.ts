import { Draft } from '@zimtsui/amenda';
import OpenAI from 'openai';
declare const openai: OpenAI;

export async function *review(solution: Draft<string>): Draft<string> {
	for (let r = await solution.next(), feedback: unknown;; r = await solution.throw(feedback)) {
		const messages: OpenAI.ChatCompletionMessageParam[] = [
			{ role: 'system', content: 'Please review the solution of math problems.' },
			{ role: 'user', content: r.value },
		];
		const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages });
		if (completion.choices[0]!.message.tool_calls?.[0]?.function.name === 'correct') try {
			return yield r.value;
		} catch (e) {
			feedback = e;
		} else feedback = new Error(completion.choices[0]!.message.content!);
	}
}
