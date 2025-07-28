import { Controlflow } from './amenda.ts';


const cf = Controlflow.of('  hello world  ', { lang: 'en' })
	.map((input: string, ctx: {}) => {
		return input;
	})
	.map((i: string, ctx: { lang: string; }) => i.trimStart())
	.transform(async (i: string) => i.trimEnd())
	.map((i: string, ctx: { lang: string; }) => ctx.lang + ': ' + i);

console.log(await cf.first());
