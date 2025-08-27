import {
  Button,
  Container,
  Head,
  Heading,
  Html,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export function TeamInvitationEmail({
  teamName,
  inviterName,
  role,
  inviteUrl,
}: {
  teamName: string;
  inviterName?: string;
  role: "admin" | "member";
  inviteUrl: string;
}) {
  const roleDescription = role === "admin" ? "an administrator" : "a member";

  return (
    <Html>
      <Tailwind>
        <Head />
        <Container className="container px-20 font-sans">
          <Heading className="text-xl font-bold mb-4">
            You've been invited to join {teamName}
          </Heading>
          <Text className="text-base mb-4">
            {inviterName ? (
              <>
                <strong>{inviterName}</strong> has invited you to join{" "}
                <strong>{teamName}</strong> as {roleDescription}.
              </>
            ) : (
              <>
                You've been invited to join <strong>{teamName}</strong> as{" "}
                {roleDescription}.
              </>
            )}
          </Text>
          <Text className="text-sm text-gray-600 mb-6">
            {teamName} is using our Creative Event Management platform to
            organize and collaborate on events. By joining this team, you'll be
            able to help create, manage, and coordinate events together.
          </Text>

          <Section className="text-center mb-6">
            <Button
              href={inviteUrl}
              className="bg-blue-600 text-white px-6 py-3 rounded-md text-base font-medium no-underline"
            >
              Accept Invitation
            </Button>
          </Section>

          <Text className="text-xs text-gray-500 mb-2">
            <strong>Your role:</strong>{" "}
            {role === "admin" ? "Team Administrator" : "Team Member"}
          </Text>

          {role === "admin" ? (
            <Text className="text-xs text-gray-500 mb-4">
              As an administrator, you'll be able to invite new members, manage
              team settings, and help organize events.
            </Text>
          ) : (
            <Text className="text-xs text-gray-500 mb-4">
              As a team member, you'll be able to participate in event planning
              and collaborate with your team.
            </Text>
          )}

          <Text className="text-xs text-gray-500 border-t pt-4">
            This invitation will expire in 7 days. If you don't want to join
            this team, you can safely ignore this email.
          </Text>
        </Container>
      </Tailwind>
    </Html>
  );
}
