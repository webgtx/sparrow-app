/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  RequestDataset,
  RequestMethod,
  RequestDataType,
} from "$lib/utils/enums/request.enum";
import {
  findAuthHeader,
  findAuthParameter,
} from "$lib/utils/helpers/auth.helper";
import type { CollectionsMethods } from "$lib/utils/interfaces/collections.interface";
import type {
  Body,
  KeyValuePair,
  NewTab,
} from "$lib/utils/interfaces/request.interface";
import type {
  RequestDatasetType,
  RequestRawType,
} from "$lib/utils/types/request.type";

enum fileType {
  FILE = "File",
  TEXT = "Text",
}

type Type = "File" | "Text";

class ApiSendRequestViewModel {
  constructor() {}

  /**
   * @description
   * Extracts the content type from the API response and sets it in the user's state.
   * @param responseHeaders - Response header object
   * @param collectionsMethods - Methods object coming from Collection View Model
   */
  public setResponseContentType = (responseHeaders): string => {
    if (responseHeaders) {
      for (let i = 0; i < responseHeaders.length; i++) {
        const key = responseHeaders[i].key;
        const value = responseHeaders[i].value;
        if (key === "content-type" && value.includes("text/html")) {
          return RequestDataType.HTML;
        } else if (
          key === "content-type" &&
          value.includes("application/json")
        ) {
          return RequestDataType.JSON;
        } else if (
          key === "content-type" &&
          value.includes("application/xml")
        ) {
          return RequestDataType.XML;
        } else if (
          key === "content-type" &&
          value.includes("application/javascript")
        ) {
          return RequestDataType.JAVASCRIPT;
        } else if (key === "content-type") {
          return RequestDataType.TEXT;
        }
      }
    }
  };

  private ensureHttpOrHttps = (str) => {
    if (str.startsWith("http://") || str.startsWith("https://")) {
      return "";
    } else if (str.startsWith("//")) {
      return "http:";
    } else {
      return "http://";
    }
  };
  private extractKeyValue = (pairs: any[], type: Type): string => {
    let response: string = "";
    let storage: string = "";
    let count: number = 0;
    for (const pair of pairs) {
      if (pair.checked) {
        count++;
        if (type === fileType.TEXT) {
          storage += `${pair.key}[SPARROW_EQUALS]${pair.value}[SPARROW_AMPERSAND]`;
        } else if (type === fileType.FILE) {
          storage += `${pair.key}[SPARROW_EQUALS]${pair.base}[SPARROW_AMPERSAND]`;
        }
      }
    }
    if (count !== 0) {
      response = storage.slice(0, -1);
    }
    return response;
  };

  private extractURl = (
    url: string,
    request: NewTab,
    environmentVariables,
  ): string => {
    const authHeader: {
      key: string;
      value: string;
    } = findAuthParameter(request);
    if (authHeader.key || authHeader.value) {
      let flag: boolean = false;
      for (let i = 0; i < url.length; i++) {
        if (url[i] === "?") {
          flag = true;
        }
      }

      if (!flag) {
        url = this.ensureHttpOrHttps(url) + url + "?";
      } else {
        url = this.ensureHttpOrHttps(url) + url + "&";
      }

      url = this.setEnvironmentVariables(
        url + authHeader.key + "=" + authHeader.value,
        environmentVariables,
      );
      return url;
    }
    return this.ensureHttpOrHttps(url) + url;
  };

  private extractHeaders = (
    headers: KeyValuePair[],
    autoGeneratedHeaders: KeyValuePair[],
    request: NewTab,
  ): string => {
    const authHeader: {
      key: string;
      value: string;
    } = findAuthHeader(request);
    if (authHeader.key || authHeader.value) {
      return (
        authHeader.key +
        "[SPARROW_EQUALS]" +
        authHeader.value +
        "[SPARROW_AMPERSAND]" +
        this.extractKeyValue(
          [...headers, ...autoGeneratedHeaders],
          fileType.TEXT,
        )
      );
    }
    return this.extractKeyValue(
      [...headers, ...autoGeneratedHeaders],
      fileType.TEXT,
    );
  };

  private extractBody = (
    datatype: RequestDatasetType,
    rawData: RequestRawType,
    body: Body,
  ): string => {
    const { raw, urlencoded, formdata } = body;
    if (datatype === RequestDataset.RAW) {
      if (rawData === RequestDataType.JSON && raw === "") {
        return "{}";
      }
      return raw;
    } else if (datatype === RequestDataset.FORMDATA) {
      return (
        this.extractKeyValue(formdata.text, fileType.TEXT) +
        "[SPARROW_AMPERSAND]" +
        this.extractKeyValue(formdata.file, fileType.FILE)
      );
    } else if (datatype === RequestDataset.URLENCODED) {
      return this.extractKeyValue(urlencoded, fileType.TEXT);
    } else if (datatype === RequestDataset.NONE) {
      return "";
    }
  };

  private extractMethod = (method: string): string => {
    if (method === RequestMethod.DELETE) {
      return "DELETE";
    } else if (method === RequestMethod.GET) {
      return "GET";
    } else if (method === RequestMethod.HEAD) {
      return "HEAD";
    } else if (method === RequestMethod.OPTIONS) {
      return "OPTIONS";
    } else if (method === RequestMethod.PATCH) {
      return "PATCH";
    } else if (method === RequestMethod.POST) {
      return "POST";
    } else if (method === RequestMethod.PUT) {
      return "PUT";
    }
  };

  private extractDataType = (
    datatype: RequestDatasetType,
    raw: RequestRawType,
  ): string => {
    if (datatype === RequestDataset.RAW) {
      if (raw === RequestDataType.JSON) {
        return "JSON";
      } else {
        return "TEXT";
      }
    } else if (datatype === RequestDataset.FORMDATA) {
      return "FORMDATA";
    } else if (datatype === RequestDataset.URLENCODED) {
      return "URLENCODED";
    } else if (datatype === RequestDataset.NONE) {
      return "TEXT";
    }
  };

  private setEnvironmentVariables = (
    text: string,
    environmentVariables,
  ): string => {
    let response = text;
    environmentVariables.forEach((element) => {
      const regex = new RegExp(`{{(${element.key})}}`, "g");
      response = response.replace(regex, element.value);
    });
    return response;
  };

  public decodeRestApiData(request: any, environmentVariables): string[] {
    return [
      this.extractURl(
        this.setEnvironmentVariables(request.url, environmentVariables),
        request,
        environmentVariables,
      ),
      this.extractMethod(request.method),
      this.setEnvironmentVariables(
        this.extractHeaders(
          request.headers,
          request.autoGeneratedHeaders,
          request,
        ),
        environmentVariables,
      ),
      this.extractBody(request.state.dataset, request.state.raw, request.body),
      this.extractDataType(request.state.dataset, request.state.raw),
    ];
  }
}

export { ApiSendRequestViewModel };
