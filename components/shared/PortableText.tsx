"use client";

import {
  PortableText as BasePortableText,
  type PortableTextComponents,
} from "@portabletext/react";
const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="font-sans text-[15px] leading-[1.8] text-fg/85 mb-5 last:mb-0">
        {children}
      </p>
    ),
    h2: ({ children }) => (
      <h2 className="font-serif text-2xl text-fg mt-10 mb-4 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-serif text-xl text-fg mt-8 mb-3 first:mt-0">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-accent pl-6 my-6 italic text-fg/70">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-medium text-fg">{children}</strong>
    ),
    em: ({ children }) => <em>{children}</em>,
    link: ({ value, children }) => {
      const href = value?.href || "#";
      const target = href.startsWith("http") ? "_blank" : undefined;
      return (
        <a
          href={href}
          target={target}
          rel={target === "_blank" ? "noopener noreferrer" : undefined}
          className="text-accent underline underline-offset-2 hover:text-fg transition-colors duration-200"
        >
          {children}
        </a>
      );
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc pl-6 my-4 space-y-1.5 text-fg/85 font-sans text-[15px] leading-[1.8]">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal pl-6 my-4 space-y-1.5 text-fg/85 font-sans text-[15px] leading-[1.8]">
        {children}
      </ol>
    ),
  },
};

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any[];
}

export default function PortableText({ value }: Props) {
  return <BasePortableText value={value} components={components} />;
}
