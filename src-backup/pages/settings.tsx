import { useMutation, useQuery } from "convex/react";
import {
  Camera,
  CheckCircle,
  Loader2,
  Palette,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField, FormInput } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { api } from "../../convex/_generated/api";
import { useProfileForm } from "../hooks/useProfileForm";

export default function SettingsPage(): JSX.Element {
  const user = useQuery(api.users.viewer);
  const updateAvatar = useMutation(api.users.updateAvatar);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [avatarLoading, setAvatarLoading] = useState(false);

  const {
    formData,
    errors,
    isSubmitting,
    hasChanges,
    handleInputChange,
    handleSubmit,
    resetForm,
  } = useProfileForm({
    initialData: user
      ? {
          name: user.name,
          email: user.email,
          phone: user.phone,
          favoriteColor: user.favoriteColor,
        }
      : undefined,
    onSuccess: () => {
      toast.success("Profile updated successfully!", {
        description: "Your changes have been saved.",
      });
    },
    onError: (error) => {
      toast.error(error || "Failed to update profile");
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("File size must be less than 5MB");
      return;
    }

    setAvatarLoading(true);
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Failed to upload file");
      }

      const { storageId } = await result.json();

      // Update user avatar
      await updateAvatar({ imageId: storageId });

      toast.success("Avatar updated successfully!");
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to update avatar. Please try again.");
    } finally {
      setAvatarLoading(false);
      // Clear file input
      e.target.value = "";
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4 w-1/4"></div>
          <div className="h-4 bg-muted rounded mb-8 w-1/2"></div>
          <div className="space-y-6">
            <div className="h-48 bg-muted rounded"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and profile details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                void handleSubmit(e);
              }}
              className="space-y-6"
            >
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback className="text-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        void handleAvatarUpload(e);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="avatar-upload"
                      disabled={avatarLoading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="mb-2"
                      disabled={avatarLoading}
                    >
                      {avatarLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4 mr-2" />
                      )}
                      {avatarLoading ? "Uploading..." : "Change Avatar"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload a new profile picture (JPG, PNG, max 5MB)
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4">
                {/* Name */}
                <FormField id="name" label="Full Name" error={errors.name}>
                  <FormInput
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter your full name"
                    error={errors.name}
                  />
                </FormField>

                {/* Email */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Email Address</span>
                    {user.emailVerificationTime ? (
                      <Badge variant="secondary" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-orange-600">
                        <XCircle className="h-3 w-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                  <FormInput
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email address"
                    error={errors.email}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                  {!user.emailVerificationTime &&
                    formData.email &&
                    !errors.email && (
                      <p className="text-sm text-orange-600">
                        Please verify your email address to secure your account.
                      </p>
                    )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Phone Number</span>
                    {user.phoneVerificationTime ? (
                      <Badge variant="secondary" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : formData.phone ? (
                      <Badge variant="secondary" className="text-orange-600">
                        <XCircle className="h-3 w-3 mr-1" />
                        Unverified
                      </Badge>
                    ) : null}
                  </div>
                  <FormInput
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter your phone number"
                    error={errors.phone}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone}</p>
                  )}
                  {!user.phoneVerificationTime &&
                    formData.phone &&
                    !errors.phone && (
                      <p className="text-sm text-orange-600">
                        Please verify your phone number for additional security.
                      </p>
                    )}
                </div>

                {/* Favorite Color */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <span className="text-sm font-medium">Favorite Color</span>
                  </div>
                  <FormInput
                    id="favoriteColor"
                    type="text"
                    value={formData.favoriteColor}
                    onChange={(e) =>
                      handleInputChange("favoriteColor", e.target.value)
                    }
                    placeholder="Enter your favorite color"
                  />
                  <p className="text-sm text-muted-foreground">
                    This helps personalize your experience.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <div>
                  {hasChanges && (
                    <p className="text-sm text-muted-foreground">
                      You have unsaved changes
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={isSubmitting || !hasChanges}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !hasChanges}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              View your account details and status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex justify-between items-center py-2">
                <div>
                  <p className="font-medium">Account Type</p>
                  <p className="text-sm text-muted-foreground">
                    {user.isAnonymous ? "Anonymous User" : "Registered User"}
                  </p>
                </div>
                <Badge variant={user.isAnonymous ? "secondary" : "default"}>
                  {user.isAnonymous ? "Anonymous" : "Registered"}
                </Badge>
              </div>

              <Separator />

              <div className="flex justify-between items-center py-2">
                <div>
                  <p className="font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user._creationTime).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center py-2">
                <div>
                  <p className="font-medium">User ID</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {user._id}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
