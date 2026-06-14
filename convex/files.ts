import { v } from "convex/values";

import { verifyAuth } from "./auth";
import { mutation, query } from "./_generated/server";

import { Id } from "./_generated/dataModel";

export const getFiles = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);

        const project = await ctx.db.get("projects", args.projectId);

        if (!project) {
            throw new Error("Project not found");
        }

        if (project.ownerId !== identity.subject) {
            throw new Error("Not authorized to access this project");
        }

        return await ctx.db
        .query("files")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();
    },
});


export const getFile = query({
    args: { id: v.id("files") },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);

        const file = await ctx.db.get("files", args.id);

        if (!file) {
            throw new Error("File not found");
        }

        const project = await ctx.db.get("projects", file.projectId);

        if (!project) {
            throw new Error("Project not found");
        }

        if (project.ownerId !== identity.subject) {
            throw new Error("Not authorized to access this project");
        }

        return file;
    },
});

export const getFolderContents = query({
    args: { 
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files"))
    },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);

        const project = await ctx.db.get("projects", args.projectId);

        if (!project) {
            throw new Error("Project not found");
        }

        if (project.ownerId !== identity.subject) {
            throw new Error("Not authorized to access this project");
        }

        const files = await ctx.db
            .query("files")
            .withIndex("by_project_parent", (q) => q.eq("projectId", args.projectId).eq("parentId", args.parentId))
            .collect();

        // Sort folders first, then files, both alphabetically by name
        return files.sort((a, b) => {
            // Folders first
            if (a.type === 'folder' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'folder') return 1;

            // Within same type, sort by name
            return a.name.localeCompare(b.name);
        });
    },
});

export const createFile = mutation({
    args: { 
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files")),
        name: v.string(),
        content: v.optional(v.string()),
        storageId: v.optional(v.id("_storage"))
    },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);

        const project = await ctx.db.get("projects", args.projectId);

        if (!project) {
            throw new Error("Project not found");
        }

        if (project.ownerId !== identity.subject) {
            throw new Error("Not authorized to access this project");
        }
        
        // Check if a file with the same name already exists in the same parent folder
        const files = await ctx.db
            .query("files")
            .withIndex("by_project_parent", (q) => q.eq("projectId", args.projectId).eq("parentId", args.parentId))
            .collect();

        const existing = files.find(file => file.name === args.name && file.type === 'file');

        if (existing) {
            throw new Error("File already exists");
        }

        const now = Date.now();

        await ctx.db.insert("files", {
            projectId: args.projectId,
            parentId: args.parentId,
            name: args.name,
            content: args.content,
            storageId: args.storageId,
            type: "file",
            updatedAt: now,
        });

        await ctx.db.patch("projects", args.projectId, {
            updatedAt: now,
        });
    },
});


export const createFolder = mutation({
    args: { 
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files")),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);

        const project = await ctx.db.get("projects", args.projectId);

        if (!project) {
            throw new Error("Project not found");
        }

        if (project.ownerId !== identity.subject) {
            throw new Error("Not authorized to access this project");
        }
        
        // Check if folder with the same name already exists in the same parent folder
        const files = await ctx.db
            .query("files")
            .withIndex("by_project_parent", (q) => q.eq("projectId", args.projectId).eq("parentId", args.parentId))
            .collect();

        const existing = files.find(file => file.name === args.name && file.type === 'folder');

        if (existing) {
            throw new Error("Folder already exists");
        }

        const now = Date.now();

        await ctx.db.insert("files", {
            projectId: args.projectId,
            parentId: args.parentId,
            name: args.name,
            type: "folder",
            updatedAt: now,
        });

        await ctx.db.patch("projects", args.projectId, {
            updatedAt: now,
        });
    },
});

export const renameFile = mutation({
    args: {
        id: v.id("files"),
        newName: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);

        const file = await ctx.db.get("files", args.id);

        if (!file) {
            throw new Error("File not found");
        }

        const project = await ctx.db.get("projects", file.projectId);

        if (!project) {
            throw new Error("Project not found");
        }
        
        if (project.ownerId !== identity.subject) {
            throw new Error("Not authorized to access this project");
        }

        // Check if a file or folder with the same name already exists in the same parent folder
        const siblings = await ctx.db
            .query("files")
            .withIndex("by_project_parent", (q) => q.eq("projectId", file.projectId).eq("parentId", file.parentId))
            .collect();
        
        const existing = siblings.find(sibling => 
            sibling.name === args.newName && sibling.type === file.type && sibling._id !== args.id
        );

        if (existing) {
            throw new Error(`A ${file.type} with the same name already exists`);
        }

        const now = Date.now();

        // Update the file or folder name
        await ctx.db.patch("files", args.id, {
            name: args.newName,
            updatedAt: now,
        });

        await ctx.db.patch("projects", file.projectId, {
            updatedAt: now,
        });

    }
});


export const deleteFile = mutation({
    args: {
        id: v.id("files"),
    },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);

        const file = await ctx.db.get("files", args.id);

        if (!file) {
            throw new Error("File not found");
        }

        const project = await ctx.db.get("projects", file.projectId);

        if (!project) {
            throw new Error("Project not found");
        }
        
        if (project.ownerId !== identity.subject) {
            throw new Error("Not authorized to access this project");
        }

        // Recursively delete all child files and folders
        const deleteRecursively = async (fileId: Id<"files">) => {
            const item = await ctx.db.get("files", fileId);

            if (!item) return;

            // If its a folder, delete all children
            if (item.type === 'folder') {
                const children = await ctx.db
                    .query('files')
                    .withIndex("by_project_parent", (q) => q.eq("projectId", item.projectId).eq("parentId", fileId))
                    .collect();
                
                for (const child of children) {
                    await deleteRecursively(child._id);
                }
            }

            // Delete storage file if it exists
            if (item.storageId) {
                await ctx.storage.delete(item.storageId);
            }

            // Delete the file/folder itself
            await ctx.db.delete("files", fileId);
        };

        await deleteRecursively(args.id);

        await ctx.db.patch("projects", file.projectId, {
            updatedAt: Date.now(),
        });

    }
});

export const updateFile = mutation({
    args: {
        id: v.id("files"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);

        const file = await ctx.db.get("files", args.id);

        if (!file) {
            throw new Error("File not found");
        }

        const project = await ctx.db.get("projects", file.projectId);

        if (!project) {
            throw new Error("Project not found");
        }
        
        if (project.ownerId !== identity.subject) {
            throw new Error("Not authorized to access this project");
        }

        const now = Date.now();

        await ctx.db.patch("files", args.id, {
            content: args.content,
            updatedAt: now,
        });

        await ctx.db.patch("projects", file.projectId, {
            updatedAt: now,
        });
    }
})