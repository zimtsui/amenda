import { Controlflow } from './controlflow.ts';


const cf = Controlflow.from({ content: '   hello world   ', lang: 'en' })
	.map(input => ({ ...input, content: input.content.trimStart() }))
	.transform(async input => ({ ...input, content: input.content.trimEnd() }))
	.map(({content, lang}) => `${lang}: ${content}`);

console.log(await cf.first());
