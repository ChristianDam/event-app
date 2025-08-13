interface NotFoundPageProps {
  params: Record<string, string>;
  navigate: (to: string) => void;
}

export default function NotFoundPage({ navigate }: NotFoundPageProps) {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
      <p className="text-muted-foreground mb-4">The page you're looking for doesn't exist.</p>
      <button 
        onClick={() => navigate('/')}
        className="text-blue-600 hover:text-blue-700 underline"
      >
        Go Home
      </button>
    </div>
  );
}