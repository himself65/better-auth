"use client";

import {
	SearchDialog,
	SearchDialogContent,
	SearchDialogHeader,
	SearchDialogInput,
	SearchDialogList,
} from "fumadocs-ui/components/dialog/search";
import type { SharedProps } from "fumadocs-ui/components/dialog/search";
import { useState, useCallback } from "react";
import useSWR from "swr";
import { useDebounce } from "use-debounce";

interface SearchResult {
	title: string;
	content: string;
	url: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CustomSearchDialog(props: SharedProps) {
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebounce(search, 500);
	
	const { data, isLoading } = useSWR<SearchResult[]>(
		debouncedSearch ? `/api/search?query=${encodeURIComponent(debouncedSearch)}` : null,
		fetcher
	);

	const items = data?.map((item) => ({
		type: "page" as const,
		id: item.url,
		title: item.title,
		content: item.content,
		url: item.url,
	})) || [];

	return (
		<SearchDialog
			open={props.open}
			onOpenChange={props.onOpenChange}
			search={search}
			onSearchChange={setSearch}
			isLoading={isLoading}
		>
			<SearchDialogContent>
				<SearchDialogHeader>
					<SearchDialogInput 
						placeholder="Search documentation..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</SearchDialogHeader>
				<SearchDialogList 
					items={items} 
					empty={!isLoading && debouncedSearch ? "No results found." : undefined}
				/>
			</SearchDialogContent>
		</SearchDialog>
	);
}
