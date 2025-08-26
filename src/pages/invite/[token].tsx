import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PersonIcon, CheckIcon, CrossCircledIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useQuery, useMutation, Authenticated, Unauthenticated } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SignInFormEmailCode } from "@/auth/SignInFormEmailCode";
import { toast } from 'sonner';

interface InviteTokenPageProps {
  params: Record<string, string>;
  navigate: (to: string) => void;
}

export default function InviteTokenPage({ params, navigate }: InviteTokenPageProps) {
  const token = params.token;
  const invitation = useQuery(api.teams.getInvitationByToken, { token });
  const acceptInvitation = useMutation(api.teams.acceptInvitation);
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);

  const handleAcceptInvitation = async () => {
    setIsAccepting(true);
    setError(null);
    
    try {
      const result = await acceptInvitation({ token });
      
      if (result.success && result.teamId) {
        setAccepted(true);
        toast.success('Successfully joined team!', {
          description: `Welcome to ${invitation?.teamName}! Redirecting to team page...`,
        });
        // Navigate to the team page after a short delay
        setTimeout(() => {
          void navigate(`/team/${result.teamId}`);
        }, 2000);
      } else {
        const errorMsg = result.error || "Failed to accept invitation";
        setError(errorMsg);
        toast.error('Failed to join team', {
          description: errorMsg,
        });
      }
    } catch (err) {
      const errorMsg = "An unexpected error occurred";
      setError(errorMsg);
      console.error("Failed to accept invitation:", err);
      toast.error('Unexpected error', {
        description: errorMsg,
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleSignInToAccept = () => {
    setShowSignIn(true);
  };

  if (invitation === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation === null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <CrossCircledIcon className="h-5 w-5" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This invitation link is not valid or has already been used.
            </p>
            <Button onClick={() => void navigate("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation.isValid || invitation.isExpired) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <CrossCircledIcon className="h-5 w-5" />
              Expired Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This invitation has expired. Please ask the team owner to send you a new invitation.
            </p>
            <Button onClick={() => void navigate("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckIcon className="h-5 w-5" />
              Welcome to the Team!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              You've successfully joined <strong>{invitation.teamName}</strong>.
              Redirecting to the team page...
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSignIn) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PersonIcon className="h-5 w-5" />
              Sign in to join {invitation?.teamName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please sign in or create an account to accept this team invitation.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setShowSignIn(false)}
              className="w-full mb-4"
            >
              ← Back to Invitation
            </Button>
          </CardContent>
        </Card>
        <SignInFormEmailCode />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PersonIcon className="h-5 w-5" />
            Team Invitation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{invitation.teamName}</h3>
              {invitation.teamDescription && (
                <p className="text-sm text-muted-foreground mt-1">
                  {invitation.teamDescription}
                </p>
              )}
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm">
                {invitation.inviterName ? (
                  <>
                    <strong>{invitation.inviterName}</strong> has invited you to join this team as{" "}
                    <strong>{invitation.role === "admin" ? "an administrator" : "a member"}</strong>.
                  </>
                ) : (
                  <>
                    You've been invited to join this team as{" "}
                    <strong>{invitation.role === "admin" ? "an administrator" : "a member"}</strong>.
                  </>
                )}
              </p>
            </div>

            <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded">
              <p><strong>Email:</strong> {invitation.email}</p>
              <p><strong>Expires:</strong> {new Date(invitation.expiresAt).toLocaleDateString()}</p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => void navigate("/")}
                className="flex-1"
                disabled={isAccepting}
              >
                Cancel
              </Button>
              
              <Authenticated>
                <Button
                  onClick={() => void handleAcceptInvitation()}
                  disabled={isAccepting}
                  className="flex-1"
                >
                  {isAccepting ? "Joining..." : "Accept Invitation"}
                </Button>
              </Authenticated>
              
              <Unauthenticated>
                <Button
                  onClick={handleSignInToAccept}
                  className="flex-1"
                >
                  Sign In to Accept
                </Button>
              </Unauthenticated>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}