import { PHX_ENDPOINT, PHX_HTTP_PROTOCOL } from "@/lib/constants";

interface DataTableProps {
    itemsPerPage?: number
    appendQueries?: Record<any, any>
    showNew?: boolean
    showGrid?: boolean
    canDelete?: boolean
    search_queries?: string[]
    join_statements?: Record<any, any>
    model: string
    preloads?: string[] | Record<any, any>
}

export async function populateData({
    itemsPerPage = 100,
    appendQueries = {},
    join_statements = [],
    search_queries = [],
    model,
    preloads = [],

}: DataTableProps) {


    function buildSearchString(query: any) {

        console.log(query)

        if (Object.keys(query).length == 0) {
            return null
        } else {
            const slist = Object.entries(query)
                .filter(([_, value]) => value)
                .map(([key, value]) => `${key}=${value}`)
            return slist.join('|') || search_queries.join('|')
        }


    }


    function buildQueryString(data: any, parentKey: any) {
        return Object.keys(data)
            .map((key): any => {
                const nestedKey = parentKey
                    ? `${parentKey}[${encodeURIComponent(key)}]`
                    : encodeURIComponent(key);

                if (data[key] != null && typeof data[key] === 'object' && !Array.isArray(data[key])) {
                    return buildQueryString(data[key], nestedKey);
                } else if (data[key] == null) {

                    return ``;
                } else {
                    return `${nestedKey}=${encodeURIComponent(data[key])}`;
                }
            })
            .join('&');
    }


    async function fetchData(pageNumber: number) {
        let order_statements: never[] = []


        const apiData = {
            search: { regex: 'false', value: search_queries },
            additional_join_statements: JSON.stringify(join_statements),
            additional_search_queries: buildSearchString(search_queries),
            additional_order_statements: JSON.stringify(order_statements),
            draw: '1',
            length: itemsPerPage,
            model: model,
            columns: { 0: { data: 'id', name: 'id' } },
            order: { 0: { column: 0, dir: 'desc' } },
            preloads: JSON.stringify(preloads),
            start: (pageNumber - 1) * itemsPerPage,
        };

        const queryString = buildQueryString({ ...apiData, ...appendQueries }, null);
        const blog_url = PHX_HTTP_PROTOCOL + PHX_ENDPOINT;
        console.info(apiData)
        try {
            const response = await fetch(`${blog_url}/svt_api/${model}?${queryString}`, {
                headers: {
                    'content-type': 'application/json'
                },
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            let dataList = await response.json();
            return dataList;

        } catch (error) {
            console.error('An error occurred', error);
        } finally {

        }
    };

    let res = await fetchData(1);


    return res;



}


