import type { ClientFetchOption } from "@better-auth/core";
import type { BetterFetch, BetterFetchError } from "@better-fetch/fetch";
import type { PrimitiveAtom, Atom, WritableAtom } from "jotai/vanilla";
import { atom, createStore } from "jotai/vanilla";
import type { SessionQueryParams } from "./types";

type Store = ReturnType<typeof createStore>;

// SSR detection
const isServer = () => typeof window === "undefined";

export type AuthQueryAtom<T> = PrimitiveAtom<{
	data: null | T;
	error: null | BetterFetchError;
	isPending: boolean;
	isRefetching: boolean;
	refetch: (
		queryParams?: { query?: SessionQueryParams } | undefined,
	) => Promise<void>;
}>;

export const useAuthQuery = <T>(
	initializedAtom:
		| (PrimitiveAtom<any> | Atom<any> | WritableAtom<any, any, any>)
		| (PrimitiveAtom<any> | Atom<any> | WritableAtom<any, any, any>)[],
	path: string,
	$fetch: BetterFetch,
	store: Store,
	options?:
		| (
				| ((value: {
						data: null | T;
						error: null | BetterFetchError;
						isPending: boolean;
				  }) => ClientFetchOption)
				| ClientFetchOption
		  )
		| undefined,
) => {
	const value = atom({
		data: null,
		error: null,
		isPending: true,
		isRefetching: false,
		refetch: (queryParams) => fn(queryParams),
	}) as AuthQueryAtom<T> ;

	const fn = async (
		queryParams?: { query?: SessionQueryParams } | undefined,
	) => {
		return new Promise<void>((resolve) => {
			const opts =
				typeof options === "function"
					? (() => {
						const val = store.get(value);
						return options({
							data: val.data,
							error: val.error,
							isPending: val.isPending,
						})
					})()
					: options;

			$fetch<T>(path, {
				...opts,
				query: {
					...opts?.query,
					...queryParams?.query,
				},
				async onSuccess(context) {
					store.set(value, val => ({
						...val,
						data: context.data,
						error: null,
						isPending: false,
						isRefetching: false,
					}));
					await opts?.onSuccess?.(context);
				},
				async onError(context) {
					const { request } = context;
					const retryAttempts =
						typeof request.retry === "number"
							? request.retry
							: request.retry?.attempts;
					const retryAttempt = request.retryAttempt || 0;
					if (retryAttempts && retryAttempt < retryAttempts) return;
					store.set(value, value => ({
						...value,
						error: context.error,
						data: null,
						isPending: false,
						isRefetching: false,
					}))
					await opts?.onError?.(context);
				},
				async onRequest(context) {
					store.set(value, value => ({
						isPending: value.data === null,
						data: value.data,
						error: null,
						isRefetching: true,
						refetch: value.refetch,
					}))
					await opts?.onRequest?.(context);
				},
			})
				.catch((error) => {
					store.set(value, value => ({
						error,
						data: null,
						isPending: false,
						isRefetching: false,
						refetch: value.refetch,
					}))
				})
				.finally(() => {
					resolve(void 0);
				});
		});
	};
	initializedAtom = Array.isArray(initializedAtom)
		? initializedAtom
		: [initializedAtom];
	let isMounted = false;

	for (const initAtom of initializedAtom) {
		const unsub = store.sub(initAtom, async () => {
			if (isServer()) {
				// On server, don't trigger fetch
				return;
			}
			if (isMounted) {
				await fn();
			} else {
				value.onMount = () => {
					const timeoutId = setTimeout(async () => {
						if (!isMounted) {
							await fn();
							isMounted = true;
						}
					}, 0);
					return () => {
						value.onMount = undefined;
						unsub();
						clearTimeout(timeoutId);
					};
				};
			}
		})
	}
	return value;
};
