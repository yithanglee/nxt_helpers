"use client"
import { useRef, useEffect, useState } from "react";
import jspreadsheet from "jspreadsheet-ce";
import { Button } from "./ui/button";
import { Download, Save, Upload } from "lucide-react";
import { Input } from "./ui/input";
import 'jspreadsheet-ce/dist/jspreadsheet.css'
import { postData } from "@/lib/svt_utils";
import { PHX_ENDPOINT, PHX_HTTP_PROTOCOL } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
type PostFn = () => void;
interface IndexPageProps {
    postFn: PostFn;
}
// Define the type for a book data object
interface BookData {
    [key: string]: string;
}

interface HTMLDivElementWithJExcel extends HTMLDivElement {
    jexcel?: any; // Use 'any' or the specific type if you know the type of jexcel
}
const IndexPage: React.FC<IndexPageProps> = ({ postFn }) => {
    const { user, isLoading } = useAuth()
    const url = PHX_HTTP_PROTOCOL + PHX_ENDPOINT;
    const jRef = useRef<HTMLDivElementWithJExcel | null>(null);
    const [dataMap, setDataMap] = useState<BookData[] | null>(null);
    const [spreadsheet, setSpreadsheet] = useState<any | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    let l = ["SEQ", "TITLE", "BARCODE", "ISBN", "AUTHOR",
        "PUBLISHER", "DESCRIPTION", "CALL NO", "PRICE"]
    useEffect(() => {
        if (jRef.current && !jRef.current.jexcel) {
            const instance = jspreadsheet(jRef.current!, {
                allowExport: true,
                includeHeadersOnDownload: true,
                csvFileName: "book_entry" + makeid(4),
                tableOverflow: false,
                columns: [
                    { type: 'text', title: 'SEQ', width: 50 },
                    { type: 'text', title: 'TITLE', width: 300 },
                    { type: 'text', title: 'BARCODE', width: 150 },
                    { type: 'text', title: 'ISBN', width: 150 },
                    { type: 'text', title: 'AUTHOR', width: 100 },

                    { type: 'text', title: 'PUBLISHER', width: 100 },
                    { type: 'text', title: 'DESCRIPTION', width: 100 },
                    { type: 'text', title: 'CALL NO', width: 150 },
                    { type: 'text', title: 'PRICE', width: 100 },

                ], minDimensions: [9, 10]
            });

            setSpreadsheet(instance)
        }
    });

    const handleDownloadCSV = () => {

        if (spreadsheet) {
            const csv = spreadsheet.download()
        }
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result;

                // Check if content is a string before calling .split
                if (typeof content === "string") {
                    let list = content.split("\r\n");
                    const header = list.splice(0, 1);

                    // Explicitly type the arrays
                    let newDatas: string[][] = [];
                    let newDatas2: Record<string, string>[] = [];

                    list.forEach((d: string) => {
                        let newMap: Record<string, string> = {};
                        header[0].split(",").forEach((k: string, i: number) => {
                            newMap[k] = d.split(",")[i] || "";
                        });
                        if (newMap.TITLE !== "") {
                            newDatas2.push(newMap);
                            newDatas.push(d.split(","));
                        }
                    });

                    if (spreadsheet) {
                        setDataMap(newDatas2);
                        spreadsheet.setData(newDatas); // Pass the array directly, not as a string
                    }
                }
            };
            reader.readAsText(file);
        }
    };


    async function handleSaveData(event: React.MouseEvent<HTMLButtonElement>): Promise<void> {
        if (spreadsheet) {
            let res = await postData({
                data: { books: dataMap, organization_id: user?.userStruct?.organization_id },
                endpoint: `${url}/svt_api/webhook?scope=upload_csv_books`,
            });

            if (res.status === "ok") {
                postFn();
            }
        }
    }

    //   jspreadsheet(jRef.current, options);
    return (

        <div className="relative">

            <p>You can copy paste from excel onto this pages excel. Download the csv first, then upload again, then save data.</p>
            <div className="my-4 space-x-2">
                <Button onClick={handleDownloadCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                </Button>
                <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CSV
                </Button>
                <Button onClick={handleSaveData}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Data
                </Button>
                <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv"
                    className="hidden"
                />
            </div>
            <div ref={jRef} />
        </div>
    );
}
function makeid(arg0: number) {
    let result = "";
    let characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;

}
export default IndexPage;
