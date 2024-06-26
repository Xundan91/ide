import Image from "next/image";
import { Button } from "@/components/ui/button";
import Icons from "@/assets/icons";
import { SwitchCustom } from "@/components/ui/custom/switch";
import { useRouter } from "next/navigation";
import { useGlobalState } from "@/states";
import Link from "next/link";
import { useState } from "react";
import Blueprints from "./ao/blueprints";
import Modules from "./ao/modules";
import { useProjectManager } from "@/hooks";
import { parseOutupt, runLua } from "@/lib/ao-vars";
import { unescape } from "querystring";
import Share from "./ao/share";
import Packages from "./ao/packages";
import { FileTextIcon as DownloadIcon } from "@radix-ui/react-icons";
import JSZip from "jszip";

export default function TopBar() {
    const router = useRouter();
    const globalState = useGlobalState();
    const projectManager = useProjectManager();

    function downloadProject() {
        const project = projectManager.getProject(globalState.activeProject);
        if (!project) return;
        const { files } = project;
        console.log(files)
        const fileContents = Object.values(files);
        const zip = new JSZip();
        fileContents.forEach(file => {
            console.log(file)
            // const fileName = file.name.split(".")[0] + ".luanb";
            const fileName = file.name;
            const contents = file.name.endsWith(".luanb") ? JSON.stringify(file) : file.content.cells[0].code;
            zip.file(fileName, contents);
        })
        zip.generateAsync({ type: "blob" }).then((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${globalState.activeProject}.zip`;
            a.click();
        })

    }

    return (
        <nav className="py-5 px-3 flex border-b justify-between items-center h-16">
            <div className="flex px-3 gap-0.5 items-center">
                <Link href="/">
                    <Image src="/icon.svg" alt="BetterIDEa" width={15} height={15} className="mr-5" />
                </Link>

                <Button variant="link" className="text-md text-foreground opacity-50 hover:opacity-70 active:opacity-100" onClick={() => { globalState.setActiveProject("") }}>
                    Home
                </Button>
                <Link href="https://docs.betteridea.dev" target="_blank">
                    <Button variant="link" className="text-md text-foreground opacity-50 hover:opacity-70 active:opacity-100">
                        Docs
                    </Button>
                </Link>
                <Link href="https://learn.betteridea.dev" target="_blank">
                    <Button variant="link" className="text-md text-foreground opacity-50 hover:opacity-70 active:opacity-100">
                        Learn
                    </Button>
                </Link>
            </div>


            <div className="flex gap-4 items-end">
                {globalState.activeMode == "AO"
                    && globalState.activeProject && <>
                        <div className="flex flex-col items-center justify-start opacity-50 hover:opacity-80 active:opacity-100 cursor-pointer" onClick={downloadProject}>
                            {/* <Image src={Icons.shareSVG} alt="Send" width={22} height={22} className="my-2" /> */}
                            <DownloadIcon className="mb-1.5 h-5 w-5 fill-foreground" />
                            <div className="text-xs">DOWNLOAD</div>
                        </div>

                        <Share />
                        {/* <Modules /> */}
                        <Packages />
                        <Blueprints />
                    </>
                }

                {/* <Button variant="link" className="p-2 h-7 hover:invert">
          <Image src={Icons.mailSVG} alt="Inbox" width={15} height={15} />
        </Button>

        <Button variant="link" className="p-2 h-7 hover:invert">
          <Image src={Icons.downloadSVG} alt="Download" width={15} height={15} />
        </Button>

        <Button variant="link" className="p-2 h-7 hover:invert">
          <Image src={Icons.sendSVG} alt="Send" width={15} height={15} />
        </Button> */}

                <SwitchCustom
                    className="ml-5 hidden"
                    onCheckedChange={(checked) => {
                        globalState.activeMode == "AO" ? globalState.setActiveMode("WARP") : globalState.setActiveMode("AO");
                        // checked ? router.replace(`/warp`) : router.replace(`/ao`);
                    }}
                    checked={globalState.activeMode == "WARP"}
                />
            </div>
        </nav>
    );
}
