

export class Scoped<state, value> {
	private constructor(
		public state: state,
		public value: value,
	) {}

	public static identity<state>(state: state): Scoped<state, void> {
		return new Scoped(state, undefined);
	}

	public eta<value>(value: value): Scoped<state, value> {
		return new Scoped(this.state, value);
	}

	public static mu<state, value>(scope: Scoped<state, Scoped<state, value>>): Scoped<state, value> {
		return scope.value;
	}

	public static epsilon<state, value>(scope: Scoped<state, value>): value {
		return scope.value;
	}

	public static delta<state, value>(scope: Scoped<state, value>): Scoped<state, Scoped<state, value>> {
		return new Scoped(scope.state, scope);
	}

	public static of<state, value>(value: value, state: state): Scoped<state, value> {
		return new Scoped(state, value);
	}
}
