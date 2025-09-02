"use client";

export default function TeamIdPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Team Details</h1>
      <p className="text-muted-foreground">Team ID: {params.id}</p>
    </div>
  );
}