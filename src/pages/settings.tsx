import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Palette, Camera, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage(): JSX.Element {
  const user = useQuery(api.users.viewer);
  const updateProfile = useMutation(api.users.updateProfile);
  const updateAvatar = useMutation(api.users.updateAvatar);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    favoriteColor: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        favoriteColor: user.favoriteColor || "",
      });
    }
  }, [user]);

  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (!user) return false;
    return (
      formData.name !== (user.name || "") ||
      formData.email !== (user.email || "") ||
      formData.phone !== (user.phone || "") ||
      formData.favoriteColor !== (user.favoriteColor || "")
    );
  }, [formData, user]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (formData.phone && !/^[+]?[1-9][\d]{0,20}$/.test(formData.phone.replace(/[\s\-()]/g, ""))) {
      errors.phone = "Please enter a valid phone number";
    }
    
    if (formData.name && formData.name.length < 2) {
      errors.name = "Name must be at least 2 characters long";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hasChanges) return;

    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({
        name: formData.name || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        favoriteColor: formData.favoriteColor || undefined,
      });
      toast.success("Profile updated successfully!", {
        description: "Your changes have been saved."
      });
      setFormErrors({});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
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

  const resetForm = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        favoriteColor: user.favoriteColor || "",
      });
      setFormErrors({});
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
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
            <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6">
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
                      onChange={(e) => { void handleAvatarUpload(e); }}
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
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      handleInputChange("name", e.target.value);
                      if (formErrors.name) {
                        setFormErrors(prev => ({ ...prev, name: "" }));
                      }
                    }}
                    placeholder="Enter your full name"
                    className={formErrors.name ? "border-red-500" : ""}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500">{formErrors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    Email Address
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
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      handleInputChange("email", e.target.value);
                      if (formErrors.email) {
                        setFormErrors(prev => ({ ...prev, email: "" }));
                      }
                    }}
                    placeholder="Enter your email address"
                    className={formErrors.email ? "border-red-500" : ""}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500">{formErrors.email}</p>
                  )}
                  {!user.emailVerificationTime && formData.email && !formErrors.email && (
                    <p className="text-sm text-orange-600">
                      Please verify your email address to secure your account.
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    Phone Number
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
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      handleInputChange("phone", e.target.value);
                      if (formErrors.phone) {
                        setFormErrors(prev => ({ ...prev, phone: "" }));
                      }
                    }}
                    placeholder="Enter your phone number"
                    className={formErrors.phone ? "border-red-500" : ""}
                  />
                  {formErrors.phone && (
                    <p className="text-sm text-red-500">{formErrors.phone}</p>
                  )}
                  {!user.phoneVerificationTime && formData.phone && !formErrors.phone && (
                    <p className="text-sm text-orange-600">
                      Please verify your phone number for additional security.
                    </p>
                  )}
                </div>

                {/* Favorite Color */}
                <div className="space-y-2">
                  <Label htmlFor="favoriteColor" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Favorite Color
                  </Label>
                  <Input
                    id="favoriteColor"
                    type="text"
                    value={formData.favoriteColor}
                    onChange={(e) => handleInputChange("favoriteColor", e.target.value)}
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
                    disabled={isLoading || !hasChanges}
                  >
                    Reset
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading || !hasChanges}
                    className="min-w-[120px]"
                  >
                    {isLoading ? (
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