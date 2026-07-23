/// <reference types="vite/client" />
import supabase from "./supabase";
import { FileRecord, StorageProvider } from "../store/filesSlice";

const EDGE_FUNCTION_URL = import.meta.env.VITE_EDGE_FUNCTION_URL || "";
const DEFAULT_BUCKET = "files";

export interface FetchFilesOptions {
  bucket?: string;
  folder?: string;
  search?: string;
  sortBy?: "date-desc" | "date-asc" | "name-asc" | "name-desc" | "size-desc" | "size-asc";
  page?: number;
  limit?: number;
}

export interface FetchFilesResponse {
  files: FileRecord[];
  folders: string[];
  totalCount: number;
}

/**
 * Create a new folder in Supabase Storage by creating an empty placeholder
 */
export const createFolderInSupabase = async (
  folderName: string,
  bucket = DEFAULT_BUCKET
): Promise<string> => {
  const sanitizedFolder = folderName.trim().replace(/[^a-zA-Z0-9_.-]/g, "_");
  if (!sanitizedFolder) {
    throw new Error("Invalid folder name provided");
  }

  const placeholderPath = `${sanitizedFolder}/.emptyFolderPlaceholder`;
  const dummyBlob = new Blob([""], { type: "text/plain" });

  const { error } = await supabase.storage
    .from(bucket)
    .upload(placeholderPath, dummyBlob, { upsert: true });

  if (error && !error.message?.includes("already exists")) {
    console.error("Supabase create folder error:", error);
    throw error;
  }

  return sanitizedFolder;
};

/**
 * Upload files to Supabase Storage or Edge Function (S3 / Google Drive)
 */
