import { ActionPanel, Detail, Action, Form } from "@raycast/api";
import { useState } from "react";
import fetch from "node-fetch";
import { resolveDID } from "./convert-handle-to-did-plc";

interface CommandForm {
  input: string;
}

interface ListInfo {
  list: List;
  items: Item[];
  cursor: string;
}

interface Item {
  uri: string;
  subject: Creator;
}

interface Creator {
  did: string;
  handle: string;
  displayName: string;
  avatar: string;
  createdAt: Date;
  description: string;
  indexedAt: Date;
  associated?: Associated;
}

interface Associated {
  chat: Chat;
}

interface Chat {
  allowIncoming: string;
}

interface List {
  uri: string;
  cid: string;
  name: string;
  purpose: string;
  avatar: string;
  listItemCount: number;
  indexedAt: Date;
  creator: Creator;
  description: string;
}

export default function Command() {
  const [markdown, setMarkdown] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: CommandForm) {
    setIsLoading(true);
    const listUrl = values.input.trim();

    try {
      const listInfo = await getList(listUrl);
      setMarkdown(createListInfoMarkdown(listInfo));
    } catch (error) {
      setMarkdown(`Error fetching list data: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  if (markdown) {
    return <Detail markdown={markdown} />;
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Get List Info" onSubmit={handleSubmit} />
        </ActionPanel>
      }
      isLoading={isLoading}
    >
      <Form.TextField id="input" title="List HTTP URL" placeholder="Enter Bluesky list URL" autoFocus />
    </Form>
  );
}

function createListInfoMarkdown(listInfo: ListInfo): string {
  return `
# ${listInfo.list.name}

<img width="128" height="128" style="width:128px;height:128px;" src="${listInfo.list.avatar}"/>

${listInfo.list.description}

Owner: ${listInfo.list.creator.handle}

Member count: ${listInfo.list.listItemCount.toLocaleString()}
`;
}

// https://public.api.bsky.app/xrpc/app.bsky.graph.getList?list=at%3A%2F%2Fdid%3Aplc%3Ahgyzg2hn6zxpqokmp5c2xrdo%2Fapp.bsky.graph.list%2F3lc5nsgg6wg2t&limit=1
// https://bsky.app/profile/hrbrmstr.dev/lists/3lc5nsgg6wg2t
/// at://did:plc:hgyzg2hn6zxpqokmp5c2xrdo/app.bsky.graph.list/3lc5nsgg6wg2t
function getListComponents(url: string): { handle: string; rkey: string } {
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname.split("/");
  const handle = pathSegments[2];
  const rkey = pathSegments[4];

  if (!handle || !rkey) {
    throw new Error("Invalid list URL format");
  }

  return { handle, rkey };
}

async function getList(listUrl: string): Promise<ListInfo> {
  try {
    const { handle, rkey } = getListComponents(listUrl);
    const did = await resolveDID(handle);
    const apiUrl = `https://public.api.bsky.app/xrpc/app.bsky.graph.getList?list=at://${did}/app.bsky.graph.list/${rkey}&limit=1`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    console.log(response);
    if (!response.ok) {
      throw new Error(`Failed to retrieve list info: ${response.statusText}`);
    }

    const data = await response.json();
    const typedData = data as ListInfo;
    return typedData;
  } catch (err: unknown) {
    throw new Error(`Failed to extract handle and list rkey: ${err}`);
  }
}
