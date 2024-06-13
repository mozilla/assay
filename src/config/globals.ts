import { SecretStorage, ExtensionContext, DiagnosticCollection } from "vscode";

import { AddonController } from "../controller/addonController";
import { CommentCacheController } from "../controller/commentCacheController";
import { AssayCommentController } from "../controller/commentController";
import { CredentialController } from "../controller/credentialController";
import { ReviewCacheController } from "../controller/reviewCacheController";
import { RootController } from "../controller/rootController";
import { SidebarController } from "../controller/sidebarController";
import { CustomFileDecorationProvider } from "../model/fileDecorationProvider";

let secrets: SecretStorage;
let storagePath: string;
let fileDecorator: CustomFileDecorationProvider;
let extensionContext: ExtensionContext;
let diagnosticCollection: DiagnosticCollection;
let commentController: AssayCommentController;
let commentsCacheController: CommentCacheController;
let reviewCacheController: ReviewCacheController;

export function setExtensionSecretStorage(secretStorage: SecretStorage) {
  secrets = secretStorage;
}

export function getExtensionSecretStorage(): SecretStorage {
  return secrets;
}

export function setExtensionStoragePath(path: string) {
  storagePath = path;
}

export function getExtensionStoragePath() {
  return storagePath;
}

export function setExtensionContext(context: ExtensionContext) {
  extensionContext = context;
}

export function getExtensionContext() {
  return extensionContext;
}

export function setFileDecorator(decorator: CustomFileDecorationProvider) {
  fileDecorator = decorator;
}

export function getFileDecorator() {
  return fileDecorator;
}

export function setDiagnosticCollection(collection: DiagnosticCollection) {
  diagnosticCollection = collection;
}

export function getDiagnosticCollection() {
  return diagnosticCollection;
}





export function setCommentController(cmtController: AssayCommentController) {
  commentController = cmtController;
}

export function getCommentController() {
  return commentController;
}

export function setCommentsCacheController(controller: CommentCacheController) {
  commentsCacheController = controller;
}

export function getCommentsCacheController() {
  return commentsCacheController;
}

export function setReviewCacheController(controller: ReviewCacheController) {
  reviewCacheController = controller;
}

export function getReviewCacheController() {
  return reviewCacheController;
}

let sidebarController: SidebarController;

export function setSidebarController(controller: SidebarController){
  sidebarController = controller;
}

export function getSidebarController(){
  return sidebarController;
}

let credentialController: CredentialController;

export function setCredentialController(controller: CredentialController){
  credentialController = controller;
}

export function getCredentialController(){
  return credentialController;
}

let rootController: RootController;

export function setRootController(controller: RootController){
  rootController = controller;
}

export function getRootController(){
  return rootController;
}

let addonController: AddonController;

export function setAddonController(controller: AddonController){
  addonController = controller;
}

export function getAddonController(){
  return addonController;
}