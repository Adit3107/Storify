"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import { signInSchema } from "@/schemas/signInSchema";
import {
  forgotPasswordEmailSchema,
  forgotPasswordResetSchema,
} from "@/schemas/forgotPasswordSchema";

type FormState = "SIGN_IN" | "FORGOT_PASSWORD_EMAIL" | "FORGOT_PASSWORD_RESET";

export default function SignInForm() {
  const router = useRouter();
  const { signIn, isLoaded, setActive } = useSignIn();
  const [formState, setFormState] = useState<FormState>("SIGN_IN");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Sign In Form
  const {
    register: registerSignIn,
    handleSubmit: handleSubmitSignIn,
    formState: { errors: errorsSignIn },
  } = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  // Forgot Password Email Form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail },
  } = useForm<z.infer<typeof forgotPasswordEmailSchema>>({
    resolver: zodResolver(forgotPasswordEmailSchema),
    defaultValues: {
      email: "",
    },
  });

  // Forgot Password Reset Form
  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: errorsReset },
  } = useForm<z.infer<typeof forgotPasswordResetSchema>>({
    resolver: zodResolver(forgotPasswordResetSchema),
    defaultValues: {
      code: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const onSignInSubmit = async (data: z.infer<typeof signInSchema>) => {
    if (!isLoaded || !signIn) return;

    setIsSubmitting(true);
    setAuthError(null);

    try {
      const result = await signIn.create({
        identifier: data.identifier,
        password: data.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        console.error("Sign-in incomplete:", result);
        setAuthError("Sign-in could not be completed. Please try again.");
      }
    } catch (error: any) {
      console.error("Sign-in error:", error);
      setAuthError(
        error.errors?.[0]?.message ||
        "An error occurred during sign-in. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEmailSubmit = async (
    data: z.infer<typeof forgotPasswordEmailSchema>
  ) => {
    if (!isLoaded || !signIn) return;

    setIsSubmitting(true);
    setAuthError(null);

    try {
      const result = await signIn.create({
        strategy: "reset_password_email_code",
        identifier: data.email,
      });

      if (result.status === "needs_first_factor") {
        setResetEmail(data.email);
        setFormState("FORGOT_PASSWORD_RESET");
      } else {
        console.error("Unexpected status:", result.status);
        setAuthError("Failed to initiate password reset. Please try again.");
      }
    } catch (error: any) {
      console.error("Email request error:", error);
      setAuthError(
        error.errors?.[0]?.message ||
        "Failed to send reset code. Please check the email and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResetSubmit = async (
    data: z.infer<typeof forgotPasswordResetSchema>
  ) => {
    if (!isLoaded || !signIn) return;

    setIsSubmitting(true);
    setAuthError(null);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: data.code,
        password: data.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        console.error("Password reset incomplete:", result);
        setAuthError("Password reset could not be completed. Please try again.");
      }
    } catch (error: any) {
      console.error("Password reset error:", error);
      setAuthError(
        error.errors?.[0]?.message ||
        "Failed to reset password. Please check the code and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render: Forgot Password - Email Input
  if (formState === "FORGOT_PASSWORD_EMAIL") {
    return (
      <Card className="w-full max-w-md border border-border bg-card shadow-xl">
        <CardHeader className="flex flex-col gap-1 items-center pb-2">
          <CardTitle className="text-2xl font-bold text-foreground">
            Reset Password
          </CardTitle>
          <CardDescription className="text-muted-foreground text-center">
            Enter your email address and we'll send you a code to reset your
            password
          </CardDescription>
        </CardHeader>

        <Separator className="my-4" />

        <CardContent className="py-6">
          {authError && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmitEmail(onEmailSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="reset-email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <Input
                id="reset-email"
                type="email"
                placeholder="your.email@example.com"
                startContent={<Mail className="h-4 w-4 text-muted-foreground" />}
                isInvalid={!!errorsEmail.email}
                errorMessage={errorsEmail.email?.message}
                {...registerEmail("email")}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Sending Code..." : "Send Verification Code"}
            </Button>
          </form>
        </CardContent>

        <Separator className="my-4" />

        <CardFooter className="flex justify-center py-4">
          <Button
            variant="ghost"
            onClick={() => {
              setFormState("SIGN_IN");
              setAuthError(null);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Render: Forgot Password - Reset Input
  if (formState === "FORGOT_PASSWORD_RESET") {
    return (
      <Card className="w-full max-w-md border border-border bg-card shadow-xl">
        <CardHeader className="flex flex-col gap-1 items-center pb-2">
          <CardTitle className="text-2xl font-bold text-foreground">
            New Password
          </CardTitle>
          <CardDescription className="text-muted-foreground text-center">
            Enter the code sent to <strong>{resetEmail}</strong> and your new
            password
          </CardDescription>
        </CardHeader>

        <Separator className="my-4" />

        <CardContent className="py-6">
          {authError && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="code"
                className="text-sm font-medium text-foreground"
              >
                Verification Code
              </label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                startContent={
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                }
                isInvalid={!!errorsReset.code}
                errorMessage={errorsReset.code?.message}
                {...registerReset("code")}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="new-password"
                className="text-sm font-medium text-foreground"
              >
                New Password
              </label>
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                startContent={<Lock className="h-4 w-4 text-muted-foreground" />}
                endContent={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                }
                isInvalid={!!errorsReset.password}
                errorMessage={errorsReset.password?.message}
                {...registerReset("password")}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="passwordConfirmation"
                className="text-sm font-medium text-foreground"
              >
                Confirm New Password
              </label>
              <Input
                id="passwordConfirmation"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                startContent={<Lock className="h-4 w-4 text-muted-foreground" />}
                endContent={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    type="button"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                }
                isInvalid={!!errorsReset.passwordConfirmation}
                errorMessage={errorsReset.passwordConfirmation?.message}
                {...registerReset("passwordConfirmation")}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>

        <Separator className="my-4" />

        <CardFooter className="flex justify-center py-4">
          <Button
            variant="ghost"
            onClick={() => {
              setFormState("FORGOT_PASSWORD_EMAIL");
              setAuthError(null);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Render: Sign In Form (Default)
  return (
    <Card className="w-full max-w-md border border-border bg-card shadow-xl">
      <CardHeader className="flex flex-col gap-1 items-center pb-2">
        <CardTitle className="text-2xl font-bold text-foreground">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-muted-foreground text-center">
          Sign in to access your secure cloud storage
        </CardDescription>
      </CardHeader>

      <Separator className="my-4" />

      <CardContent className="py-6">
        {authError && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{authError}</p>
          </div>
        )}

        <form onSubmit={handleSubmitSignIn(onSignInSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="identifier"
              className="text-sm font-medium text-foreground"
            >
              Email
            </label>
            <Input
              id="identifier"
              type="email"
              placeholder="your.email@example.com"
              startContent={<Mail className="h-4 w-4 text-muted-foreground" />}
              isInvalid={!!errorsSignIn.identifier}
              errorMessage={errorsSignIn.identifier?.message}
              {...registerSignIn("identifier")}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setFormState("FORGOT_PASSWORD_EMAIL");
                  setAuthError(null);
                }}
                className="text-xs text-primary hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              startContent={<Lock className="h-4 w-4 text-muted-foreground" />}
              endContent={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              }
              isInvalid={!!errorsSignIn.password}
              errorMessage={errorsSignIn.password?.message}
              {...registerSignIn("password")}
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>

      <Separator className="my-4" />

      <CardFooter className="flex justify-center py-4">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/sign-up"
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
