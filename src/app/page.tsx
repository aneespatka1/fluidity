"use client";

import { useQuery, useMutation } from "convex/react";
import { Button } from "@/components/ui/button";

import { api } from "../../convex/_generated/api";

const X = () => {
  const projects = useQuery(api.projects.get);
  const createProject = useMutation(api.projects.create);

  return (
    <div className="flex flex-col gap-2 p-4">
      <Button
        onClick={() => createProject({ name: `Project ${Date.now()}` })}
      >
        Create Project
      </Button>

      {projects?.map((project) => (
        <div key={project._id} className="p-2 border rounded flex flex-col">
          <p>{project.name}</p>
          <p>Owner: {project.ownerId}</p>
        </div>
      ))}
    </div>
  );

}

export default X;