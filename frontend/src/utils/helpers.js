/*export function getFolderContent(folderTree, folderId, path = "") {
  
 const folderContent = folderTree.folderTree.filter(folder => folder.id == folderId)[0]

  return {
      folderPath: `/${folderContent.name}`,
      files: folderContent?.files,
      children: folderContent?.children
  }
  /*  for (let folder of folderTree.folderTree) {
      const currentPath = `${path}/${folder.name}`;
  
      if (folder.id == folderId) {
        return {
          folderPath: currentPath,
          files: folder?.files,
          children: folder?.children,
        };
      }*/
   /*
      if (folder.children && folder.children.length > 0) {
        const result = getFolderContent(folder.children, folderId, currentPath);
        console.log(result);
        if (result) {
          return result;
        }
      }
      return null;
  }*/
      export function getFolderContent(folderTree, folderId, path = "") {
        for (let folder of folderTree) {
          const currentPath =` ${path}/${folder.name}`;
    
          if (folder.id == folderId) {
            return {
              folderPath: currentPath,
              files: folder.files,
              children: folder.children,
            };
          }
    
          if (folder.children && folder.children.length > 0) {
            const result = getFolderContent(folder.children, folderId, currentPath);
            console.log("result", result);
            if (result) {
              return result;
            }
          }
        }
    
        return null;
      }

  export const customFetch = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
    });
  
    // Check if the response is unauthorized
    if (response.status === 401) {
      // Token expired or invalid session
      localStorage.removeItem("currentUserId");
      localStorage.removeItem("currentUserName");
  
      // alert("Please Login in again, votre session is finished.");
      window.location.href = "/login"; // Redirect to login
    }
  
    return response;
  };

  export function getPathID(folderTree, path) {
    for (let folder of folderTree) {
      console.log("folder", folder);
      if (folder.name == path) {
        return folder.id;
      }

      if (folder.children && folder.children.length > 0) {
        const result = getPathID(folder.children, path);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }