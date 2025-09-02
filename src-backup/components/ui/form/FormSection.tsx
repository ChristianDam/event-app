import type React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "card" | "simple";
}

export function FormSection({
  title,
  description,
  children,
  className,
  variant = "simple",
}: FormSectionProps) {
  if (variant === "card") {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className="space-y-6">{children}</CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {(title || description) && (
        <>
          <div className="space-y-1">
            {title && <h3 className="text-lg font-medium">{title}</h3>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Separator />
        </>
      )}
      <div className="space-y-6">{children}</div>
    </div>
  );
}

interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}

export function FormActions({
  children,
  className,
  align = "right",
}: FormActionsProps) {
  const alignmentClasses = {
    left: "justify-start",
    right: "justify-end",
    center: "justify-center",
  };

  return (
    <div className={cn("flex gap-3", alignmentClasses[align], className)}>
      {children}
    </div>
  );
}
