import { Controlflow } from './controlflow.ts';


const cf = Controlflow
	.pipesf((i: string) => i.trimStart())
	.pipeaf(async (i: string) => i.trimEnd());

const callback = cf.callback(null);

console.log(await callback('  hello world  '));
