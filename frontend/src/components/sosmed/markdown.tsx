import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Perender markdown minimal untuk panduan SOP (US-042):
 * `# `, `## `, `- `, `**tebal**`, `[teks](url)`.
 * Baris lain menjadi paragraf biasa.
 */
export function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, index) => {
    const bold = /^\*\*(.+)\*\*$/.exec(part);
    if (bold) {
      return (
        <strong key={index} className="font-semibold">
          {bold[1]}
        </strong>
      );
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      return (
        <Link
          key={index}
          href={link[2] as string}
          className="text-primary underline-offset-4 hover:underline"
        >
          {link[1]}
        </Link>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export function Markdown({ content }: { content: string }) {
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];

  function flushList(keyPrefix: string) {
    if (listItems.length > 0) {
      blocks.push(
        <ul key={`${keyPrefix}-ul`} className="list-disc space-y-1 pl-5">
          {listItems.map((item, index) => (
            <li key={index} className="text-sm leading-6">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  }

  content.split("\n").forEach((line, index) => {
    if (line.startsWith("## ")) {
      flushList(`b${index}`);
      blocks.push(
        <h3 key={index} className="mt-4 text-base font-semibold first:mt-0">
          {renderInline(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      flushList(`b${index}`);
      blocks.push(
        <h2 key={index} className="text-xl font-bold first:mt-0">
          {renderInline(line.slice(2))}
        </h2>
      );
    } else if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
    } else if (line.trim() === "") {
      flushList(`b${index}`);
    } else {
      flushList(`b${index}`);
      blocks.push(
        <p key={index} className="text-sm leading-6">
          {renderInline(line)}
        </p>
      );
    }
  });
  flushList("end");

  return <div className="space-y-2">{blocks}</div>;
}
