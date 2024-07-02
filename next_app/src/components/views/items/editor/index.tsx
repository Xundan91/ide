import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { TView } from ".."
import { useGlobalState, useProjectManager, useWallet } from "@/hooks";
import { Button } from "@/components/ui/button";
import SingleFileEditor from "./components/single-file-editor";
import NotebookEditor from "./components/notebook-editor";
import { LoaderIcon, X } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import runIcon from "@/assets/icons/run.svg";
import { toast } from "sonner";
import { runLua } from "@/lib/ao-vars";
import { sendGAEvent } from "@next/third-parties/google";

function Editor() {
    const globalState = useGlobalState();
    const manager = useProjectManager();
    const wallet = useWallet();
    const [running, setRunning] = useState(false);

    const project = globalState.activeProject && manager.projects[globalState.activeProject];
    const files = project && Object.keys(project.files);

    function FileTabItem({ fname }: { fname: string }) {
        const [hovered, setHovered] = useState(false);
        const active = globalState.activeFile == fname;
        return <Button variant="ghost" onMouseEnter={() => setHovered(!active && true)} onMouseLeave={() => setHovered(!active && false)}
            className="rounded-none h-[39px] data-[active=true]:bg-primary border-r data-[active=true]:text-white px-1 pl-2.5"
            data-active={active}
            onClick={() => globalState.setActiveFile(fname)}>
            {fname} <X data-active={!active && hovered}
                className="data-[active=true]:text-primary text-background hover:bg-background/20 p-0.5 rounded-sm ml-1" size={18}
                onClick={(e) => {
                    e.stopPropagation()
                    globalState.closeOpenedFile(fname)
                }}
            />
        </Button>

    }

    function switchFileType(): JSX.Element {
        if (!globalState.activeFile) {
            globalState.setActiveView(null)
            return
        }
        switch (globalState.activeFile.split(".").pop()) {
            case "lua":
                return <SingleFileEditor />
            case "luanb":
                return <NotebookEditor />
            default:
                return <div>file</div>
        }
    }

    async function runLuaFile() {
        const p = manager.getProject(project.name);
        if (!p.process) return toast("No process found for this project");
        const ownerAddress = p.ownerWallet;
        const activeAddress = wallet.address;
        // if (ownerAddress != activeAddress) return toast({ title: "The owner wallet for this project is differnet", description: `It was created with ${shortAddress}.\nSome things might be broken` })
        if (ownerAddress != activeAddress) return toast.error(`The owner wallet for this project is differnet\nIt was created with ${wallet.shortAddress}.\nSome things might be broken`)

        const file = project.files[globalState.activeFile];
        if (!file) return;
        const code = file.content.cells[0].code;
        console.log(code)

        setRunning(true);
        const fileContent = { ...file.content };
        const result = await runLua(fileContent.cells[0].code, p.process, [
            { name: "File-Type", value: "Normal" }
        ]);
        console.log(result);
        if (result.Error) {
            console.log(result.Error);
            fileContent.cells[0].output = result.Error;
        } else {
            const outputData = result.Output.data;
            if (outputData.output) {
                console.log(outputData.output);
                fileContent.cells[0].output = outputData.output;
            } else if (outputData.json) {
                console.log(outputData.json);
                fileContent.cells[0].output = JSON.stringify(outputData.json, null, 2);
            }
        }
        manager.updateFile(p, { file, content: fileContent });
        setRunning(false);
        sendGAEvent({ event: 'run_code', value: 'file' })
    }

    return <ResizablePanelGroup direction="vertical">
        <ResizablePanel collapsible defaultSize={50} minSize={10} className="">
            {/* FILE BAR */}
            <div className="h-[40px] flex overflow-scroll border-b relative">
                <div className="h-[40px] flex overflow-scroll relative">
                    {
                        globalState.openedFiles.map((file, i) => <FileTabItem key={i} fname={file} />)
                    }
                </div>
                {
                    globalState.activeFile.endsWith(".lua") && <div className="bg-background static right-0 top-0 h-[39px] border-l flex items-center justify-center ml-auto">
                        <Button variant="ghost" className="rounded-none h-[39px] w-[39px] p-0 bg-primary/20" onClick={runLuaFile}>
                            {running ?
                                <LoaderIcon size={20} className="p-0 animate-spin text-primary" />
                            : <Image src={runIcon} alt="Run" width={20} height={20} className="p-0" />}
                        </Button>
                    </div>
                }
            </div>
            <div className="h-[calc(100%-40px)] overflow-scroll">
                {/* FILE CONTENTS */}
                {switchFileType()}
            </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={20} minSize={5} collapsible>
            {/* BOTTOM BAR */}
            <div className="h-[30px]">files</div>
            <div className="h-[calc(100%-30px)] overflow-scroll ring-1">
                {/* {switchFileType()} */}
                {
                    Array(10).fill(0).map((_, i) => <div key={i}>File {i}</div>)
                }
            </div>
        </ResizablePanel>
    </ResizablePanelGroup>
}

const viewItem: TView = {
    component: Editor,
    label: "Editor",
    value: "EDITOR"
}

export default viewItem;