import { ActionPanel, Action, Clipboard, showToast, Toast, Form } from "@raycast/api";
import { useState } from "react";
import fetch from "node-fetch";

interface CommandForm {
  input: string;
}

interface Did {
  did: string;
}

export default function Command() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: CommandForm) {
    setIsLoading(true);
    const input = values.input.trim();

    try {
      // Extract handle from URL or use input directly
      const handle = extractHandleFromInput(input);
      const did = await resolveDID(handle);

      // Copy to clipboard and show success toast
      await copyToClipboard(did);
      await showToast({
        style: Toast.Style.Success,
        title: "DID copied to clipboard",
        message: did,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to resolve DID",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Resolve Did" onSubmit={handleSubmit} />
        </ActionPanel>
      }
      isLoading={isLoading}
    >
      <Form.TextField id="input" title="Handle or URL" placeholder="Enter Bluesky handle or profile URL" autoFocus />
    </Form>
  );
}

function extractHandleFromInput(input: string): string {
  // Handle URLs like https://bsky.app/profile/someone.bsky.social
  if (input.startsWith("http")) {
    const url = new URL(input);
    if (url.hostname === "bsky.app" && url.pathname.startsWith("/profile/")) {
      return url.pathname.split("/profile/")[1];
    }
  }

  // Remove @ if present
  return input.startsWith("@") ? input.slice(1) : input;
}

async function resolveDID(handle: string): Promise<string> {
  const response = await fetch(`https://api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve handle: ${response.statusText}`);
  }

  const data = (await response.json()) as Did;
  return data.did;
}

async function copyToClipboard(text: string): Promise<void> {
  await Clipboard.copy(text);
}
