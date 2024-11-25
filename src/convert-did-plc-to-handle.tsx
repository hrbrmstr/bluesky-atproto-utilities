import { ActionPanel, Action, Clipboard, showToast, Toast, Form } from "@raycast/api";
import { useState } from "react";
import fetch from "node-fetch";

interface CommandForm {
  input: string;
}

export default function Command() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: CommandForm) {
    setIsLoading(true);
    const input = values.input.trim().replace(/^at:\/\//, "");

    try {
      if (validateDidPlc(input)) {
        const did = await resolveDID(input);
        await copyToClipboard(did);
        await showToast({
          style: Toast.Style.Success,
          title: "Hnadle copied to clipboard",
          message: did,
        });
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to resolve handle",
          message: "Invalid did:plc",
        });
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to resolve handle",
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

function validateDidPlc(input: string): boolean {
  const didPattern = /^did:[a-z]+:[a-zA-Z0-9._:%-]*[a-zA-Z0-9._-]$/;
  return didPattern.test(input);
}

async function resolveDID(didPlc: string): Promise<string> {
  const response = await fetch(`https://plc.directory/${didPlc}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve handle: ${response.statusText}`);
  }

  const data = await response.json();
  return data.alsoKnownAs[0].replace(/^at:\/\//, "");
}

async function copyToClipboard(text: string): Promise<void> {
  await Clipboard.copy(text);
}
