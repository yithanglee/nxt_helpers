// You may need to install js-cookie if not already in your project

import { PHX_HTTP_PROTOCOL, PHX_ENDPOINT, PHX_COOKIE } from '@/lib/constants';
interface PostDataOptions {
    data?: any;
    method?: string;
    endpoint?: string;
    isFormData?: boolean;
    successCallback?: () => void;
}

export async function postData(postDataOptions: PostDataOptions = {}) {
    const {
        data = {},
        method = 'POST',
        endpoint = '',
        isFormData = false,
        successCallback
    } = postDataOptions;
    let res;

    let token =  'empty';

    let headers: Record<string, string> = {
        "phx-request": "library.pioneer.org.my",
        "Authorization": `Basic ${token}`,
        "Content-Type": "application/json",
    };

    if (isFormData) {
        delete headers["Content-Type"];
    }

    const requestOptions: RequestInit = {
        method: method || "POST",
        headers: headers,
        body: isFormData ? data : JSON.stringify(data),
    };

    console.info(requestOptions);

    try {
        const response = await fetch(endpoint || (PHX_HTTP_PROTOCOL + PHX_ENDPOINT), requestOptions);

        if (response.status === 403) {
           
            //   goto("/");
            return;
        }

        if (response.ok) {
            res = await response.json();
            console.log(res);

            if (res.status) {
                if (res.status === "ok") {
                    //   get(isToastOpen).notify("Submitted successfully!");
                } else if (res.status === "error" && res.reason) {
                    //   get(isToastOpen).notify("Error! " + res.reason);
                }
            } else {
                // get(isToastOpen).notify("Submitted successfully!");
            }

            if (successCallback) {
                successCallback();
            }
        } else {
            //   get(isToastOpen).notify("Not Submitted!");
        }
    } catch (error) {
        console.error(error);
        // get(isToastOpen).notify("Error!");
    }

    return res;
}

export function buildQueryString(data: Record<string, any>, parentKey: string | null = null): string {
    return Object.keys(data)
        .map((key) => {
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
        .filter(Boolean)
        .join('&');
}

export async function genInputs(url: string, module: string) {
    let items: { key: string; value: any; }[] = [];
    const apiData = {
        scope: 'gen_inputs',
        module: module
    };
    const queryString = buildQueryString(apiData);
    const response = await fetch(`${url}/svt_api/webhook?${queryString}`, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (response.ok) {
        let dataList = await response.json();
        let keys = Object.keys(dataList);
        keys.sort((a, b) => a.localeCompare(b));

        keys.forEach((v) => {
            items.push({ key: v, value: dataList[v] });
        });
        console.log(items);
        return items;
    } else {
        console.error('API request failed');
        return [];
    }
}

export async function api_get(url: string, params: Record<string, any>) {
    const queryString = buildQueryString(params);
    const response = await fetch(`${url}/svt_api/webhook?${queryString}`, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (response.ok) {
        let dataList = await response.json();
        return dataList;
    } else {
        console.error('API request failed');
        return [];
    }
}

export async function ngrok_get(url: string, params: Record<string, any>) {
    const queryString = buildQueryString(params);
    const response = await fetch(`${url}/ngrok/webhook?${queryString}`, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (response.ok) {
        let dataList = await response.json();
        return dataList;
    } else {
        console.error('API request failed');
        return [];
    }
}