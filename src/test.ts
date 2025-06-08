import { Controlflow } from './controlflow.ts';


const cf = Controlflow
	.map(() => 'hello world')
	.map((i: string) => i.trimStart())
	.transform(async (i: string) => i.trimEnd());

console.log(await cf.callback());
