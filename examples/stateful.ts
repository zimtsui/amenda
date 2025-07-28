import { Controlflow } from '@zimtsui/amenda';

const cf = Controlflow.create()
	.smap((x: void, state: void) => [x, { a: 1 }])	// append a stateful sync function
	.sthen(async function *(x: void, state) {	// append a stateful async generator function
		throw yield [x, { ...state, b: 2 }];
	})
	.stransform(async (x: void, state) => [x, { ...state, c: 3 }])	// append a stateful async function
	.smap((x: void, state) => [x, { ...state, s: state.a + state.b + state.c }])
	.map((x: void, state) => state.s)
;
export default await cf.first();	// 6
