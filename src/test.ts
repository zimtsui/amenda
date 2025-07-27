import { Controlflow } from './controlflow.ts';


const cf = Controlflow
	.smap(() => ['  hello world  ', { lang: 'en' }])
	.map((input: string, ctx: {}) => {
		return input;
	})
	.map((i: string, ctx: { lang: string; }) => i.trimStart())
	.transform(async (i: string) => i.trimEnd())
	.map((i: string, ctx: { lang: string; }) => ctx.lang + ': ' + i);

console.log(await cf.fun());
