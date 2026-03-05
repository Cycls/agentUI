import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

export const CodeBlock = ({ children, className, node, inline, ...props }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);

  const handleCopy = async () => {
    try {
      // Get the text content directly from the DOM element
      // This is more reliable than trying to parse React children
      const codeText = codeRef.current?.textContent || "";

      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  // Extract simple text content for inline detection
  const getTextContent = (children) => {
    if (typeof children === "string") return children;
    if (Array.isArray(children)) {
      return children.map(getTextContent).join("");
    }
    if (children?.props?.children) {
      return getTextContent(children.props.children);
    }
    return "";
  };

  const textContent = getTextContent(children);

  // Check if it's an inline code block
  const isInline = inline || !textContent.includes("\n");

  // Inline code - render normally
  if (isInline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  // Block code - add copy button overlay
  return (
    <div className="relative group">
      {/* Copy button overlay */}
      <button
        onClick={handleCopy}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-md shadow-sm z-10"
        title="Copy code"
      >
        {copied ? (
          <>
            <Check size={13} />
            <span>Copied!</span>
          </>
        ) : (
          <Copy size={13} />
        )}
      </button>

      {/* Original code rendering */}
      <code ref={codeRef} className={className} {...props}>
        {children}
      </code>
    </div>
  );
};
