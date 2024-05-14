import { getRootFolderPath } from "./reviewRootDir";
import { AssayThread } from "../class/comment";

export default async function getCommentLocation(thread: AssayThread){
    const {start, end} = getCommentLine(thread);
    const { guid, version, filepath } = await getFilepathInfo(thread);
    const string = `${filepath}${start === end ? `#L${start}` : `#L${start}-${end}`}`;
    return {string, guid, version, filepath, start, end};
}

async function getFilepathInfo(thread: AssayThread){

    const fullPath = thread.uri.fsPath;
    const rootDir = await getRootFolderPath();
    const relativePath = fullPath.replace(rootDir, "");
    const guid = relativePath.split("/")[1];
    const version = relativePath.split("/")[2];
    const filepath = relativePath.split(version)[1];

    const rootFolder = await getRootFolderPath();
    if (!fullPath.startsWith(rootFolder)) {
        throw new Error("File is not in the root folder.");
    }

    return {guid, version, filepath};
}

function getCommentLine(thread: AssayThread){
    return {start: thread.range.start.line, end: thread.range.end.line};
}