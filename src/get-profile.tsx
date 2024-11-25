import { ActionPanel, Detail, Action, Clipboard, showToast, Toast, Form } from "@raycast/api";
import { useState } from "react";
import fetch from "node-fetch";

interface CommandForm {
  input: string;
}

export default function Command() {
  const [markdown, setMarkdown] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: CommandForm) {
    setIsLoading(true);
    const actor = values.input.trim();

    try {
      const actorInfo = await getProfile(actor);
      setMarkdown(createProfileMarkdown(actorInfo));
    } catch (error) {
      setMarkdown(`Error fetching profile data: ${error}`);
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
          <Action.SubmitForm title="Get Info" onSubmit={handleSubmit} />
        </ActionPanel>
      }
      isLoading={isLoading}
    >
      <Form.TextField id="input" title="Handle or did:plc" placeholder="Enter Bluesky handle or did:plc" autoFocus />
    </Form>
  );
}

function createProfileMarkdown(profile: any): string {
  return `
# ${profile.displayName} ([@${profile.handle}](https://bsky.app/profile/${profile.handle}))

<img width="128" height="128" style="width:128px;height:128px;" src="${profile.avatar}"/>

${profile.description}

## Stats
- **Followers:** ${profile.followersCount.toLocaleString()}
- **Following:** ${profile.followsCount.toLocaleString()}
- **Posts:** ${profile.postsCount.toLocaleString()}

## Activity
- **Lists:** ${profile.associated.lists}
- **Feed Generators:** ${profile.associated.feedgens}
- **Starter Packs:** ${profile.associated.starterPacks}

**Member since:** ${new Date(profile.createdAt).toLocaleDateString()}
${profile.banner ? `\n![Banner](${profile.banner})` : ""}
`;
}

async function getProfile(actor: string): Promise<any> {
  const response = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${actor}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to retrieve profile info: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
