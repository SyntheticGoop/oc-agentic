declare global {
	/**
	 * Represents an error result containing an error message and optional code.
	 *
	 * @template ErrStr - The literal string type of the error message
	 */
	// biome-ignore lint/suspicious/noExplicitAny: generic inference
	type Err<ErrStr extends string = string, Meta = any> = {
		ok?: undefined;
		err: ErrStr;
		meta: Meta;
	};

	/**
	 * Represents a successful result containing a value.
	 *
	 * @template OkVal - The type of the success value
	 */
	// biome-ignore lint/suspicious/noExplicitAny: generic inference
	type Ok<OkVal = any> = { ok: OkVal; err?: undefined };
}

export function Ok<OkVal>(ok: OkVal): Ok<OkVal> {
	return { ok };
}

// biome-ignore lint/suspicious/noRedeclare: overload
export function Err<ErrStr extends string>(err: ErrStr): Err<ErrStr>;
// biome-ignore lint/suspicious/noRedeclare: overload
export function Err<ErrStr extends string, Meta>(
	err: ErrStr,
	meta: Meta,
): Err<ErrStr, Meta>;
export function Err<ErrStr extends string, Meta = undefined>(
	err: ErrStr,
	meta?: Meta,
): Err<ErrStr, Meta> {
	return { err, meta } as Err<ErrStr, Meta>;
}
