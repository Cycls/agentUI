// prettier this!
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import { ClerkProvider, RedirectToSignIn, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

// inline functions are the devil in React!
const RawComponent = ({ children }) => <div className="not-prose">{children}</div>;

const LinkComponent = ({ href, onSend, ...props }) => {
  const handleClick = useCallback(e => {
    onSend(decodeURIComponent(href.slice('https://cycls.com/send/'.length)));
    e.preventDefault();
  }, [href, onSend]);

  return href.startsWith('https://cycls.com/send/')
    ? <a {...props} className={props.className || "underline decoration-gray-500/40 decoration-2 hover:decoration-gray-500/60"} href="#" onClick={handleClick}/>
    : <a {...props} href={href} target="_blank"/>;
};

const MarkdownRenderer = React.memo(({ markdown, onSend }) => {
  const components = useMemo(() => ({
    raw: RawComponent,
    a: (props) => <LinkComponent {...props} onSend={onSend}/> // should be one var
  }), [onSend]);

  return <div dir="auto">
        <Markdown
          components={components}
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeKatex, [rehypeHighlight, { ignoreMissing: true }]]}>
          {markdown}
        </Markdown>
      </div>;
});

const Textarea = ({ onSend }) => {
  const [message, setMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSend = () => {
    onSend(message);
    setMessage("")
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
      e.preventDefault();
      handleSend();
    }
  };

  return <div className="fixed bottom-3 inset-x-2 mx-auto flex max-w-2xl items-end rounded-3xl bg-gray-50/90 backdrop-blur p-2 border">
      <button onClick={() => onSend(":clear")} className="mb-1 border rounded-full bg-white hover:opacity-60">
        <svg className="h-8 w-8" width="24" height="24"></svg>
      </button>
      <textarea 
        className="flex-grow resize-none border-0 bg-transparent focus:ring-0"
        dir="auto" autoFocus tabIndex="0" rows={message.split('\n').length} placeholder="Message @agent"
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        value={message}
      />
      <button onClick={handleSend} className="mb-1 rounded-full bg-black hover:opacity-60 flex items-center justify-center w-8 h-8">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4L12 20M12 4L7 9M12 4L17 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>;
};

const MessageList = React.memo(({ messages, onSend }) => {
  const renderedMessages = useMemo(() =>
    messages.map((message, index) =>
      message.type === "request"
        ? <div key={index} className={/[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(message.content) ? 'flex justify-start' : 'flex justify-end'}>
              <div className="bg-gray-100 p-4 m-2 rounded-3xl max-w-4/5">
                <div dir="auto" style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
              </div>
            </div> : <MarkdownRenderer key={index} markdown={message.content} onSend={onSend}/>
    ),
    [messages, onSend]
  );
  return <>{renderedMessages}</>;
});

const Send = (messages, setMessages, setShouldFocus) => async (content) => {
    if (!content.trim()) {
      setShouldFocus(true); // empty input
      return;
    }
  
    if (content === ":clear") {
      setMessages([]);
      window.scrollTo(0, 0);
      return;
    }
  
    if (content.startsWith(":echo")) {
      setMessages(prev => [...prev, { type: "request", content }, { type: "response", content }]);
      window.scrollTo(0, document.body.scrollHeight);
      setShouldFocus(true);
      return;
    }
  
    setMessages(prev => [
      ...prev,
      { type: "request", content },
      { type: "response", content: "" }
    ]);
    window.scrollTo(0, document.body.scrollHeight);
  
    const newMessages = [...messages, { type: "request", content }];
    const context = newMessages.map(({ type, content }) => ({
      role: type === "request" ? "user" : "assistant",
      content
    }));
  
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (AUTH){
        const sessionToken = await Clerk.session?.getToken({ template: "template" });
        await Clerk.setActive({ organization: ORG });
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
  
      const response = await fetch("/", {
        method: "POST",
        headers: headers,
        // headers: {
        //   "Content-Type": "application/json",
        //   "Authorization": `Bearer ${sessionToken}`
        // },
        body: JSON.stringify({ messages: context })
      });
  
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullContent = "";
  
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
  
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].content = fullContent;
            return updated;
          });
  
          window.scrollTo(0, document.body.scrollHeight);
        }
      }
  
      setShouldFocus(true);
    } catch (err) {
      console.error("Fetch error:", err);
      setShouldFocus(true);
    }
  };
  

const App = () => {
  const [messages, setMessages] = useState([]);
  const [shouldFocus, setShouldFocus] = useState(false);

  useEffect(() => {
    if (shouldFocus) {
      const textarea = document.querySelector('textarea');
      textarea.focus();
      setShouldFocus(false);
    }
  }, [shouldFocus]);

  const send = useCallback(Send(messages, setMessages, setShouldFocus), [messages]);

  // remove prose-pre:p-0 hack and just intercept the renderer of react-mark
  // https://pagespeed.web.dev/
  return <div className="prose m-2 mx-auto max-w-2xl p-2 prose-pre:p-0">
      <MarkdownRenderer markdown={HEADER} onSend={send} />
      {messages.length === 0 ? <MarkdownRenderer markdown={INTRO} onSend={send} /> : null}
      <MessageList messages={messages} onSend={send} />
      <div className="opacity-0">
      <MarkdownRenderer markdown={"."} />
      <MarkdownRenderer markdown={"."} />
      <MarkdownRenderer markdown={"."} />
      </div>
      <Textarea onSend={send} />
    </div>;
};

const clerkProps = PROD ? {
  isSatellite: true,
  domain: "cycls.ai",
  signInUrl: "https://accounts.cycls.com/sign-in"
} : {};

// satellite redirect issue!
const container = document.getElementById('root');
const root = createRoot(container);
// root.render(
//     <ClerkProvider publishableKey={PUBLISHABLE_KEY} {...clerkProps}>
//       <SignedIn>
//         <div className="fixed right-2 top-2 z-50"><UserButton /></div>
//         <App />
//       </SignedIn>
//       <SignedOut>
//         <RedirectToSignIn />
//       </SignedOut>
//     </ClerkProvider>
//     );

if (AUTH){
  root.render(
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} {...clerkProps}>
      <SignedIn>
        <div className="fixed right-2 top-2 z-50"><UserButton /></div>
        <App />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </ClerkProvider>
    );
} 
else {
  root.render(<App />);
}
