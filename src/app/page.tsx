"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Database, 
  Globe, 
  Sparkles, 
  ArrowRight, 
  Code, 
  ShieldCheck, 
  Layers,
  Loader2
} from "lucide-react";
import { generateHomepageContentDraft, type GenerateHomepageContentDraftOutput } from "@/ai/flows/generate-homepage-content-draft";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GenerateHomepageContentDraftOutput | null>(null);
  const { toast } = useToast();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast({ title: "Please enter a topic", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateHomepageContentDraft({ topicOrDescription: topic });
      setGeneratedContent(result);
      toast({ title: "Draft generated successfully!" });
    } catch (error) {
      toast({ title: "Failed to generate content", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(58,110,208,0.05)_0,rgba(247,248,FB,0)_100%)]" />
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm animate-in fade-in slide-in-from-bottom-3">
            v1.0.0 is now live
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-tight max-w-4xl mx-auto">
            {generatedContent?.heroHeadline || "Build Your Next Big Idea, Instantly."}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            {generatedContent?.heroSubheadline || "InstantPage provides a battle-tested Next.js foundation with Prisma, Tailwind, and GenAI pre-configured for your success."}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg" className="h-12 px-8 text-base">
              {generatedContent?.callToAction || "Start Building"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
              Documentation
            </Button>
          </div>

          {/* AI Generator Box */}
          <div id="ai-generator" className="max-w-3xl mx-auto">
            <Card className="border-2 border-primary/10 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-6 text-primary">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-semibold uppercase tracking-wider text-sm">AI Content Draft Generator</span>
                </div>
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input 
                      placeholder="Enter a topic (e.g., 'SaaS for designers' or 'E-commerce platform')..." 
                      className="h-12"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                    <Button type="submit" size="lg" className="h-12 shrink-0" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Generate Draft"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Core Features</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to ship world-class applications in record time.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {generatedContent?.features ? (
              generatedContent.features.map((feature, idx) => (
                <FeatureCard 
                  key={idx}
                  title={feature}
                  description="Leverage the power of InstantPage's architecture to build this core capability with ease."
                  icon={[Zap, Layers, ShieldCheck][idx % 3]}
                />
              ))
            ) : (
              <>
                <FeatureCard 
                  title="Next.js 15 & TS"
                  description="Optimized for performance with App Router, Server Components, and full TypeScript support."
                  icon={Code}
                />
                <FeatureCard 
                  title="Prisma & PostgreSQL"
                  description="Type-safe database access out of the box. Ready for complex relational data structures."
                  icon={Database}
                />
                <FeatureCard 
                  title="Vercel Deployment"
                  description="Seamless CI/CD with GitHub Actions. Push to main and see your changes live in seconds."
                  icon={Globe}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-6">
                {generatedContent?.title || "Stop scaffolding, start building."}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {generatedContent?.description || "InstantPage was created by developers for developers. We've removed all the friction of setting up a modern web stack, so you can focus on what matters: your product."}
              </p>
              <div className="space-y-4">
                <CheckItem text="Shadcn UI Pre-configured" />
                <CheckItem text="Tailwind CSS v3 Optimized" />
                <CheckItem text="Zod Validation Patterns" />
                <CheckItem text="GenAI Content Workflows" />
              </div>
            </div>
            <div className="flex-1 w-full max-w-xl">
              <div className="relative aspect-video rounded-2xl overflow-hidden border shadow-2xl">
                <img 
                  src="https://picsum.photos/seed/code-screen/800/600" 
                  alt="Dashboard preview" 
                  className="object-cover w-full h-full"
                  data-ai-hint="dashboard design"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold tracking-tight">InstantPage</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <Link href="/prompts" className="hover:text-primary transition-colors">Prompts Documentation</Link>
              <a href="#" className="hover:text-primary transition-colors">GitHub</a>
              <a href="#" className="hover:text-primary transition-colors">Discord</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} InstantPage Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon: Icon }: { title: string; description: string; icon: any }) {
  return (
    <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-8">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
        <ShieldCheck className="h-3 w-3 text-accent" />
      </div>
      <span className="font-medium text-foreground/80">{text}</span>
    </div>
  );
}
