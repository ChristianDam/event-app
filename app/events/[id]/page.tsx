"use client";

export default function EventManagePage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Event Management</h1>
      <p className="text-muted-foreground">Managing event: {params.id}</p>
    </div>
  );
}