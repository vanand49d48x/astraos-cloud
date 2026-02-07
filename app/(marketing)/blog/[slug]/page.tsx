import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { formatDate } from "@/lib/utils";
import { Calendar, Clock, ArrowLeft, Tag } from "lucide-react";

interface BlogPostPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: BlogPostPageProps): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.description,
  };
}

function renderContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre
          key={`code-${i}`}
          className="my-6 rounded-lg border border-white/[0.06] bg-black/40 p-4 overflow-x-auto"
        >
          <code className="text-sm text-foreground/90 font-mono leading-relaxed">
            {codeLines.join("\n")}
          </code>
        </pre>
      );
      continue;
    }

    // Headings
    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-2xl font-bold text-foreground mt-10 mb-4"
        >
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-xl font-semibold text-foreground mt-8 mb-3"
        >
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    // Empty lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Bold-start paragraphs (definition-style like **Term.** Description)
    if (line.startsWith("**")) {
      const boldMatch = line.match(/^\*\*(.+?)\*\*\s*(.*)/);
      if (boldMatch) {
        elements.push(
          <p
            key={`p-${i}`}
            className="text-muted-foreground leading-relaxed mb-4"
          >
            <strong className="text-foreground font-semibold">
              {boldMatch[1]}
            </strong>{" "}
            {boldMatch[2]}
          </p>
        );
        i++;
        continue;
      }
    }

    // Inline code in regular paragraphs
    const renderInlineText = (text: string, keyPrefix: string) => {
      const parts = text.split(/(`[^`]+`)/g);
      return parts.map((part, idx) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={`${keyPrefix}-ic-${idx}`}
              className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm font-mono text-primary"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        // Handle bold within inline text
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
        return boldParts.map((bp, bIdx) => {
          if (bp.startsWith("**") && bp.endsWith("**")) {
            return (
              <strong key={`${keyPrefix}-b-${idx}-${bIdx}`} className="text-foreground font-semibold">
                {bp.slice(2, -2)}
              </strong>
            );
          }
          return bp;
        });
      });
    };

    // Regular paragraphs
    elements.push(
      <p
        key={`p-${i}`}
        className="text-muted-foreground leading-relaxed mb-4"
      >
        {renderInlineText(line, `l-${i}`)}
      </p>
    );
    i++;
  }

  return elements;
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="py-20 md:py-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Article header */}
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="primary" className="text-[11px]">
                {tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">
            {post.title}
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            {post.description}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-white/[0.06] pt-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.readTime}
            </span>
            <span>{post.author}</span>
          </div>
        </header>

        {/* Article content */}
        <article className="border-t border-white/[0.06] pt-10">
          {renderContent(post.content)}
        </article>

        {/* Footer tags */}
        <footer className="mt-12 pt-8 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
