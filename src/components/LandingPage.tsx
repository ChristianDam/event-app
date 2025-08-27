import { ArrowRight, Calendar, Shield, Users } from "lucide-react";
import { useState } from "react";
import { SignInFormEmailCode } from "@/auth/SignInFormEmailCode";
import { H2, Lead } from "@/components/typography/typography";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LandingPage() {
  const [showSignIn, setShowSignIn] = useState(false);

  if (showSignIn) {
    return <SignInFormEmailCode />;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Manage Your Team
          <br />
          <span className="text-blue-600">Events & Members</span>
        </h1>
        <Lead className="mb-8 max-w-2xl mx-auto">
          Streamline your team management with our comprehensive platform for
          organizing events, managing members, and building stronger
          connections.
        </Lead>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => setShowSignIn(true)}
            className="text-lg px-8 py-3"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-3">
            Learn More
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Event Management</CardTitle>
            <CardDescription>
              Create, organize, and manage team events with ease
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Create and publish events</li>
              <li>• Track attendance and registrations</li>
              <li>• Send automated reminders</li>
              <li>• Manage event visibility</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>
              Organize your team members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Invite team members</li>
              <li>• Manage roles and permissions</li>
              <li>• Track member activity</li>
              <li>• Customize team settings</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle>Secure & Reliable</CardTitle>
            <CardDescription>
              Built with security and reliability in mind
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Secure authentication</li>
              <li>• Data privacy protection</li>
              <li>• Real-time updates</li>
              <li>• 99.9% uptime</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-12">
        <H2 className="mb-4">Ready to get started?</H2>
        <p className="text-lg text-muted-foreground mb-6">
          Join thousands of teams already using our platform to stay organized
          and connected.
        </p>
        <Button
          size="lg"
          onClick={() => setShowSignIn(true)}
          className="text-lg px-8 py-3"
        >
          Sign Up Now
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
