"use client";

export default function PublicEventPage({ params }: { params: { slug: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Public Event</h1>
      <p className="text-muted-foreground">Event slug: {params.slug}</p>
    </div>
  );
}