export const uploadFilesToStorage = async (
  files: File[],
  provider: StorageProvider = "supabase",
  targetFolder = "files",
  bucket = DEFAULT_BUCKET
): Promise<FileRecord[]> => {
  if (provider === "supabase") {
    const uploadedRecords: FileRecord[] = [];
    const cleanFolder = targetFolder.trim().replace(/^\/+|\/+$/g, "") || "files";

    for (const file of files) {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const filePath = `${cleanFolder}/${Date.now()}-${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (error) {
        console.error("Supabase file upload error:", error);
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      uploadedRecords.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        storage: "supabase",
        path: data.path,
        folder: cleanFolder,
        bucket,
        url: publicUrlData?.publicUrl || "",
        timestamp: new Date().toISOString(),
      });
    }
    return uploadedRecords;
  }

  // Edge Function API Call for Amazon S3 / Google Drive
  if (EDGE_FUNCTION_URL) {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("provider", provider);
    formData.append("folder", targetFolder);

    const res = await fetch(`${EDGE_FUNCTION_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Edge function upload failed: ${res.statusText}`);
    }

    const json = await res.json();
    return json.files as FileRecord[];
  }

  throw new Error(
    `${provider.toUpperCase()} Edge Function is not configured yet. Set VITE_EDGE_FUNCTION_URL or deploy your Edge Function.`
  );
};

/**
 * Fetch files with server-side search, sorting, and pagination from Supabase Storage
 */
export const fetchFilesFromSupabase = async (
  options: FetchFilesOptions = {}
): Promise<FetchFilesResponse> => {
  const bucket = options.bucket || DEFAULT_BUCKET;
  const folder = options.folder || "all";
  const search = options.search?.trim() || "";
  const page = options.page || 1;
  const limit = options.limit || 10;
  const sortBy = options.sortBy || "date-desc";

  let sortColumn = "created_at";
  let sortOrder: "asc" | "desc" = "desc";

  if (sortBy === "date-asc") {
    sortColumn = "created_at";
    sortOrder = "asc";
  } else if (sortBy === "name-asc") {
    sortColumn = "name";
    sortOrder = "asc";
  } else if (sortBy === "name-desc") {
    sortColumn = "name";
    sortOrder = "desc";
  }

  const discoveredFolders = new Set<string>();
  const rawFiles: { item: any; folderPath: string }[] = [];

  try {
    // 1. Discover top-level root folders
    const { data: rootItems } = await supabase.storage.from(bucket).list("", { limit: 100 });

    const foldersToScan: string[] = [];

    if (rootItems) {
      rootItems.forEach((item) => {
        const isFolder = !item.metadata || Object.keys(item.metadata).length === 0 || !item.name.includes(".");
        if (isFolder && item.name !== ".emptyFolderPlaceholder") {
          foldersToScan.push(item.name);
          discoveredFolders.add(item.name);
        }
      });
    }

    if (folder !== "all") {
      const { data: folderItems } = await supabase.storage.from(bucket).list(folder, {
        limit: 1000,
        search: search || undefined,
        sortBy: { column: sortColumn, order: sortOrder },
      });

      if (folderItems) {
        folderItems.forEach((item) => {
          if (item.name !== ".emptyFolderPlaceholder") {
            rawFiles.push({ item, folderPath: folder });
          }
        });
      }
      discoveredFolders.add(folder);
    } else {
      const targetFolders = foldersToScan.length > 0 ? foldersToScan : ["files"];
      await Promise.all(
        targetFolders.map(async (folderPath) => {
          const { data: folderItems } = await supabase.storage.from(bucket).list(folderPath, {
            limit: 1000,
            search: search || undefined,
            sortBy: { column: sortColumn, order: sortOrder },
          });

          if (folderItems) {
            folderItems.forEach((item) => {
              if (item.name !== ".emptyFolderPlaceholder") {
                rawFiles.push({ item, folderPath });
              }
            });
          }
        })
      );
    }
  } catch (err) {
    console.error("Failed to fetch storage contents:", err);
  }

  // Handle client/server side sorting adjustments if needed
  if (sortBy === "size-desc") {
    rawFiles.sort((a, b) => (b.item.metadata?.size || 0) - (a.item.metadata?.size || 0));
  } else if (sortBy === "size-asc") {
    rawFiles.sort((a, b) => (a.item.metadata?.size || 0) - (b.item.metadata?.size || 0));
  } else if (sortBy === "date-desc") {
    rawFiles.sort((a, b) => new Date(b.item.created_at || 0).getTime() - new Date(a.item.created_at || 0).getTime());
  } else if (sortBy === "date-asc") {
    rawFiles.sort((a, b) => new Date(a.item.created_at || 0).getTime() - new Date(b.item.created_at || 0).getTime());
  } else if (sortBy === "name-asc") {
    rawFiles.sort((a, b) => a.item.name.localeCompare(b.item.name));
  } else if (sortBy === "name-desc") {
    rawFiles.sort((a, b) => b.item.name.localeCompare(a.item.name));
  }

  const totalCount = rawFiles.length;

  // Server-side pagination slicing
  const startIndex = (page - 1) * limit;
  const paginatedItems = rawFiles.slice(startIndex, startIndex + limit);

  const formattedFiles: FileRecord[] = paginatedItems.map(({ item, folderPath }) => {
    const fullPath = `${folderPath}/${item.name}`;
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fullPath);

    return {
      id: item.id || `sp-${fullPath}`,
      name: item.name.replace(/^\d+-/, ""),
      size: item.metadata?.size || 0,
      type: item.metadata?.mimetype || "application/octet-stream",
      storage: "supabase",
      path: fullPath,
      folder: folderPath,
      bucket,
      url: publicUrlData?.publicUrl || "",
      timestamp: item.created_at || new Date().toISOString(),
    };
  });

  return {
    files: formattedFiles,
    folders: Array.from(discoveredFolders),
    totalCount,
  };
};

/**
 * Move file to another existing or new folder in Supabase Storage or Edge Function
 */
export const moveFileInStorage = async (
  file: FileRecord,
  targetFolder: string,
  bucket = DEFAULT_BUCKET
): Promise<{ newPath: string; newUrl: string }> => {
  const cleanTargetFolder = targetFolder.trim().replace(/^\/+|\/+$/g, "") || "files";
  const currentFolder = file.folder || "files";

  if (currentFolder === cleanTargetFolder) {
    return { newPath: file.path || "", newUrl: file.url || "" };
  }

  if (file.storage === "supabase") {
    const filename = file.path ? file.path.split("/").pop() || file.name : `${Date.now()}-${file.name}`;
    const oldPath = file.path || `${currentFolder}/${filename}`;
    const newPath = `${cleanTargetFolder}/${filename}`;

    const { error } = await supabase.storage.from(bucket).move(oldPath, newPath);
    if (error) {
      console.error("Supabase move file error:", error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(newPath);

    return {
      newPath,
      newUrl: publicUrlData?.publicUrl || file.url || "",
    };
  }

  // Edge Function API Call for S3 / Google Drive file move
  if (EDGE_FUNCTION_URL) {
    const res = await fetch(`${EDGE_FUNCTION_URL}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: file.storage,
        fileId: file.id,
        path: file.path,
        targetFolder: cleanTargetFolder,
      }),
    });

    if (!res.ok) {
      throw new Error(`Edge function move error: ${res.statusText}`);
    }

    const json = await res.json();
    return { newPath: json.newPath, newUrl: json.newUrl };
  }

  return { newPath: `${cleanTargetFolder}/${file.name}`, newUrl: file.url || "" };
};

