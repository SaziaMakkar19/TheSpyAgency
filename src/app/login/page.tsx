import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Agent Access | The Spy Agency",
  description: "Sign in or register with your business email.",
};

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-lum-void text-lum-on-surface font-body">
      <Navbar />

      <main className="max-w-md mx-auto px-6 pt-32 pb-16">
        <div className="mb-6 space-y-2 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lum-primary-bright">
            The Spy Agency
          </p>
          <h1 className="font-jakarta text-2xl font-extrabold tracking-tight text-lum-text-primary">
            Sign In / Register
          </h1>
        </div>
        <LoginForm />
      </main>

      <Footer />
    </div>
  );
}
