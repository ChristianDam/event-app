"use client";

export default function InviteTokenPage({ params }: { params: { token: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Team Invitation</h1>
      <p className="text-muted-foreground">Invite token: {params.token}</p>
    </div>
  );
}