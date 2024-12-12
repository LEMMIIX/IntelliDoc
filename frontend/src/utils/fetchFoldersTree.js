import { customFetch } from "./helpers";

import backendUrl from "../production-config";
export async function fetchAndRenderFolderTree() {
  try {
    const response = await customFetch(backendUrl + "/folders/tree", {
      method: "GET",
      credentials: "include",
    });
    console.log(response);
    if (!response.ok) {
      throw new Error("Failed to fetch folder tree");
    }

    const folderTree = await response.json();
    return folderTree;
  } catch (error) {
    console.error("Error:", error);
  }
}
export async function fetchAndRenderFolder() {
  try {
    const response = await customFetch(backendUrl + "/folders", {
      method: "GET",
      credentials: "include",
    });
    console.log(response);
    if (!response.ok) {
      throw new Error("Failed to fetch folder tree");
    }

    const folderTree = await response.json();
    return folderTree;
  } catch (error) {
    console.error("Error:", error);
  }
}