/**
 * Generate Presigned / Signed URL for file sharing
 */
export const getPresignedUrl = async (
  file: FileRecord,
  expiresInSeconds = 3600
): Promise<string> => {
  if (file.storage === "supabase") {
    const targetPath = file.path || `${file.folder || "files"}/${file.name}`;
    const { data, error } = await supabase.storage
      .from(file.bucket || DEFAULT_BUCKET)
      .createSignedUrl(targetPath, expiresInSeconds);

    if (error) {
      console.warn("Failed to create signed URL, falling back to public URL:", error);
      return file.url || "";
    }

    return data.signedUrl;
  }

  // Edge Function API Call for Amazon S3 / Google Drive presigned URLs
  if (EDGE_FUNCTION_URL) {
    const res = await fetch(`${EDGE_FUNCTION_URL}/presigned-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: file.storage,
        path: file.path,
        expiresIn: expiresInSeconds,
      }),
    });

    if (!res.ok) {
      throw new Error(`Edge function presigned URL error: ${res.statusText}`);
    }

    const json = await res.json();
    return json.url;
  }

  if (file.storage === "s3") {
    return `https://${file.bucket || "s3-bucket"}.s3.amazonaws.com/${file.path || file.name}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=${expiresInSeconds}`;
  }
  return `https://drive.google.com/file/d/${file.id}/view?usp=sharing`;
};

/**
 * Delete file from Supabase or Cloud Storage
 */
export const deleteFileFromStorage = async (file: FileRecord): Promise<void> => {
  if (file.storage === "supabase") {
    const targetPath = file.path || `${file.folder || "files"}/${file.name}`;
    const { error } = await supabase.storage.from(file.bucket || DEFAULT_BUCKET).remove([targetPath]);
    if (error) throw error;
    return;
  }

  if (EDGE_FUNCTION_URL) {
    const res = await fetch(`${EDGE_FUNCTION_URL}/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: file.storage,
        path: file.path,
      }),
    });

    if (!res.ok) {
      throw new Error(`Edge function delete error: ${res.statusText}`);
    }
    return;
  }
};

/**
 * Trigger instant browser download of a file
 */
export const downloadFileFromStorage = async (file: FileRecord): Promise<void> => {
  let downloadUrl = file.url;

  if (file.storage === "supabase" && file.path) {
    try {
      downloadUrl = await getPresignedUrl(file, 300);
    } catch {
      downloadUrl = file.url;
    }
  }

  if (!downloadUrl) {
    throw new Error("No download URL available for this file");
  }

  const response = await fetch(downloadUrl);
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};
