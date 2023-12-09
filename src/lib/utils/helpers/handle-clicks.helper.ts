/* eslint-disable @typescript-eslint/no-explicit-any */
import { CollectionsViewModel } from "../../../pages/Collections/Collections.ViewModel";
import { ItemType } from "../enums/item-type.enum";
import { generateSampleCollection } from "../sample/collection.sample";
import { generateSampleRequest } from "../sample/request.sample";
import { moveNavigation } from "./navigation";
const _collectionMethods = new CollectionsViewModel();
export const handleCollectionClick = (
  collection: any,
  currentWorkspaceId: string,
  collectionId: string,
) => {
  let totalFolder: number = 0;
  let totalRequest: number = 0;
  collection.items.map((item) => {
    if (item.type === ItemType.REQUEST) {
      totalRequest++;
    } else {
      totalFolder++;
      totalRequest += item.items.length;
    }
  });

  const path = {
    workspaceId: currentWorkspaceId,
    collectionId,
  };

  const Samplecollection = generateSampleCollection(
    collectionId,
    new Date().toString(),
  );

  Samplecollection.id = collectionId;
  Samplecollection.path = path;
  Samplecollection.name = collection.name;
  Samplecollection.property.collection.requestCount = totalRequest;
  Samplecollection.property.collection.folderCount = totalFolder;
  Samplecollection.save = true;
  _collectionMethods.handleCreateTab(Samplecollection);
  moveNavigation("right");
};

export const handleRequestClick = (req: any, path: any) => {
  const request = generateSampleRequest(req.id, new Date().toString());
  request.path = path;
  request.name = req.name;
  if (req.description) request.description = req.description;
  if (req.request.url) request.property.request.url = req.request.url;
  if (req.request.body) request.property.request.body = req.request.body;
  if (req.request.method) request.property.request.method = req.request.method;
  if (req.request.queryParams)
    request.property.request.queryParams = req.request.queryParams;
  if (req.request.headers)
    request.property.request.headers = req.request.headers;
  request.save = true;
  _collectionMethods.handleCreateTab(request);
  moveNavigation("right");
};
