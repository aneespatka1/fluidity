import { useRouter } from "next/navigation";
import { FaGithub } from "react-icons/fa";
import { AlertCircleIcon, GlobeIcon, Loader2Icon } from "lucide-react";

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Doc } from "../../../../convex/_generated/dataModel";

import { useProjects } from "../hooks/use-projects";

const getProjectIcon = (project: Doc<"projects">) => {
    if (project.importStatus === "completed") {
        return <FaGithub className="size-3.5 text-muted-foreground" />
    }

    if (project.importStatus === "failed") {
        return <AlertCircleIcon className="size-3.5 text-muted-foreground" />
    }

    if (project.importStatus === "importing") {
        return <Loader2Icon className="size-3.5 text-muted-foreground animate-spin" />
    }

    return <GlobeIcon className="size-3.5 text-muted-foreground" />
}

interface ProjectCommandDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const ProjectCommandDialog = ({
    open,
    onOpenChange,
}: ProjectCommandDialogProps) => {

    const router = useRouter();
    const projects = useProjects();

    const handleSelect = (projectId: string) => {
        router.push(`/projects/${projectId}`);
        onOpenChange(false);
    }

    return (
        <CommandDialog 
            open={open} onOpenChange={onOpenChange}
            title="Search projects"
            description="Search and navigate to your projects"
        >
            <CommandInput placeholder="Type a project name..." />
            <CommandList>
                <CommandEmpty>
                    No projects found.
                </CommandEmpty>
                <CommandGroup heading="Projects">
                    {projects?.map(project => (
                        <CommandItem
                            key={project._id}
                            value={`${project.name}-${project._id}`}
                            onSelect={() => handleSelect(project._id)}
                        >
                            {getProjectIcon(project)}
                            <span>{project.name}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )

}